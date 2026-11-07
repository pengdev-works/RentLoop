import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, '../../data/rentloop.db.json');

const { Pool } = pg;

let pgPool = null;
let usePostgres = false;

// Embedded store initial template
const initialTables = {
  users: [],
  user_profiles: [],
  identity_verifications: [],
  item_categories: [],
  items: [],
  item_images: [],
  rental_requests: [],
  rentals: [],
  rental_condition_reports: [],
  rental_condition_images: [],
  handover_confirmations: [],
  reviews: [],
  reports: [],
  notifications: [],
  audit_logs: []
};

// In-memory cache synced to disk
let memoryStore = { ...initialTables };

function loadLocalStore() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      memoryStore = { ...initialTables, ...data };
    } else {
      saveLocalStore();
    }
  } catch (err) {
    console.error('Error loading local database file, reinitializing:', err.message);
    memoryStore = { ...initialTables };
    saveLocalStore();
  }
}

function saveLocalStore() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist database to disk:', err.message);
  }
}

// Initialize database
export async function initDb() {
  if (config.databaseUrl && config.databaseUrl.trim() !== '') {
    try {
      pgPool = new Pool({
        connectionString: config.databaseUrl,
        ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false
      });
      const client = await pgPool.connect();
      client.release();
      usePostgres = true;
      console.log(' Connected to PostgreSQL database successfully.');
      return;
    } catch (err) {
      console.warn('⚠️ PostgreSQL connection failed:', err.message);
      console.warn(' Falling back to local embedded database store for development.');
    }
  }

  usePostgres = false;
  loadLocalStore();
  console.log(' Local database store initialized and ready at:', DB_FILE);
}

// Core unified query runner
export const db = {
  isPostgres: () => usePostgres,

  async query(text, params = []) {
    if (usePostgres && pgPool) {
      return await pgPool.query(text, params);
    }
    // Fallback SQL-like evaluator for basic queries
    return executeLocalQuery(text, params);
  },

  // High-level safe CRUD helpers for clean, reliable code across drivers
  async findOne(table, conditions = {}) {
    if (usePostgres && pgPool) {
      const keys = Object.keys(conditions);
      let queryStr = `SELECT * FROM ${table}`;
      const values = [];
      if (keys.length > 0) {
        const whereClauses = keys.map((k, i) => `${k} = $${i + 1}`);
        queryStr += ` WHERE ${whereClauses.join(' AND ')}`;
        values.push(...keys.map(k => conditions[k]));
      }
      queryStr += ` LIMIT 1`;
      const res = await pgPool.query(queryStr, values);
      return res.rows[0] || null;
    }

    const items = memoryStore[table] || [];
    const found = items.find(item => {
      for (const key of Object.keys(conditions)) {
        if (item[key] !== conditions[key]) return false;
      }
      return true;
    });
    return found ? { ...found } : null;
  },

  async find(table, conditions = {}, options = {}) {
    if (usePostgres && pgPool) {
      const keys = Object.keys(conditions);
      let queryStr = `SELECT * FROM ${table}`;
      const values = [];
      if (keys.length > 0) {
        const whereClauses = keys.map((k, i) => `${k} = $${i + 1}`);
        queryStr += ` WHERE ${whereClauses.join(' AND ')}`;
        values.push(...keys.map(k => conditions[k]));
      }
      if (options.orderBy) {
        queryStr += ` ORDER BY ${options.orderBy} ${options.orderDirection || 'ASC'}`;
      }
      if (options.limit) {
        queryStr += ` LIMIT ${options.limit}`;
      }
      if (options.offset) {
        queryStr += ` OFFSET ${options.offset}`;
      }
      const res = await pgPool.query(queryStr, values);
      return res.rows;
    }

    let items = [...(memoryStore[table] || [])];

    // Filter
    if (Object.keys(conditions).length > 0) {
      items = items.filter(item => {
        for (const key of Object.keys(conditions)) {
          if (conditions[key] !== undefined && item[key] !== conditions[key]) {
            return false;
          }
        }
        return true;
      });
    }

    // Sort
    if (options.orderBy) {
      const dir = (options.orderDirection || 'asc').toLowerCase() === 'desc' ? -1 : 1;
      items.sort((a, b) => {
        const valA = a[options.orderBy];
        const valB = b[options.orderBy];
        if (valA === valB) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;
        return valA > valB ? dir : -dir;
      });
    }

    // Pagination
    if (options.offset) {
      items = items.slice(options.offset);
    }
    if (options.limit) {
      items = items.slice(0, options.limit);
    }

    return items;
  },

  async insert(table, data) {
    const id = data.id || uuidv4();
    const now = new Date().toISOString();
    const record = {
      ...data,
      id,
      created_at: data.created_at || now,
      updated_at: data.updated_at || now
    };

    if (usePostgres && pgPool) {
      const keys = Object.keys(record);
      const cols = keys.join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const values = keys.map(k => record[k]);
      const queryStr = `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) RETURNING *`;
      const res = await pgPool.query(queryStr, values);
      return res.rows[0];
    }

    if (!memoryStore[table]) memoryStore[table] = [];
    memoryStore[table].push(record);
    saveLocalStore();
    return { ...record };
  },

  async update(table, conditions, updateData) {
    const now = new Date().toISOString();
    const toUpdate = { ...updateData, updated_at: now };

    if (usePostgres && pgPool) {
      const updateKeys = Object.keys(toUpdate);
      const condKeys = Object.keys(conditions);

      const setClauses = updateKeys.map((k, i) => `${k} = $${i + 1}`);
      const whereClauses = condKeys.map((k, i) => `${k} = $${i + 1 + updateKeys.length}`);

      const values = [...updateKeys.map(k => toUpdate[k]), ...condKeys.map(k => conditions[k])];
      const queryStr = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')} RETURNING *`;
      const res = await pgPool.query(queryStr, values);
      return res.rows;
    }

    const items = memoryStore[table] || [];
    const updated = [];

    items.forEach((item, index) => {
      let matches = true;
      for (const k of Object.keys(conditions)) {
        if (item[k] !== conditions[k]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        items[index] = { ...item, ...toUpdate };
        updated.push(items[index]);
      }
    });

    if (updated.length > 0) {
      saveLocalStore();
    }
    return updated;
  },

  async delete(table, conditions) {
    if (usePostgres && pgPool) {
      const keys = Object.keys(conditions);
      const whereClauses = keys.map((k, i) => `${k} = $${i + 1}`);
      const values = keys.map(k => conditions[k]);
      const queryStr = `DELETE FROM ${table} WHERE ${whereClauses.join(' AND ')} RETURNING *`;
      const res = await pgPool.query(queryStr, values);
      return res.rows;
    }

    const items = memoryStore[table] || [];
    const remaining = [];
    const deleted = [];

    items.forEach(item => {
      let matches = true;
      for (const k of Object.keys(conditions)) {
        if (item[k] !== conditions[k]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        deleted.push(item);
      } else {
        remaining.push(item);
      }
    });

    memoryStore[table] = remaining;
    if (deleted.length > 0) {
      saveLocalStore();
    }
    return deleted;
  },

  async count(table, conditions = {}) {
    if (usePostgres && pgPool) {
      const keys = Object.keys(conditions);
      let queryStr = `SELECT COUNT(*) AS count FROM ${table}`;
      const values = [];
      if (keys.length > 0) {
        const whereClauses = keys.map((k, i) => `${k} = $${i + 1}`);
        queryStr += ` WHERE ${whereClauses.join(' AND ')}`;
        values.push(...keys.map(k => conditions[k]));
      }
      const res = await pgPool.query(queryStr, values);
      return parseInt(res.rows[0].count, 10);
    }

    const items = memoryStore[table] || [];
    if (Object.keys(conditions).length === 0) {
      return items.length;
    }
    return items.filter(item => {
      for (const k of Object.keys(conditions)) {
        if (item[k] !== conditions[k]) return false;
      }
      return true;
    }).length;
  },

  getStore() {
    return memoryStore;
  },

  resetStore() {
    memoryStore = { ...initialTables };
    saveLocalStore();
  }
};

// Fallback basic SQL query processor for local store
function executeLocalQuery(text, params) {
  const clean = text.trim();
  if (clean.toLowerCase().startsWith('select count(*)')) {
    const match = clean.match(/from\s+([a-zA-Z0-9_]+)/i);
    if (match) {
      const table = match[1];
      const count = (memoryStore[table] || []).length;
      return { rows: [{ count: count.toString() }], rowCount: 1 };
    }
  }
  return { rows: [], rowCount: 0 };
}
