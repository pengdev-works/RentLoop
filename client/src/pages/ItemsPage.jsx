import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, RotateCcw, Filter, Tag } from 'lucide-react';
import { api } from '../services/api';
import { ItemCard } from '../components/common/ItemCard';

export function ItemsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedCondition, setSelectedCondition] = useState(searchParams.get('condition') || 'all');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');

  useEffect(() => {
    async function fetchCategories() {
      try {
        const cats = await api.getCategories();
        setCategories(cats || []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
        if (selectedCondition && selectedCondition !== 'all') params.append('condition', selectedCondition);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (sortBy) params.append('sortBy', sortBy);

        const data = await api.getItems(params.toString());
        setItems(data.items || []);
      } catch (err) {
        console.error('Failed to load items:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchItems();
  }, [search, selectedCategory, selectedCondition, maxPrice, sortBy]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedCondition('all');
    setMaxPrice('');
    setSortBy('newest');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Explore Rental Gear</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse verified tools, cameras, and equipment available from trusted community members.
          </p>
        </div>

        {/* Results count & Sorting */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{items.length}</strong> items
          </span>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-teal-500 shadow-2xs"
          >
            <option value="newest">Sort by: Newest Listings</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Owner Trust Score</option>
          </select>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-4">
        
        {/* Top Row: Search Input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by keywords, model, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-teal-500 focus:outline-none transition-colors"
            />
          </div>

          <button
            onClick={handleResetFilters}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Bottom Row: Category and Condition Pills */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          
          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Condition Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Condition:</span>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Conditions</option>
              <option value="brand_new">Brand New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>

          {/* Max Price Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Max Price:</span>
            <input
              type="number"
              placeholder="e.g. 50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-20 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
            />
          </div>

        </div>

      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Filter className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No items match your criteria</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search terms, changing the category, or expanding your price range.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

    </div>
  );
}

