import { useState } from 'react';
import { Heart, Trash2, ChevronRight, MapPin, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { communities } from '../data/mockData';

export default function FavoritesPage({ onViewCommunity }) {
  const [favorites, setFavorites] = useState(() => {
    // In a real app, this would be persisted
    // For now, pre-populate with some favorites
    return ['wankeyuan', 'rongzejiayuan', 'taiyangyuan'];
  });

  const favoriteCommunities = favorites
    .map(id => communities.find(c => c.id === id))
    .filter(Boolean);

  const removeFavorite = (id) => {
    setFavorites(favorites.filter(f => f !== id));
  };

  const TrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp size={14} className="text-red-500" />;
    if (trend === 'down') return <TrendingDown size={14} className="text-green-500" />;
    return <Minus size={14} className="text-warm-500" />;
  };

  return (
    <div className="min-h-screen pb-16">
      <div className="page-container pt-6 pb-4">
        <h1 className="font-serif text-2xl font-bold text-warm-900">我的收藏</h1>
        <p className="text-sm text-warm-500 mt-1">
          关注的小区动态一目了然
        </p>
      </div>

      <div className="page-container">
        {favoriteCommunities.length > 0 ? (
          <div className="space-y-3">
            {favoriteCommunities.map((c) => (
              <div key={c.id} className="card p-4 sm:p-5 flex items-center gap-4 group">
                {/* Info */}
                <button
                  onClick={() => onViewCommunity(c)}
                  className="flex-1 flex items-center gap-4 text-left min-w-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-serif text-base font-semibold text-warm-900 truncate">
                        {c.name}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        c.verdict === 'recommend' ? 'tag-green' :
                        c.verdict === 'cautious' ? 'tag-amber' : 'tag-red'
                      }`}>
                        {c.verdictText}
                      </span>
                    </div>
                    <p className="text-xs text-warm-500 flex items-center gap-1">
                      <MapPin size={11} />
                      {c.district}·{c.subDistrict}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-semibold text-warm-900">{c.pricePerSqm}</p>
                    <p className={`text-xs font-medium flex items-center justify-end gap-0.5 ${
                      c.priceTrend === 'up' ? 'text-red-500' :
                      c.priceTrend === 'down' ? 'text-green-500' : 'text-warm-500'
                    }`}>
                      {TrendIcon(c.priceTrend)}
                      {c.priceChange}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-warm-300 group-hover:text-warm-500 transition-colors" />
                </button>

                {/* Remove */}
                <button
                  onClick={() => removeFavorite(c.id)}
                  className="p-2 rounded-lg text-warm-300 hover:text-red-500 hover:bg-red-50 transition-all"
                  title="取消收藏"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <Heart size={40} className="mx-auto text-warm-300 mb-4" />
            <h3 className="text-lg font-serif font-semibold text-warm-700 mb-2">
              还没有收藏
            </h3>
            <p className="text-sm text-warm-500">
              浏览小区时点击心形图标即可收藏，方便随时回顾
            </p>
          </div>
        )}
      </div>
    </div>
  );
}