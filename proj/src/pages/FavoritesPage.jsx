import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Trash2, ChevronRight, MapPin, TrendingUp, TrendingDown, Minus, Loader } from 'lucide-react';
import { communities as mockCommunities } from '../data/mockData';
import { getFavorites, removeFavorite as localRemoveFavorite } from '../utils/storage';
import { formatPrice } from '../utils/formatter';
import api from '../services/api';

const attentionStyles = {
  high: { tag: 'tag-green', label: '看房优先级高' },
  medium: { tag: 'tag-amber', label: '看房需关注风险' },
  low: { tag: 'tag-red', label: '暂不建议看房' },
};

const TrendIcon = ({ trend }) => {
  if (trend === 'up') return <TrendingUp size={14} className="text-red-500" />;
  if (trend === 'down') return <TrendingDown size={14} className="text-green-500" />;
  return <Minus size={14} className="text-slate-500" />;
};

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState(() => getFavorites());
  const [cloudFavorites, setCloudFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // 加载云端收藏
  useEffect(() => {
    async function loadCloudFavorites() {
      try {
        const cloudFavs = await api.getFavorites();
        if (cloudFavs && cloudFavs.length > 0) {
          setCloudFavorites(cloudFavs);
        }
      } catch {
        // 降级为本地存储
      } finally {
        setLoading(false);
      }
    }
    loadCloudFavorites();
  }, []);

  const favoriteCommunities = favorites
    .map((f) => {
      const c = mockCommunities.find((c) => c._id === f.communityId);
      return c ? { ...c, savedAt: f.savedAt } : null;
    })
    .filter(Boolean);

  const handleRemove = (id) => {
    localRemoveFavorite(id);
    api.removeFavorite(id); // fire-and-forget
    setFavorites(getFavorites());
  };

  return (
    <div className="min-h-screen pb-16">
      <div className="page-container pt-6 pb-4">
        <h1 className="text-2xl font-bold text-slate-800">我的收藏</h1>
        <p className="text-sm text-slate-500 mt-1">关注的小区动态一目了然</p>
      </div>

      <div className="page-container">
        {favoriteCommunities.length > 0 ? (
          <div className="space-y-3">
            {favoriteCommunities.map((c) => {
              const attn = attentionStyles[c.attentionLevel] || attentionStyles.medium;
              return (
                <div key={c._id} className="card p-4 sm:p-5 flex items-center gap-4 group">
                  {/* Info */}
                  <button
                    onClick={() => navigate(`/detail/${c._id}`)}
                    className="flex-1 flex items-center gap-4 text-left min-w-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-slate-800 truncate">{c.name}</h3>
                        <span className={attn.tag}>{attn.label}</span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin size={11} />
                        {c.district}·{c.subDistrict}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-semibold text-slate-800">{formatPrice(c.avgPrice, 'unit')}</p>
                      <p
                        className={`text-xs font-medium flex items-center justify-end gap-0.5 ${c.priceTrend === 'up'
                          ? 'text-red-500'
                          : c.priceTrend === 'down'
                            ? 'text-green-500'
                            : 'text-slate-500'
                          }`}
                      >
                        <TrendIcon trend={c.priceTrend} />
                        {c.priceChange}
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </button>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemove(c._id)}
                    className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="取消收藏"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <Heart size={40} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">还没有收藏</h3>
            <p className="text-sm text-slate-500">浏览小区时点击心形图标即可收藏，方便随时回顾</p>
          </div>
        )}
      </div>
    </div>
  );
}