import bcrypt from 'bcryptjs';
import { db, initDb } from './db.js';

export async function seedDatabase() {
  await initDb();
  console.log('🌱 Starting database seeding for RentLoop...');

  // Reset store if local
  if (!db.isPostgres()) {
    db.resetStore();
  }

  // 1. Hash default password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  // 2. Seed Users
  const adminUser = await db.insert('users', {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@rentloop.com',
    password_hash: passwordHash,
    full_name: 'RentLoop System Admin',
    phone: '+1 (555) 019-2834',
    role: 'admin',
    status: 'active'
  });

  const ownerUser = await db.insert('users', {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'john.owner@rentloop.com',
    password_hash: passwordHash,
    full_name: 'Johnathan Miller',
    phone: '+1 (555) 349-8812',
    role: 'user',
    status: 'active'
  });

  const renterUser = await db.insert('users', {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'sarah.renter@rentloop.com',
    password_hash: passwordHash,
    full_name: 'Sarah Jenkins',
    phone: '+1 (555) 892-4411',
    role: 'user',
    status: 'active'
  });

  const pendingUser = await db.insert('users', {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'david.user@rentloop.com',
    password_hash: passwordHash,
    full_name: 'David Thorne',
    phone: '+1 (555) 773-9021',
    role: 'user',
    status: 'active'
  });

  // 3. User Profiles
  await db.insert('user_profiles', {
    user_id: adminUser.id,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    bio: 'Lead platform administrator and trust & safety officer at RentLoop.',
    address_city: 'Seattle',
    address_province: 'WA',
    trust_score: 5.00,
    completed_rentals_count: 0
  });

  await db.insert('user_profiles', {
    user_id: ownerUser.id,
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    bio: 'Avid DIY craftsman and outdoor adventurer. Taking meticulous care of quality tools and gear.',
    address_city: 'Seattle',
    address_province: 'WA',
    trust_score: 4.95,
    completed_rentals_count: 14
  });

  await db.insert('user_profiles', {
    user_id: renterUser.id,
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    bio: 'Freelance photographer and weekend camper. Respectful, punctual, and reliable borrower.',
    address_city: 'Bellevue',
    address_province: 'WA',
    trust_score: 4.88,
    completed_rentals_count: 8
  });

  await db.insert('user_profiles', {
    user_id: pendingUser.id,
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    bio: 'New community member looking forward to renting workshop machinery.',
    address_city: 'Tacoma',
    address_province: 'WA',
    trust_score: 5.00,
    completed_rentals_count: 0
  });

  // 4. Identity Verifications
  await db.insert('identity_verifications', {
    id: 'v1111111-1111-1111-1111-111111111111',
    user_id: ownerUser.id,
    id_type: 'drivers_license',
    id_number: 'WA-DL-8923019',
    front_image_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    back_image_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    selfie_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    status: 'verified',
    rejection_reason: null,
    reviewed_by: adminUser.id,
    reviewed_at: new Date(Date.now() - 30 * 86400000).toISOString()
  });

  await db.insert('identity_verifications', {
    id: 'v2222222-2222-2222-2222-222222222222',
    user_id: renterUser.id,
    id_type: 'passport',
    id_number: 'US-PASS-592810',
    front_image_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    back_image_url: null,
    selfie_image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    status: 'verified',
    rejection_reason: null,
    reviewed_by: adminUser.id,
    reviewed_at: new Date(Date.now() - 25 * 86400000).toISOString()
  });

  await db.insert('identity_verifications', {
    id: 'v3333333-3333-3333-3333-333333333333',
    user_id: pendingUser.id,
    id_type: 'national_id',
    id_number: 'NAT-ID-7819024',
    front_image_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    back_image_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    selfie_image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    status: 'pending',
    rejection_reason: null,
    reviewed_by: null,
    reviewed_at: null
  });

  // 5. Item Categories
  const catTools = await db.insert('item_categories', {
    name: 'Power Tools & Workshop',
    slug: 'power-tools-workshop',
    description: 'Drills, saws, sanders, generators, and professional woodworking & construction equipment.',
    icon_name: 'Wrench',
    is_active: true
  });

  const catCameras = await db.insert('item_categories', {
    name: 'Cameras & Photography',
    slug: 'cameras-photography',
    description: 'Mirrorless cameras, prime lenses, gimbals, lighting rigs, and professional drone gear.',
    icon_name: 'Camera',
    is_active: true
  });

  const catOutdoor = await db.insert('item_categories', {
    name: 'Outdoor & Camping',
    slug: 'outdoor-camping',
    description: 'Four-season tents, sleeping systems, portable stoves, kayaks, and hiking backpacks.',
    icon_name: 'Compass',
    is_active: true
  });

  const catAV = await db.insert('item_categories', {
    name: 'Audio & Visual Electronics',
    slug: 'audio-visual',
    description: 'PA speakers, high-lumen projectors, wireless microphones, and DJ controllers.',
    icon_name: 'Speaker',
    is_active: true
  });

  const catEvents = await db.insert('item_categories', {
    name: 'Party & Event Supplies',
    slug: 'party-event',
    description: 'Canopies, banquet tables, folding chairs, fog machines, and outdoor heaters.',
    icon_name: 'Sparkles',
    is_active: true
  });

  // 6. Items & Images
  const item1 = await db.insert('items', {
    id: 'item-001',
    owner_id: ownerUser.id,
    category_id: catCameras.id,
    title: 'Sony Alpha A7 IV Mirrorless Camera + 24-70mm f/2.8 GM Lens',
    description: '33MP full-frame hybrid mirrorless camera with 4K 60p 10-bit recording. Included with two batteries, fast dual charger, 128GB V90 SD card, and Sony FE 24-70mm f/2.8 GM lens with UV filter.',
    condition: 'like_new',
    rental_price: 55.00,
    price_basis: 'daily',
    security_deposit: 150.00,
    location_city: 'Seattle, WA (Capitol Hill)',
    location_pickup_notes: 'Pickup at secure residential building with 15-min visitor parking stall.',
    rental_rules: 'Strictly no underwater or extreme desert use without approved protective housing. Must return with sanitized lens glass.',
    status: 'active',
    is_available: true
  });

  await db.insert('item_images', {
    item_id: item1.id,
    image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    is_primary: true,
    sort_order: 1
  });

  await db.insert('item_images', {
    item_id: item1.id,
    image_url: 'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?auto=format&fit=crop&w=800&q=80',
    is_primary: false,
    sort_order: 2
  });

  const item2 = await db.insert('items', {
    id: 'item-002',
    owner_id: ownerUser.id,
    category_id: catTools.id,
    title: 'DeWalt 20V MAX Cordless Brushless Combo Kit (5 Tools)',
    description: 'Heavy-duty 5-tool kit including hammer drill, impact driver, reciprocating saw, 6-1/2" circular saw, and worklight. Comes with two 5.0Ah high-capacity batteries, fast charger, and ballistic nylon tote bag.',
    condition: 'good',
    rental_price: 32.00,
    price_basis: 'daily',
    security_deposit: 80.00,
    location_city: 'Seattle, WA (Ballard)',
    location_pickup_notes: 'Workshop entrance on rear alley. Free street parking available.',
    rental_rules: 'Please blow off sawdust before returning. Keep all bits and saw blades organized in their designated cases.',
    status: 'active',
    is_available: true
  });

  await db.insert('item_images', {
    item_id: item2.id,
    image_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
    is_primary: true,
    sort_order: 1
  });

  const item3 = await db.insert('items', {
    id: 'item-003',
    owner_id: ownerUser.id,
    category_id: catOutdoor.id,
    title: 'MSR Hubba Hubba 3-Person Lightweight Backpacking Tent',
    description: 'Ultra-lightweight 3-season tent with freestanding Easton Syclone composite poles. Full rainfly with two large vestibules. Weighs under 3.5 lbs packed. Fully waterproof taped seams.',
    condition: 'like_new',
    rental_price: 24.00,
    price_basis: 'daily',
    security_deposit: 60.00,
    location_city: 'Seattle, WA (Green Lake)',
    location_pickup_notes: 'Porch pickup with secure digital lockbox available 24/7.',
    rental_rules: 'Never pack away wet. If it rains during your trip, please hang dry before packing or notify owner upon return.',
    status: 'active',
    is_available: true
  });

  await db.insert('item_images', {
    item_id: item3.id,
    image_url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80',
    is_primary: true,
    sort_order: 1
  });

  const item4 = await db.insert('items', {
    id: 'item-004',
    owner_id: ownerUser.id,
    category_id: catAV.id,
    title: 'Epson Pro 4K UHD Home Theater Projector (3,000 Lumens)',
    description: 'Crisp 4K HDR home theater projector with dual HDMI 2.0 inputs, low input lag for gaming, and ultra-quiet cooling fan. Includes 100-inch portable collapsible tripod projection screen.',
    condition: 'like_new',
    rental_price: 45.00,
    price_basis: 'daily',
    security_deposit: 120.00,
    location_city: 'Bellevue, WA (Downtown)',
    location_pickup_notes: 'Front lobby concierge desk handover.',
    rental_rules: 'Handle projector lamp assembly with care. Do not unplug while the fan is cooling down.',
    status: 'active',
    is_available: true
  });

  await db.insert('item_images', {
    item_id: item4.id,
    image_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
    is_primary: true,
    sort_order: 1
  });

  // 7. Completed Rental Scenario (Historical Proof of Trust)
  const reqCompleted = await db.insert('rental_requests', {
    id: 'req-completed-001',
    item_id: item1.id,
    renter_id: renterUser.id,
    owner_id: ownerUser.id,
    start_date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
    end_date: new Date(Date.now() - 11 * 86400000).toISOString().split('T')[0],
    calculated_price: 165.00,
    security_deposit: 150.00,
    rental_purpose: 'Commercial architecture photoshoot in downtown Seattle.',
    status: 'approved'
  });

  const rentalCompleted = await db.insert('rentals', {
    id: 'rent-completed-001',
    request_id: reqCompleted.id,
    item_id: item1.id,
    renter_id: renterUser.id,
    owner_id: ownerUser.id,
    start_date: reqCompleted.start_date,
    end_date: reqCompleted.end_date,
    total_amount: 165.00,
    security_deposit: 150.00,
    status: 'completed',
    handover_date: new Date(Date.now() - 14 * 86400000).toISOString(),
    returned_date: new Date(Date.now() - 11 * 86400000).toISOString()
  });

  // Pre-Rental Condition Report
  const preReport = await db.insert('rental_condition_reports', {
    id: 'report-pre-001',
    rental_id: rentalCompleted.id,
    reported_by: ownerUser.id,
    stage: 'pre_rental',
    item_condition: 'like_new',
    condition_notes: 'Camera body inspected together. Lens glass is spotless, sensor clean, shutter count at 2,410. Batteries fully charged.',
    damages_noted: 'Minor surface rub mark on battery door plastic; cosmetic only.',
    verified_by_counterpart: true
  });

  await db.insert('rental_condition_images', {
    report_id: preReport.id,
    image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
    caption: 'Front optic inspection showing clean front element.'
  });

  // Post-Rental Return Condition Report
  const postReport = await db.insert('rental_condition_reports', {
    id: 'report-post-001',
    rental_id: rentalCompleted.id,
    reported_by: ownerUser.id,
    stage: 'post_rental',
    item_condition: 'like_new',
    condition_notes: 'Returned in pristine condition with all accessories, lens caps, charger, and SD card intact.',
    damages_noted: 'None. Item returned exactly as issued.',
    verified_by_counterpart: true
  });

  await db.insert('rental_condition_images', {
    report_id: postReport.id,
    image_url: 'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?auto=format&fit=crop&w=600&q=80',
    caption: 'Inspection upon return at owner studio.'
  });

  // Handover confirmation
  await db.insert('handover_confirmations', {
    rental_id: rentalCompleted.id,
    stage: 'handover',
    owner_confirmed: true,
    renter_confirmed: true,
    owner_confirmed_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    renter_confirmed_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    handover_code: 'RL-9281'
  });

  await db.insert('handover_confirmations', {
    rental_id: rentalCompleted.id,
    stage: 'return',
    owner_confirmed: true,
    renter_confirmed: true,
    owner_confirmed_at: new Date(Date.now() - 11 * 86400000).toISOString(),
    renter_confirmed_at: new Date(Date.now() - 11 * 86400000).toISOString(),
    handover_code: 'RL-4192'
  });

  // Mutual Reviews
  await db.insert('reviews', {
    rental_id: rentalCompleted.id,
    reviewer_id: renterUser.id,
    reviewee_id: ownerUser.id,
    rating: 5,
    comment: 'Johnathan was an incredible owner. The Sony A7 IV was well calibrated, packaged safely, and his pre-rental walkthrough was super thorough.'
  });

  await db.insert('reviews', {
    rental_id: rentalCompleted.id,
    reviewer_id: ownerUser.id,
    reviewee_id: renterUser.id,
    rating: 5,
    comment: 'Sarah took superb care of high-end camera glass. Handed over on time, returned clean and organized. Highly recommended renter!'
  });

  // 8. Active Rental Scenario (Currently in progress)
  const reqActive = await db.insert('rental_requests', {
    id: 'req-active-002',
    item_id: item2.id,
    renter_id: renterUser.id,
    owner_id: ownerUser.id,
    start_date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    calculated_price: 96.00,
    security_deposit: 80.00,
    rental_purpose: 'Weekend deck renovation and pergolas building.',
    status: 'approved'
  });

  const rentalActive = await db.insert('rentals', {
    id: 'rent-active-002',
    request_id: reqActive.id,
    item_id: item2.id,
    renter_id: renterUser.id,
    owner_id: ownerUser.id,
    start_date: reqActive.start_date,
    end_date: reqActive.end_date,
    total_amount: 96.00,
    security_deposit: 80.00,
    status: 'active',
    handover_date: new Date(Date.now() - 1 * 86400000).toISOString(),
    returned_date: null
  });

  const activePreReport = await db.insert('rental_condition_reports', {
    id: 'report-pre-002',
    rental_id: rentalActive.id,
    reported_by: ownerUser.id,
    stage: 'pre_rental',
    item_condition: 'good',
    condition_notes: 'All 5 tools tested and spinning true. Battery contacts clean, cases stocked with standard bits.',
    damages_noted: 'Usual superficial scratches on drill chuck exterior from previous job.',
    verified_by_counterpart: true
  });

  await db.insert('rental_condition_images', {
    report_id: activePreReport.id,
    image_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
    caption: 'DeWalt combo tool inventory check.'
  });

  await db.insert('handover_confirmations', {
    rental_id: rentalActive.id,
    stage: 'handover',
    owner_confirmed: true,
    renter_confirmed: true,
    owner_confirmed_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    renter_confirmed_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    handover_code: 'RL-5521'
  });

  // 9. Pending Rental Request (For review in owner dashboard)
  await db.insert('rental_requests', {
    id: 'req-pending-003',
    item_id: item3.id,
    renter_id: renterUser.id,
    owner_id: ownerUser.id,
    start_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0],
    calculated_price: 72.00,
    security_deposit: 60.00,
    rental_purpose: 'Three-day backpacking excursion at Mount Rainier National Park.',
    status: 'pending'
  });

  // 10. Reports / Disputes (For Admin testing)
  await db.insert('reports', {
    id: 'rep-001',
    reporter_id: ownerUser.id,
    reported_user_id: pendingUser.id,
    reported_item_id: null,
    rental_id: null,
    report_type: 'misleading_listing',
    description: 'User initiated an off-platform payment solicitation attempt in messaging inquiry.',
    evidence_urls: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80',
    status: 'pending',
    admin_notes: null
  });

  // 11. Notifications
  await db.insert('notifications', {
    user_id: ownerUser.id,
    title: 'New Rental Request Received',
    message: 'Sarah Jenkins requested to rent your "MSR Hubba Hubba 3-Person Backpacking Tent" for 3 days.',
    type: 'rental_request',
    link_url: '/owner/requests',
    is_read: false
  });

  await db.insert('notifications', {
    user_id: renterUser.id,
    title: 'Active Rental Reminder',
    message: 'Your active rental for "DeWalt 20V MAX Cordless Brushless Combo Kit" is scheduled for return in 2 days.',
    type: 'reminder',
    link_url: '/renter/rentals',
    is_read: false
  });

  await db.insert('notifications', {
    user_id: adminUser.id,
    title: 'Pending Verification Requires Review',
    message: 'David Thorne has submitted identity documents awaiting administrative review.',
    type: 'system',
    link_url: '/admin/verifications',
    is_read: false
  });

  // 12. Audit Logs
  await db.insert('audit_logs', {
    actor_id: adminUser.id,
    action: 'SYSTEM_INITIALIZATION',
    target_entity: 'SYSTEM',
    target_id: 'GLOBAL',
    details_json: JSON.stringify({ event: 'RentLoop database initialized with secure seed data and RBAC profiles' }),
    ip_address: '127.0.0.1'
  });

  console.log('✅ RentLoop database seeded successfully with comprehensive, realistic records!');
}

// Allow direct CLI execution
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().then(() => process.exit(0)).catch(err => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
}
