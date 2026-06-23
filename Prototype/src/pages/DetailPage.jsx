import { useState } from 'react';
import { ArrowLeft, MapPin, TrendingUp, TrendingDown, Minus, Clock, Building,
         AlertTriangle, CheckCircle2, Copy, Heart, Bell, Share2, ChevronRight,
         Info, Calendar } from 'lucide-react';
import CommunityCard from '../components/CommunityCard';
import { communities } from '../data/mockData';

export default function DetailPage({ community, onBack, onViewCommunity }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isFavorited, setIsFavorited] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showChecklistCopy, setShowChecklistCopy] = useState(false);

  const c = community;

  const verdictStyles = {
    recommend: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500', label: '可去看' },
    cautious: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: 'text-amber-500', label: '谨慎' },
    avoid: { bg: 'bg-red-50 border-red-200', text: 'text-red-600', icon: 'text-red-500', label: '暂不建议' },
  };

  const v = verdictStyles[c.verdict] || verdictStyles.cautious;

  const TrendIcon = c.priceTrend === 'up' ? TrendingUp : c.priceTrend === 'down' ? TrendingDown : Minus;
  const trendColor = c.priceTrend === 'up' ? 'text-red-500' : c.priceTrend === 'down' ? 'text-green-500' : 'text-warm-500';

  const alternatives = (c.alternatives || [])
    .map(id => communities.find(cm => cm.id === id))
    .filter(Boolean);

  const checklistItems = [
    { q: '房产证是否满五唯一？有无抵押/查封？', important: true },
    { q: '土地使用权年限剩余多少年？', important: true },
    { q: '税费明细（满五唯一可免个税）？', important: true },
    { q: '是否有漏水/裂缝/沉降等结构问题？', important: true },
    { q: '采光如何？上午/下午分别看一次？', important: true },
    { q: '是否临街/临电梯井/临垃圾站？', important: true },
    { q: '对应小学/初中是哪所？入学政策是否有变化？', important: true },
    { q: '维修基金余额？近期有无大修计划？', important: true },
    { q: '是否有固定车位？租还是买？价格？', important: false },
    { q: '物业费标准？物业服务口碑如何？', important: false },
    { q: '小区租户比例？自住率高吗？', important: false },
    { q: '是否有凶宅等需要披露的信息？', important: true },
  ];

  const copyChecklist = () => {
    const text = checklistItems.map((item, i) => `${i + 1}. ${item.q}`).join('\n');
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
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-700 transition-colors"
        >
          <ArrowLeft size={16} />
          返回
        </button>
      </div>

      {/* Decision Card Hero */}
      <section className="page-container mb-6">
        <div className={`card p-6 sm:p-8 border-2 ${v.bg}`}>
          {/* Verdict Banner */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-warm-900">{c.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${v.bg} ${v.text} border`}>
                  {v.label}
                </span>
              </div>
              <p className="text-sm text-warm-500 flex items-center gap-1">
                <MapPin size={13} />
                {c.district} · {c.subDistrict}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFavorited(!isFavorited)}
                className={`p-2 rounded-lg transition-all ${
                  isFavorited ? 'bg-red-50 text-red-500' : 'bg-white text-warm-400 hover:text-red-500'
                }`}
                title="收藏"
              >
                <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={() => setIsSubscribed(!isSubscribed)}
                className={`p-2 rounded-lg transition-all ${
                  isSubscribed ? 'bg-sage-50 text-sage-500' : 'bg-white text-warm-400 hover:text-sage-500'
                }`}
                title="订阅提醒"
              >
                <Bell size={18} fill={isSubscribed ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>

          {/* Verdict Reason */}
          <div className="mb-6">
            <p className="text-sm leading-relaxed text-warm-700">
              <span className="font-semibold">一句话判断：</span>{c.verdictReason}
            </p>
          </div>

          {/* Price & Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-warm-500 mb-1">均价</p>
              <p className="text-xl font-semibold text-warm-900">{c.pricePerSqm}</p>
              <p className={`text-xs font-medium flex items-center gap-0.5 ${trendColor}`}>
                <TrendIcon size={12} /> {c.priceChange}
              </p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-warm-500 mb-1">总价区间</p>
              <p className="text-sm font-semibold text-warm-900">{c.priceRange}</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-warm-500 mb-1">在售房源</p>
              <p className="text-xl font-semibold text-warm-900">{c.listingCount}<span className="text-sm font-normal text-warm-500">套</span></p>
              <p className="text-xs text-warm-400">平均{c.avgDaysOnMarket}天成交</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-warm-500 mb-1">月成交</p>
              <p className="text-xl font-semibold text-warm-900">{c.monthlyTransactions}<span className="text-sm font-normal text-warm-500">套</span></p>
              <p className="text-xs text-warm-400">近30天</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onViewCommunity(c, 'compare')}
              className="btn-primary text-sm"
            >
              找替代小区对比
            </button>
            <button
              onClick={copyChecklist}
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <Copy size={14} />
              {showChecklistCopy ? '已复制！' : '复制看房清单'}
            </button>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="page-container mb-6">
        <div className="flex border-b border-warm-200">
          {[
            { id: 'overview', label: '小区概况' },
            { id: 'transactions', label: '成交记录' },
            { id: 'alternatives', label: '替代小区' },
            { id: 'checklist', label: '看房要点' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px ${
                activeTab === tab.id
                  ? 'border-warm-900 text-warm-900'
                  : 'border-transparent text-warm-400 hover:text-warm-600'
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
              <h3 className="font-serif text-lg font-semibold text-warm-900 mb-3 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-sage-500" />
                核心优势
              </h3>
              <ul className="space-y-2">
                {c.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-warm-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sage-400 flex-shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            {/* Risks */}
            <div className="card p-5">
              <h3 className="font-serif text-lg font-semibold text-warm-900 mb-3 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                风险提醒
              </h3>
              <ul className="space-y-2">
                {c.risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-warm-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Basic Info */}
            <div className="card p-5">
              <h3 className="font-serif text-lg font-semibold text-warm-900 mb-3 flex items-center gap-2">
                <Info size={18} className="text-warm-400" />
                基本信息
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {[
                  { label: '开发商', value: c.developer },
                  { label: '物业公司', value: c.propertyMgmt },
                  { label: '物业费', value: c.propertyFee },
                  { label: '建成年份', value: `${c.buildYear}年` },
                  { label: '绿化率', value: c.greenRate },
                  { label: '容积率', value: c.plotRatio },
                  { label: '总户数', value: `${c.totalUnits}户` },
                  { label: '地铁', value: c.nearbyMetro.join(' / ') },
                  { label: '距地铁', value: c.distanceToMetro },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-warm-400 mb-0.5">{item.label}</p>
                    <p className="text-warm-700 font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-warm-400 flex items-center gap-1">
              <Calendar size={12} /> 数据更新时间：{c.dataUpdatedAt}
            </p>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="animate-fade-in-up">
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-warm-100">
                <h3 className="font-serif text-lg font-semibold text-warm-900">近期成交记录</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-warm-50">
                      <th className="text-left p-3 font-medium text-warm-500">成交日期</th>
                      <th className="text-left p-3 font-medium text-warm-500">户型</th>
                      <th className="text-left p-3 font-medium text-warm-500">楼层</th>
                      <th className="text-left p-3 font-medium text-warm-500">朝向</th>
                      <th className="text-right p-3 font-medium text-warm-500">总价</th>
                      <th className="text-right p-3 font-medium text-warm-500">单价</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.recentTransactions.map((t, i) => (
                      <tr key={i} className="border-t border-warm-100 hover:bg-warm-50/50">
                        <td className="p-3 text-warm-700">{t.date}</td>
                        <td className="p-3 text-warm-900 font-medium">{t.size}</td>
                        <td className="p-3 text-warm-600">{t.floor}</td>
                        <td className="p-3 text-warm-600">{t.direction}</td>
                        <td className="p-3 text-right text-warm-900 font-medium">{t.price}万</td>
                        <td className="p-3 text-right text-warm-600">{t.unitPrice.toLocaleString()}元/㎡</td>
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
            <h3 className="font-serif text-lg font-semibold text-warm-900 mb-4">
              同板块替代小区（{alternatives.length}个）
            </h3>
            {alternatives.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {alternatives.map((alt) => (
                  <CommunityCard key={alt.id} community={alt} onClick={onViewCommunity} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-warm-500">暂无替代小区推荐</p>
            )}
          </div>
        )}

        {activeTab === 'checklist' && (
          <div className="animate-fade-in-up">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-semibold text-warm-900">
                  看房要点清单
                </h3>
                <button
                  onClick={copyChecklist}
                  className="btn-secondary text-xs flex items-center gap-1.5"
                >
                  <Copy size={12} />
                  {showChecklistCopy ? '已复制！' : '一键复制'}
                </button>
              </div>
              <p className="text-sm text-warm-500 mb-4">
                线下看房时逐项确认，避免遗漏关键信息
              </p>
              <div className="space-y-1">
                {checklistItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-warm-50 transition-colors"
                  >
                    <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0
                      ${item.important ? 'bg-red-50 text-red-500' : 'bg-warm-100 text-warm-500'}`}>
                      {i + 1}
                    </span>
                    <span className="text-sm text-warm-700">{item.q}</span>
                    {item.important && (
                      <span className="text-xs tag-red flex-shrink-0 ml-auto">重要</span>
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