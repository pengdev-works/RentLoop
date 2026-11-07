import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShieldCheck,
  Camera,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Award,
  Layers,
  Wrench,
  Compass,
  Speaker
} from 'lucide-react';
import { api } from '../services/api';
import { ItemCard } from '../components/common/ItemCard';

const categoryIcons = {
  'power-tools-workshop': Wrench,
  'cameras-photography': Camera,
  'outdoor-camping': Compass,
  'audio-visual': Speaker
};

export function HomePage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const [itemsRes, catRes] = await Promise.all([
          api.getItems('limit=6'),
          api.getCategories()
        ]);
        setItems(itemsRes.items || []);
        setCategories(catRes || []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/items?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/items');
    }
  };

  return (
    <div className="space-y-16 pb-20">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-20 lg:py-28">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-teal-400 text-xs font-semibold backdrop-blur-md">
              <ShieldCheck className="w-4 h-4" />
              <span>Identity-Verified Peer-to-Peer Rental Network</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              Rent Quality Gear with <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400">Total Accountability</span>.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              RentLoop connects individuals to share equipment safely. Documented pre/post condition inspections, verified identities, and tamper-evident rental records eliminate disputes.
            </p>

            {/* Hero Search Box */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto pt-2">
              <div className="flex items-center bg-white rounded-2xl p-1.5 shadow-xl border border-slate-200">
                <div className="flex items-center flex-1 pl-4 text-slate-400">
                  <Search className="w-5 h-5 text-slate-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Search camera gear, power tools, camping tents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-slate-800 text-sm focus:outline-none placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm px-5 py-3 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>Search</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Trust Markers Bar */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verified Government IDs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Pre & Post Photo Inspections</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Double-Booking Shield</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Explore by Category</h2>
            <p className="text-xs text-slate-500 mt-1">Discover popular rentable equipment curated by verified owners</p>
          </div>
          <Link to="/items" className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.slice(0, 5).map((cat) => {
            const Icon = categoryIcons[cat.slug] || Sparkles;
            return (
              <Link
                key={cat.id}
                to={`/items?category=${cat.slug}`}
                className="group p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-teal-500/50 transition-all text-center flex flex-col items-center justify-center space-y-3"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-slate-900 group-hover:text-teal-700 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    {cat.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED ITEMS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Available For Rent Now</h2>
            <p className="text-xs text-slate-500 mt-1">Inspected items with active availability from top-rated community members</p>
          </div>
          <Link to="/items" className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1">
            <span>Browse Catalog ({items.length}+ items)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* HOW TRUST WORKS ON RENTLOOP (4-STEP WORKFLOW) */}
      <section className="bg-slate-100/70 border-y border-slate-200/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">The RentLoop Trust Protocol</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Engineered for Complete Accountability
            </h2>
            <p className="text-xs text-slate-500 mt-2">
              Every rental follows a structured 4-step governance cycle that protects both owners and renters from loss or disputes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 font-bold flex items-center justify-center text-sm mb-4">
                01
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Identity Verification</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Users submit valid government-issued IDs and biometric selfies reviewed by trust administrators before access.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 font-bold flex items-center justify-center text-sm mb-4">
                02
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Conflict-Free Booking</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Our engine automatically prevents overlapping bookings and generates secure handover security tokens.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 font-bold flex items-center justify-center text-sm mb-4">
                03
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Pre-Rental Inspection</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Item condition is documented with photographs and notes at pickup, with mutual cryptographic acknowledgment.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 font-bold flex items-center justify-center text-sm mb-4">
                04
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Return & Mutual Review</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Item condition is re-inspected upon return. Both parties exchange verified 5-star ratings to build community trust scores.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-3 max-w-xl">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Have idle gear lying around? Put it to work safely.
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              List your tools, cameras, and gear on RentLoop. You control pricing, dates, and approval for every rental request.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/owner/dashboard?action=new"
              className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs sm:text-sm px-6 py-3.5 rounded-xl transition-colors shadow-md"
            >
              List an Item Now
            </Link>
            <Link
              to="/items"
              className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm px-6 py-3.5 rounded-xl border border-slate-700 transition-colors"
            >
              Explore Items
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
