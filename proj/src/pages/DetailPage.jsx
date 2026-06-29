import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, TrendingUp, TrendingDown, Minus,
  AlertTriangle, CheckCircle2, Copy, Heart, Info, Calendar,
} from 'lucide-react';
import CommunityCard from '../components/CommunityCard';
import PriceChart from '../components/PriceChart';
import { communities, checklistItems } from '../data/mockData';
import { formatPrice, formatDistance, formatNumber } from '../utils/formatter';
import { getFavorites, addFavorite, removeFavorite } from '../utils/storage';

const attentionStyles = {
  high: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500', label: '看房优先级高' },
  medium: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: 'text-amber-500', label: '看房需关注风险' },
  low: { bg: 'bg-red-50 border-red-200', text: 'text-red-600', icon: 'text-red-500', label: '暂不建议看房' },
};

export default function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showChecklistCopy, setShowChecklistCopy] = useState(false);

  const community = communities.find((c) => c._id === id);

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-600 mb-4">未找到该小区信息</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const attn = attentionStyles[community.attentionLevel] || attentionStyles.medium;
  const TrendIcon = community.priceTrend === 'up' ? TrendingUp : community.priceTrend === 'down' ? TrendingDown : Minus;
  const trendColor =
    community.priceTrend === 'up'
      ? 'text-red-500'
      : community.priceTrend === 'down'
        ? 'text-green-500'
        : 'text-slate-500';

  const favorites = getFavorites();
  const isFavorited = favorites.some((f) => f.communityId === community._id);

  const toggleFavorite = () => {
    if (isFavorited) {
      removeFavorite(community._id);
    } else {
      addFavorite(community._id, community.name, community.avgPrice, community.district, community.subDistrict);
    }
    // Force re-render
    navigate(`/detail/${community._id}`, { replace: true });
  };

  const alternatives = (community.alternatives || []).map((alt) => {
    const full = communities.find((c) => c._id === alt.id);
    return full || alt;
  });

  const handleViewCommunity = (c) => {
    navigate(`/detail/${c._id || c.id}`);
  };

  const copyChecklist = () => {
    const text = checklistItems.map((item, i) => `${i + 1}. [${item.category}] ${item.question}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setShowChecklistCopy(true);
      setTimeout(() => setShowChecklistCopy(false), 2000);
    });
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Back Navigation */}
      <div className="page-container pt-4 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={16} />
          返回
        </button>
      </div>

      {/* Decision Card Hero */}
      <section className="page-container mb-6">
        <div className={`card p-6 sm:p-8 border-2 ${attn.bg}`}>
          {/* Verdict Banner */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{community.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${attn.bg} ${attn.text} border`}>
                  {attn.label}
                </span>
              </div>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <MapPin size={13} />
                {community.district} · {community.subDistrict}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFavorite}
                className={`p-2 rounded-lg transition-all ${isFavorited ? 'bg-red-50 text-red-500' : 'bg-white text-slate-400 hover:text-red-500'
                  }`}
                title="收藏"
              >
                <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>

          {/* Verdict Reason */}
          <div className="mb-6">
            <p className="text-sm leading-relaxed text-slate-700">
              <span className="font-semibold">一句话判断：</span>
              {community.attentionReason}
            </p>
          </div>

          {/* Price & Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">均价</p>
              <p className="text-xl font-semibold text-slate-800">{formatPrice(community.avgPrice, 'unit')}</p>
              <p className={`text-xs font-medium flex items-center gap-0.5 ${trendColor}`}>
                <TrendIcon size={12} /> {community.priceChange}
              </p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">总价区间</p>
              <p className="text-sm font-semibold text-slate-800">{community.priceRange}</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">在售房源</p>
              <p className="text-xl font-semibold text-slate-800">
                {community.listingCount}
                <span className="text-sm font-normal text-slate-500">套</span>
              </p>
              <p className="text-xs text-slate-400">平均{community.avgDaysOnMarket}天成交</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">月成交</p>
              <p className="text-xl font-semibold text-slate-800">
                {community.monthlyTransactions}
                <span className="text-sm font-normal text-slate-500">套</span>
              </p>
              <p className="text-xs text-slate-400">近30天</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate('/compare')} className="btn-primary text-sm">
              找替代小区对比
            </button>
            <button onClick={copyChecklist} className="btn-secondary text-sm flex items-center gap-1.5">
              <Copy size={14} />
              {showChecklistCopy ? '已复制！' : '复制看房清单'}
            </button>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="page-container mb-6">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {[
            { id: 'overview', label: '小区概况' },
            { id: 'transactions', label: '成交记录' },
            { id: 'alternatives', label: '替代小区' },
            { id: 'checklist', label: '看房要点' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${activeTab === tab.id
                  ? 'border-slate-800 text-slate-800'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="page-container">
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Highlights */}
            <div className="card p-5">
              <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500" />
                核心优势
              </h3>
              <ul className="space-y-2">
                {community.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            {/* Risks */}
            <div className="card p-5">
              <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                风险提醒
              </h3>
              <ul className="space-y-2">
                {community.risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Score Details */}
            {community.scoreDetails && (
              <div className="card p-5">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">评分明细</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: '地段', score: community.scoreDetails.locationScore },
                    { label: '品质', score: community.scoreDetails.qualityScore },
                    { label: '性价比', score: community.scoreDetails.valueScore },
                    { label: '增值潜力', score: community.scoreDetails.growthScore },
                  ].map((item) => (
                    <div key={item.label} className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold text-slate-800">{item.score}</p>
                      <p className="text-xs text-slate-500 mt-1">{item.label}</p>
                      <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${item.score >= 8
                              ? 'bg-emerald-500'
                              : item.score >= 6
                                ? 'bg-amber-500'
                                : 'bg-red-400'
                            }`}
                          style={{ width: `${(item.score / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="card p-5">
              <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Info size={18} className="text-slate-400" />
                基本信息
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {[
                  { label: '开发商', value: community.developer },
                  { label: '物业公司', value: community.propertyMgmt },
                  { label: '物业费', value: community.propertyFee },
                  { label: '建成年份', value: `${community.buildYear}年` },
                  { label: '绿化率', value: community.greenRate },
                  { label: '容积率', value: community.plotRatio },
                  { label: '总户数', value: `${formatNumber(community.totalUnits)}户` },
                  { label: '物业类型', value: community.propertyType },
                  { label: '地铁', value: community.nearbyMetro.join(' / ') },
                  { label: '距地铁', value: formatDistance(community.distanceToMetroMeters) },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
                    <p className="text-slate-700 font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar size={12} /> 数据更新时间：{community.dataUpdatedAt}
            </p>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="animate-fade-in-up">
            <div className="card p-5 mb-6">
              <PriceChart
                transactions={community.recentTransactions || []}
                priceTrend={community.priceTrend}
                avgPrice={community.avgPrice}
              />
            </div>

            <div className="card overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800">近期成交记录</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left p-3 font-medium text-slate-500">成交日期</th>
                      <th className="text-left p-3 font-medium text-slate-500">户型</th>
                      <th className="text-left p-3 font-medium text-slate-500">楼层</th>
                      <th className="text-left p-3 font-medium text-slate-500">朝向</th>
                      <th className="text-right p-3 font-medium text-slate-500">总价</th>
                      <th className="text-right p-3 font-medium text-slate-500">单价</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(community.recentTransactions || []).map((t, i) => (
                      <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/50">
                        <td className="p-3 text-slate-700">{t.date}</td>
                        <td className="p-3 text-slate-800 font-medium">{t.size}</td>
                        <td className="p-3 text-slate-600">{t.floor}</td>
                        <td className="p-3 text-slate-600">{t.direction}</td>
                        <td className="p-3 text-right text-slate-800 font-medium">{t.price}万</td>
                        <td className="p-3 text-right text-slate-600">{t.unitPrice.toLocaleString()}元/㎡</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alternatives' && (
          <div className="animate-fade-in-up">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              同板块替代小区（{alternatives.length}个）
            </h3>
            {alternatives.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {alternatives.map((alt) => (
                  <CommunityCard key={alt._id || alt.id} community={alt} onClick={handleViewCommunity} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">暂无替代小区推荐</p>
            )}
          </div>
        )}

        {activeTab === 'checklist' && (
          <div className="animate-fade-in-up">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">看房要点清单</h3>
                <button onClick={copyChecklist} className="btn-secondary text-xs flex items-center gap-1.5">
                  <Copy size={12} />
                  {showChecklistCopy ? '已复制！' : '一键复制'}
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-4">线下看房时逐项确认，避免遗漏关键信息</p>
              <div className="space-y-1">
                {checklistItems.map((item, i) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <span
                      className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${item.important ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'
                        }`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm text-slate-700 flex-1">{item.question}</span>
                    {item.important && (
                      <span className="tag-red text-xs flex-shrink-0">重要</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}