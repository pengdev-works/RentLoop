-- ============================================================================
-- RentLoop Database Schema (PostgreSQL)
-- Secure Peer-to-Peer Item Rental and Trust Management Platform
-- ============================================================================

-- Extensions (UUID generation)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending_review')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    bio TEXT,
    address_city VARCHAR(100),
    address_province VARCHAR(100),
    trust_score NUMERIC(3, 2) DEFAULT 5.00,
    completed_rentals_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_profile_user UNIQUE (user_id)
);

-- 3. IDENTITY VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS identity_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    id_type VARCHAR(50) NOT NULL CHECK (id_type IN ('passport', 'drivers_license', 'national_id', 'student_id', 'other')),
    id_number VARCHAR(100) NOT NULL,
    front_image_url TEXT NOT NULL,
    back_image_url TEXT,
    selfie_image_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. ITEM CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS item_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_name VARCHAR(50) DEFAULT 'Package',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. ITEMS TABLE
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES item_categories(id) ON DELETE RESTRICT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    condition VARCHAR(30) NOT NULL CHECK (condition IN ('brand_new', 'like_new', 'good', 'fair')),
    rental_price NUMERIC(10, 2) NOT NULL CHECK (rental_price >= 0),
    price_basis VARCHAR(20) DEFAULT 'daily' CHECK (price_basis IN ('hourly', 'daily', 'weekly')),
    security_deposit NUMERIC(10, 2) DEFAULT 0.00 CHECK (security_deposit >= 0),
    location_city VARCHAR(100) NOT NULL,
    location_pickup_notes TEXT,
    rental_rules TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. ITEM IMAGES TABLE
CREATE TABLE IF NOT EXISTS item_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. RENTAL REQUESTS TABLE
CREATE TABLE IF NOT EXISTS rental_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    renter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    calculated_price NUMERIC(10, 2) NOT NULL,
    security_deposit NUMERIC(10, 2) DEFAULT 0.00,
    rental_purpose TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'expired')),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_rental_dates CHECK (end_date >= start_date)
);

-- 8. RENTALS TABLE (ACTIVE / COMPLETED TRANSACTIONS)
CREATE TABLE IF NOT EXISTS rentals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES rental_requests(id) ON DELETE RESTRICT,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    renter_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    security_deposit NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'ready_for_pickup' CHECK (
        status IN ('ready_for_pickup', 'active', 'return_pending', 'completed', 'disputed', 'cancelled')
    ),
    handover_date TIMESTAMP WITH TIME ZONE,
    returned_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_rental_request UNIQUE (request_id)
);

-- 9. RENTAL CONDITION REPORTS TABLE (TRUST VERIFICATION)
CREATE TABLE IF NOT EXISTS rental_condition_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    stage VARCHAR(20) NOT NULL CHECK (stage IN ('pre_rental', 'post_rental')),
    item_condition VARCHAR(30) NOT NULL,
    condition_notes TEXT NOT NULL,
    damages_noted TEXT,
    verified_by_counterpart BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. RENTAL CONDITION IMAGES TABLE
CREATE TABLE IF NOT EXISTS rental_condition_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES rental_condition_reports(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption VARCHAR(255),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. HANDOVER CONFIRMATIONS TABLE
CREATE TABLE IF NOT EXISTS handover_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
    stage VARCHAR(20) NOT NULL CHECK (stage IN ('handover', 'return')),
    owner_confirmed BOOLEAN DEFAULT FALSE,
    renter_confirmed BOOLEAN DEFAULT FALSE,
    owner_confirmed_at TIMESTAMP WITH TIME ZONE,
    renter_confirmed_at TIMESTAMP WITH TIME ZONE,
    handover_code VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_rental_review UNIQUE (rental_id, reviewer_id)
);

-- 13. REPORTS & DISPUTES TABLE
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reported_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
    rental_id UUID REFERENCES rentals(id) ON DELETE SET NULL,
    report_type VARCHAR(50) NOT NULL CHECK (
        report_type IN ('scam', 'damaged_item', 'harassment', 'misleading_listing', 'late_return', 'unfulfilled_agreement', 'other')
    ),
    description TEXT NOT NULL,
    evidence_urls TEXT,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    admin_notes TEXT,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    link_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_entity VARCHAR(50) NOT NULL,
    target_id VARCHAR(100),
    details_json TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR PERFORMANCE & SEARCH
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_owner ON items(owner_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status, is_available);
CREATE INDEX IF NOT EXISTS idx_rental_requests_item ON rental_requests(item_id);
CREATE INDEX IF NOT EXISTS idx_rental_requests_renter ON rental_requests(renter_id);
CREATE INDEX IF NOT EXISTS idx_rental_requests_owner ON rental_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_rental_requests_dates ON rental_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
