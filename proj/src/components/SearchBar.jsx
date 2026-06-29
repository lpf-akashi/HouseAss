import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, TrendingUp, Clock, X } from 'lucide-react';
import { communities, searchSuggestions, hotSearches } from '../data/mockData';
import { addSearchHistory, getSearchHistory } from '../utils/storage';

export default function SearchBar({ onSelect, autoFocus = false, compact = false }) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => getSearchHistory());
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSuggestions = query.trim()
    ? searchSuggestions.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : [];

  const filteredCommunities = query.trim()
    ? communities.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.subDistrict.toLowerCase().includes(query.toLowerCase()) ||
          c.district.toLowerCase().includes(query.toLowerCase()) ||
          c.searchKeywords.some((k) => k.toLowerCase().includes(query.toLowerCase())),
      )
    : [];

  const handleSelect = (community) => {
    addSearchHistory(community.name);
    setRecentSearches(getSearchHistory());
    setQuery('');
    setShowDropdown(false);
    onSelect(community);
  };

  const handleHotSelect = (name) => {
    const found = communities.find((c) => c.name === name);
    if (found) {
      handleSelect(found);
    }
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('ha_search_history');
  };

  const formatPriceShort = (price) => {
    if (price >= 10000) return `${(price / 10000).toFixed(1)}万`;
    return `${price}`;
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`
        flex items-center gap-3 bg-white border border-slate-300 rounded-xl
        transition-all duration-200
        ${showDropdown ? 'ring-2 ring-amber-200 border-amber-400 shadow-lg' : 'hover:border-slate-400'}
        ${compact ? 'px-3 py-2' : 'px-4 py-3 sm:px-5 sm:py-3.5'}
      `}
      >
        <Search size={compact ? 18 : 20} className="text-slate-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="搜索小区、板块、地铁站..."
          className="flex-1 bg-transparent outline-none text-slate-800 placeholder:text-slate-400
                     text-sm sm:text-base"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-200
                        rounded-xl shadow-lg overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
        >
          {!query.trim() ? (
            <div className="p-4">
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                      <Clock size={13} /> 最近搜索
                    </span>
                    <button onClick={clearRecent} className="text-xs text-slate-400 hover:text-slate-600">
                      清除
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleHotSelect(s)}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm
                                   hover:bg-slate-200 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Hot searches */}
              <div>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-2">
                  <TrendingUp size={13} /> 热门搜索
                </span>
                <div className="flex flex-wrap gap-2">
                  {hotSearches.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleHotSelect(s)}
                      className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm
                                 hover:bg-amber-100 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Community results */}
              {filteredCommunities.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-slate-500 bg-slate-50 flex items-center gap-1.5">
                    <MapPin size={13} /> 小区
                  </div>
                  {filteredCommunities.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => handleSelect(c)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50
                                 transition-colors text-left border-b border-slate-100 last:border-0"
                    >
                      <div>
                        <span className="text-sm font-medium text-slate-800">{c.name}</span>
                        <span className="text-xs text-slate-500 ml-2">
                          {c.district}·{c.subDistrict}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800">
                          {formatPriceShort(c.avgPrice)}/㎡
                        </span>
                        <span
                          className={`text-xs ${
                            c.priceTrend === 'up'
                              ? 'text-red-500'
                              : c.priceTrend === 'down'
                                ? 'text-green-500'
                                : 'text-slate-500'
                          }`}
                        >
                          {c.priceChange}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Keyword suggestions */}
              {filteredSuggestions.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-slate-500 bg-slate-50">搜索建议</div>
                  {filteredSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setQuery(s);
                        const found = communities.find((c) => c.name === s);
                        if (found) handleSelect(found);
                      }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50
                                 transition-colors text-left text-sm text-slate-700 border-b border-slate-100 last:border-0"
                    >
                      <Search size={14} className="text-slate-400" />
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {filteredCommunities.length === 0 && filteredSuggestions.length === 0 && (
                <div className="p-6 text-center text-sm text-slate-500">
                  未找到相关信息，请尝试其他关键词
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}