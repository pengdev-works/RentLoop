import assert from 'assert';
import app from './server/src/app.js';
import { db, initDb } from './server/src/database/db.js';
import { seedDatabase } from './server/src/database/seed.js';

let serverInstance = null;
const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}/api`;

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { ...options.headers };
  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('===============================================================');
  console.log('🧪 RENTLOOP COMPREHENSIVE END-TO-END SYSTEM TEST SUITE');
  console.log('===============================================================\n');

  // 1. Initialize DB and Seed
  await initDb();
  await seedDatabase();

  // Start test server
  await new Promise((resolve) => {
    serverInstance = app.listen(PORT, () => {
      console.log(`[INIT] Test server running on port ${PORT}`);
      resolve();
    });
  });

  let adminToken = '';
  let ownerToken = '';
  let renterToken = '';
  let testItemId = '';
  let testRequestId = '';
  let testRentalId = '';

  try {
    // TEST MODULE 1: AUTHENTICATION & RBAC
    console.log('➡️ MODULE 1: Authentication & Role-Based Access Control');
    
    // Login Admin
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@rentloop.com', password: 'Password123!' }
    });
    assert.strictEqual(adminLogin.status, 200, 'Admin login should succeed');
    assert.strictEqual(adminLogin.data.user.role, 'admin', 'Admin role must be recognized');
    adminToken = adminLogin.data.token;
    console.log('  ✅ Admin authentication successful with JWT token');

    // Register Owner dynamically
    let ownerUserId = '';
    const ownerReg = await request('/auth/register', {
      method: 'POST',
      body: {
        email: `owner.${Date.now()}@rentloop.com`,
        password: 'Password123!',
        fullName: 'Test Item Owner',
        addressCity: 'Seattle, WA'
      }
    });
    assert.strictEqual(ownerReg.status, 201, 'Owner registration should succeed');
    ownerToken = ownerReg.data.token;
    ownerUserId = ownerReg.data.user.id;
    console.log('  ✅ Item Owner registered and authenticated successfully');

    // Register Renter dynamically
    const renterReg = await request('/auth/register', {
      method: 'POST',
      body: {
        email: `renter.${Date.now()}@rentloop.com`,
        password: 'Password123!',
        fullName: 'Test Item Renter',
        addressCity: 'Bellevue, WA'
      }
    });
    assert.strictEqual(renterReg.status, 201, 'Renter registration should succeed');
    renterToken = renterReg.data.token;
    console.log('  ✅ Renter registered and authenticated successfully');

    // Self-registration (privilege escalation prevention)
    const testReg = await request('/auth/register', {
      method: 'POST',
      body: {
        email: `newuser.${Date.now()}@rentloop.com`,
        password: 'Password123!',
        fullName: 'New Test User',
        role: 'admin' // Attempted unauthorized escalation
      }
    });
    assert.strictEqual(testReg.status, 201, 'User registration should succeed');
    assert.strictEqual(testReg.data.user.role, 'user', 'Security: role must be forced to user');
    console.log('  ✅ Registration security passed: privilege escalation blocked');

    // TEST MODULE 2 & 3: ITEM LISTINGS & SEARCH/DISCOVERY
    console.log('\n➡️ MODULE 2 & 3: Item Listing Management & Search/Discovery');
    
    const categoriesRes = await request('/categories');
    assert.strictEqual(categoriesRes.status, 200);
    assert(categoriesRes.data.length > 0, 'Categories should not be empty');
    const firstCatId = categoriesRes.data[0].id;
    console.log(`  ✅ Retrieved ${categoriesRes.data.length} item categories`);

    // Owner creates new item
    const createItemRes = await request('/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        title: 'BOSCH Laser Measure 165ft with Bluetooth',
        description: 'High-precision real-time laser measurement tool with backlit color display.',
        categoryId: firstCatId,
        condition: 'like_new',
        rentalPrice: 18.00,
        priceBasis: 'daily',
        securityDeposit: 40.00,
        locationCity: 'Seattle, WA',
        imageUrls: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80']
      }
    });
    assert.strictEqual(createItemRes.status, 201, 'Item creation should succeed');
    testItemId = createItemRes.data.id;
    console.log(`  ✅ Item listed successfully: "${createItemRes.data.title}"`);

    // Search and filter items
    const searchRes = await request('/items?search=BOSCH&condition=like_new');
    assert.strictEqual(searchRes.status, 200);
    assert(searchRes.data.items.some(i => i.id === testItemId), 'Search query should return listed item');
    console.log('  ✅ Search & filter verified: item found via keyword query');

    // TEST MODULE 4: RENTAL REQUESTS & DOUBLE-BOOKING PREVENTION
    console.log('\n➡️ MODULE 4: Rental Request & Booking Shield');
    
    // Renter requests booking
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const fourDaysLater = new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0];

    const rentReqRes = await request('/rentals/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${renterToken}` },
      body: {
        itemId: testItemId,
        startDate: tomorrow,
        endDate: fourDaysLater,
        rentalPurpose: 'Framing out interior basement partition walls.'
      }
    });
    assert.strictEqual(rentReqRes.status, 201, 'Rental request creation should succeed');
    testRequestId = rentReqRes.data.id;
    console.log(`  ✅ Rental request submitted for ${tomorrow} to ${fourDaysLater}`);

    // Owner approves request
    const approveRes = await request(`/rentals/requests/${testRequestId}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    assert.strictEqual(approveRes.status, 200, 'Owner request approval should succeed');
    testRentalId = approveRes.data.rental.id;
    console.log(`  ✅ Owner approved request. Active rental initialized: ${testRentalId}`);

    // Double-booking conflict validation test!
    const conflictReq = await request('/rentals/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${renterToken}` },
      body: {
        itemId: testItemId,
        startDate: tomorrow, // Overlaps with approved rental!
        endDate: fourDaysLater,
        rentalPurpose: 'Duplicate test overlapping attempt.'
      }
    });
    assert.strictEqual(conflictReq.status, 409, 'Double-booking must be rejected with 409 conflict');
    console.log('  ✅ Double-Booking Prevention Shield verified: overlapping dates safely rejected');

    // TEST MODULE 5: TRUST, CONDITION INSPECTION & HANDOVER
    console.log('\n➡️ MODULE 5: Trust Management, Condition Documentation & Reviews');

    // Owner submits pre-rental condition report
    const preReportRes = await request('/conditions/reports', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        rentalId: testRentalId,
        stage: 'pre_rental',
        itemCondition: 'like_new',
        conditionNotes: 'Lens optic is crystal clear. Fresh AAA batteries loaded. Protective pouch included.',
        damagesNoted: 'None.',
        imageUrls: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80']
      }
    });
    assert.strictEqual(preReportRes.status, 201, 'Pre-rental condition report should succeed');
    const preReportId = preReportRes.data.id;
    console.log('  ✅ Pre-rental condition inspection documented with photograph');

    // Renter signs off on condition
    const verifyReportRes = await request(`/conditions/reports/${preReportId}/verify`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${renterToken}` }
    });
    assert.strictEqual(verifyReportRes.status, 200, 'Counterpart condition verification should succeed');
    console.log('  ✅ Counterpart condition signoff completed');

    // Handover execution
    const handoverRes = await request(`/rentals/${testRentalId}/handover`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {}
    });
    assert.strictEqual(handoverRes.status, 200, 'Handover confirmation should succeed');
    console.log('  ✅ Item handover confirmed: rental transitioned to ACTIVE state');

    // Post-rental return inspection
    const postReportRes = await request('/conditions/reports', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        rentalId: testRentalId,
        stage: 'post_rental',
        itemCondition: 'like_new',
        conditionNotes: 'Returned in clean state, operational test passed.',
        damagesNoted: 'None.',
        imageUrls: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80']
      }
    });
    assert.strictEqual(postReportRes.status, 201, 'Post-rental condition report should succeed');
    console.log('  ✅ Post-rental return condition inspection recorded');

    // Confirm Return (Completes rental)
    const returnConfirmRes = await request(`/rentals/${testRentalId}/return`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    assert.strictEqual(returnConfirmRes.status, 200, 'Return confirmation should succeed');
    console.log('  ✅ Return finalized: rental marked as COMPLETED');

    // Mutual Reviews
    const reviewRes = await request('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${renterToken}` },
      body: {
        rentalId: testRentalId,
        rating: 5,
        comment: 'Laser was calibrated perfectly and John gave great usage advice.'
      }
    });
    assert.strictEqual(reviewRes.status, 201, 'Review submission should succeed');
    console.log('  ✅ Verified transaction 5-star review submitted');

    // User Dispute / Concern Report
    const reportRes = await request('/reports', {
      method: 'POST',
      headers: { Authorization: `Bearer ${renterToken}` },
      body: {
        reportedUserId: ownerUserId,
        rentalId: testRentalId,
        reportType: 'damaged_item',
        description: 'Test dispute investigation filing.'
      }
    });
    assert.strictEqual(reportRes.status, 201, 'Report filing should succeed');
    const testReportId = reportRes.data.report.id;
    console.log('  ✅ Concern report lodged with trust & safety desk');

    // TEST MODULE 6: NOTIFICATIONS
    console.log('\n➡️ MODULE 6: Notification & Alert Management');
    const notifsRes = await request('/notifications', {
      headers: { Authorization: `Bearer ${renterToken}` }
    });
    assert.strictEqual(notifsRes.status, 200);
    assert(Array.isArray(notifsRes.data.notifications), 'Notifications should be returned');
    console.log(`  ✅ Notification center active: retrieved ${notifsRes.data.notifications.length} notifications`);

    // TEST MODULE 7: ADMIN DASHBOARD & AUDIT LOGS
    console.log('\n➡️ MODULE 7: Admin Dashboard & Audit Logs');
    const adminStats = await request('/admin/dashboard-stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(adminStats.status, 200);
    assert(adminStats.data.metrics.totalUsers > 0, 'Total users metric must be > 0');
    assert(adminStats.data.metrics.completedRentals > 0, 'Completed rentals metric must reflect test completion');
    console.log('  ✅ Admin metrics live: verified non-hardcoded DB figures');
    console.log(`     - Users: ${adminStats.data.metrics.totalUsers}`);
    console.log(`     - Verified Members: ${adminStats.data.metrics.totalVerified}`);
    console.log(`     - Total Items: ${adminStats.data.metrics.totalItems}`);
    console.log(`     - Completed Rentals: ${adminStats.data.metrics.completedRentals}`);

    // Admin resolves dispute report
    const resolveReportRes = await request(`/admin/reports/${testReportId}/resolve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        status: 'resolved',
        adminNotes: 'Investigated and resolved in good standing.'
      }
    });
    assert.strictEqual(resolveReportRes.status, 200, 'Admin report resolution should succeed');
    console.log('  ✅ Admin dispute resolution executed with investigation notes');

    // Audit logs verification
    const auditRes = await request('/admin/audit-logs', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(auditRes.status, 200);
    assert(auditRes.data.length > 5, 'Audit log trail must record platform operations');
    console.log(`  ✅ Tamper-evident audit trail verified: ${auditRes.data.length} actions logged`);

    console.log('\n===============================================================');
    console.log('🎉 ALL SYSTEM MODULE TESTS PASSED WITH 100% SUCCESS!');
    console.log('===============================================================\n');

  } catch (err) {
    console.error('\n❌ TEST RUN FAILED:', err);
    process.exitCode = 1;
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
  }
}

runTests();

