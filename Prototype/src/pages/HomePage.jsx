import { useState } from 'react';
import { Clock, TrendingUp, ChevronRight, Compass } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import CommunityCard from '../components/CommunityCard';
import { communities, recentViews, hotSearches, districts } from '../data/mockData';

export default function HomePage({ onNavigate, onViewCommunity }) {
  const [activeDistrict, setActiveDistrict] = useState(null);

  const recentCommunities = recentViews
    .map(rv => communities.find(c => c.id === rv.communityId))
    .filter(Boolean);

  const hotCommunities = communities.filter(c =>
    hotSearches.includes(c.name)
  );

  const filteredCommunities = activeDistrict
    ? communities.filter(c => c.district === activeDistrict)
    : [];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-10 pb-8 sm:pt-16 sm:pb-12">
        <div className="page-container text-center">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-warm-900 mb-3
                         animate-fade-in-up">
            买房决策，本该更简单
          </h1>
          <p className="text-warm-500 text-base sm:text-lg max-w-xl mx-auto mb-8
                        animate-fade-in-up animate-fade-in-up-delay-1">
            用更少的时间，获取更清晰的判断 —— 了解小区值不值得看，以及与同板块的替代选项对比
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto animate-fade-in-up animate-fade-in-up-delay-2">
            <SearchBar
              autoFocus
              onSelect={(community) => onViewCommunity(community)}
            />
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mt-8
                          animate-fade-in-up animate-fade-in-up-delay-3">
            <div className="text-center">
              <p className="text-2xl font-semibold text-warm-900">{communities.length}</p>
              <p className="text-xs text-warm-500">覆盖小区</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-warm-900">{districts.length}</p>
              <p className="text-xs text-warm-500">覆盖城区</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-warm-900">3 分钟</p>
              <p className="text-xs text-warm-500">决策判断</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Views */}
      {recentCommunities.length > 0 && (
        <section className="pb-10 animate-fade-in-up animate-fade-in-up-delay-4">
          <div className="page-container">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title flex items-center gap-2">
                <Clock size={20} className="text-warm-400" />
                最近浏览
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentCommunities.map((c) => (
                <CommunityCard key={c.id} community={c} onClick={onViewCommunity} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Hot Communities */}
      <section className="pb-10">
        <div className="page-container">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title flex items-center gap-2">
              <TrendingUp size={20} className="text-warm-400" />
              热门小区
            </h2>
            <button
              onClick={() => onNavigate('search')}
              className="flex items-center gap-1 text-sm text-sage-500 hover:text-sage-600 font-medium"
            >
              查看全部 <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotCommunities.map((c) => (
              <CommunityCard key={c.id} community={c} onClick={onViewCommunity} />
            ))}
          </div>
        </div>
      </section>

      {/* Browse by District */}
      <section className="pb-16">
        <div className="page-container">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title flex items-center gap-2">
              <Compass size={20} className="text-warm-400" />
              按区域浏览
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveDistrict(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !activeDistrict
                  ? 'bg-warm-900 text-warm-50'
                  : 'bg-white text-warm-600 border border-warm-200 hover:border-warm-400'
              }`}
            >
              全部
            </button>
            {districts.map((d) => (
              <button
                key={d.name}
                onClick={() => setActiveDistrict(d.name)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeDistrict === d.name
                    ? 'bg-warm-900 text-warm-50'
                    : 'bg-white text-warm-600 border border-warm-200 hover:border-warm-400'
                }`}
              >
                {d.name} ({d.count})
              </button>
            ))}
          </div>

          {(activeDistrict ? filteredCommunities : communities).length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(activeDistrict ? filteredCommunities : communities).map((c) => (
                <CommunityCard key={c.id} community={c} onClick={onViewCommunity} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-warm-200 py-8">
        <div className="page-container text-center">
          <p className="text-sm text-warm-400">
            豪斯助手 · 让买房决策更简单 · 原型演示 V0.1
          </p>
          <p className="text-xs text-warm-300 mt-1">
            数据仅供演示，不构成购房建议
          </p>
        </div>
      </footer>
    </div>
  );
}