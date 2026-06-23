import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, TrendingUp, Clock, X } from 'lucide-react';
import { searchSuggestions, hotSearches, communities } from '../data/mockData';

export default function SearchBar({ onSelect, autoFocus = false, compact = false }) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ha_recent_searches') || '[]');
    } catch { return []; }
  });
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
    ? searchSuggestions.filter(s => s.toLowerCase().includes(query.toLowerCase()))
    : [];

  const filteredCommunities = query.trim()
    ? communities.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.subDistrict.toLowerCase().includes(query.toLowerCase()) ||
        c.district.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSelect = (item) => {
    const isCommunity = communities.find(c => c.name === item || c.id === item?.id);
    if (isCommunity) {
      const updated = [isCommunity.name, ...recentSearches.filter(s => s !== isCommunity.name)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('ha_recent_searches', JSON.stringify(updated));
      setQuery('');
      setShowDropdown(false);
      onSelect(isCommunity);
    }
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('ha_recent_searches');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className={`
        flex items-center gap-3 bg-white border border-warm-300 rounded-xl
        transition-all duration-200
        ${showDropdown ? 'ring-2 ring-warm-300 border-warm-400 shadow-elevated' : 'hover:border-warm-400'}
        ${compact ? 'px-3 py-2' : 'px-4 py-3 sm:px-5 sm:py-3.5'}
      `}>
        <Search size={compact ? 18 : 20} className="text-warm-400 flex-shrink-0" />
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
          className="flex-1 bg-transparent outline-none text-warm-900 placeholder:text-warm-400
                     text-sm sm:text-base font-sans"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            className="p-1 rounded-full hover:bg-warm-100 text-warm-400"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-warm-200
                        rounded-xl shadow-elevated overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
          {!query.trim() ? (
            <div className="p-4">
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-warm-500 flex items-center gap-1.5">
                      <Clock size={13} /> 最近搜索
                    </span>
                    <button onClick={clearRecent} className="text-xs text-warm-400 hover:text-warm-600">
                      清除
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelect(s)}
                        className="px-3 py-1.5 bg-warm-100 text-warm-700 rounded-lg text-sm
                                   hover:bg-warm-200 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Hot searches */}
              <div>
                <span className="text-xs font-medium text-warm-500 flex items-center gap-1.5 mb-2">
                  <TrendingUp size={13} /> 热门搜索
                </span>
                <div className="flex flex-wrap gap-2">
                  {hotSearches.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelect(s)}
                      className="px-3 py-1.5 bg-warm-50 text-warm-600 rounded-lg text-sm
                                 hover:bg-warm-100 transition-colors"
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
                  <div className="px-4 py-2 text-xs font-medium text-warm-500 bg-warm-50 flex items-center gap-1.5">
                    <MapPin size={13} /> 小区
                  </div>
                  {filteredCommunities.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelect(c)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-warm-50
                                 transition-colors text-left border-b border-warm-100 last:border-0"
                    >
                      <div>
                        <span className="text-sm font-medium text-warm-900">{c.name}</span>
                        <span className="text-xs text-warm-500 ml-2">{c.district}·{c.subDistrict}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-warm-900">{c.pricePerSqm}</span>
                        <span className={`text-xs ${c.priceTrend === 'up' ? 'text-red-500' : c.priceTrend === 'down' ? 'text-green-500' : 'text-warm-500'}`}>
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
                  <div className="px-4 py-2 text-xs font-medium text-warm-500 bg-warm-50">
                    搜索建议
                  </div>
                  {filteredSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setQuery(s);
                        handleSelect(s);
                      }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-warm-50
                                 transition-colors text-left text-sm text-warm-700 border-b border-warm-100 last:border-0"
                    >
                      <Search size={14} className="text-warm-400" />
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {filteredCommunities.length === 0 && filteredSuggestions.length === 0 && (
                <div className="p-6 text-center text-sm text-warm-500">
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