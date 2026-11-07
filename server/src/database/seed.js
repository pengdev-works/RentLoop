import bcrypt from 'bcryptjs';
import { db, initDb } from './db.js';

export async function seedDatabase() {
  await initDb();
  console.log('🌱 Initializing RentLoop database (Admin & System Categories only)...');

  // Reset store if local
  if (!db.isPostgres()) {
    db.resetStore();
  }

  // 1. Hash default admin password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  // 2. Seed Only System Admin User (idempotent check)
  let adminUser = await db.findOne('users', { email: 'admin@rentloop.com' });
  if (!adminUser) {
    adminUser = await db.insert('users', {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'admin@rentloop.com',
      password_hash: passwordHash,
      full_name: 'RentLoop System Admin',
      phone: '+63 917 888 2026',
      role: 'admin',
      status: 'active'
    });

    // Admin Profile
    await db.insert('user_profiles', {
      user_id: adminUser.id,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      bio: 'Lead platform administrator and trust & safety officer at RentLoop Philippines.',
      address_city: 'Quezon City',
      address_province: 'Metro Manila',
      trust_score: 5.00,
      completed_rentals_count: 0
    });
  }

  // 3. System Item Categories (essential structure for listing items)
  const defaultCategories = [
    {
      name: 'Power Tools & Workshop',
      slug: 'power-tools-workshop',
      description: 'Drills, saws, sanders, generators, and woodworking equipment.',
      icon_name: 'Wrench'
    },
    {
      name: 'Cameras & Photography',
      slug: 'cameras-photography',
      description: 'Mirrorless cameras, prime lenses, gimbals, lighting rigs, and drone gear.',
      icon_name: 'Camera'
    },
    {
      name: 'Outdoor & Camping',
      slug: 'outdoor-camping',
      description: 'Four-season tents, sleeping systems, stoves, kayaks, and backpacks.',
      icon_name: 'Compass'
    },
    {
      name: 'Audio & Visual Electronics',
      slug: 'audio-visual',
      description: 'PA speakers, high-lumen projectors, microphones, and audio mixers.',
      icon_name: 'Speaker'
    },
    {
      name: 'Party & Event Supplies',
      slug: 'party-event',
      description: 'Canopies, folding tables, chairs, lighting, and event sound systems.',
      icon_name: 'Sparkles'
    }
  ];

  for (const cat of defaultCategories) {
    const existing = await db.findOne('item_categories', { slug: cat.slug });
    if (!existing) {
      await db.insert('item_categories', { ...cat, is_active: true });
    }
  }

  // 4. Initial System Notification for Admin
  await db.insert('notifications', {
    user_id: adminUser.id,
    title: 'System Ready',
    message: 'RentLoop platform initialized cleanly with System Administrator privileges.',
    type: 'system',
    link_url: '/admin/dashboard',
    is_read: false
  });

  // 5. Audit Log Entry
  await db.insert('audit_logs', {
    actor_id: adminUser.id,
    action: 'SYSTEM_INITIALIZATION',
    target_entity: 'SYSTEM',
    target_id: 'GLOBAL',
    details_json: JSON.stringify({ event: 'RentLoop initialized cleanly with admin account and system categories only' }),
    ip_address: '127.0.0.1'
  });

  console.log('✅ RentLoop database initialized: Only Admin and System Categories are seeded.');
}

// Allow direct CLI execution
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().then(() => process.exit(0)).catch(err => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
}
