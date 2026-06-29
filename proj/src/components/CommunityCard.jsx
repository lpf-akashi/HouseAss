import { ArrowUpRight, ArrowDownRight, Minus, Clock, MapPin, Building } from 'lucide-react';
import { formatDistance } from '../utils/formatter';

const attentionStyles = {
  high: { tag: 'tag-green', label: '看房优先级高' },
  medium: { tag: 'tag-amber', label: '看房需关注风险' },
  low: { tag: 'tag-red', label: '暂不建议看房' },
};

export default function CommunityCard({ community, onClick }) {
  const {
    name,
    district,
    subDistrict,
    avgPrice,
    priceTrend,
    priceChange,
    buildYear,
    attentionLevel,
    nearbyMetro,
    distanceToMetroMeters,
    highlights,
    risks,
    listingCount,
    monthlyTransactions,
  } = community;

  const TrendIcon = priceTrend === 'up' ? ArrowUpRight : priceTrend === 'down' ? ArrowDownRight : Minus;
  const trendColor =
    priceTrend === 'up' ? 'text-red-500' : priceTrend === 'down' ? 'text-green-500' : 'text-slate-500';
  const attn = attentionStyles[attentionLevel] || attentionStyles.medium;

  const formatPriceShort = (price) => {
    if (price >= 10000) return `${(price / 10000).toFixed(1)}万`;
    return `${price}`;
  };

  return (
    <button
      onClick={() => onClick(community)}
      className="card p-5 text-left w-full transition-all duration-200 hover:-translate-y-0.5"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{name}</h3>
          <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
            <MapPin size={13} />
            {district}·{subDistrict}
          </p>
        </div>
        <span className={attn.tag}>{attn.label}</span>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-semibold text-slate-800">
          {formatPriceShort(avgPrice)}
          <span className="text-sm font-normal text-slate-500">/㎡</span>
        </span>
        <span className={`flex items-center gap-0.5 text-sm font-medium ${trendColor}`}>
          <TrendIcon size={14} />
          {priceChange}
        </span>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-3">
        <span className="flex items-center gap-1">
          <Building size={12} />
          {buildYear}年建
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          距地铁{formatDistance(distanceToMetroMeters)}
        </span>
        <span className="flex items-center gap-1">
          <ArrowUpRight size={12} />
          月成交{monthlyTransactions}套
        </span>
      </div>

      {/* Metro */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {nearbyMetro.map((m, i) => (
          <span key={i} className="tag-slate text-xs">
            {m}
          </span>
        ))}
      </div>

      {/* Highlights */}
      <div className="space-y-1 mb-3">
        {highlights.slice(0, 2).map((h, i) => (
          <p key={i} className="text-xs text-emerald-600 flex items-start gap-1.5">
            <span className="mt-0.5 w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />
            {h}
          </p>
        ))}
      </div>

      {/* Risks */}
      {risks.length > 0 && (
        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs text-amber-600 flex items-start gap-1.5">
            <span className="mt-0.5 w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
            {risks[0]}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-400">在售{listingCount}套</span>
        <span className="text-xs text-emerald-600 font-medium">查看详情 →</span>
      </div>
    </button>
  );
}