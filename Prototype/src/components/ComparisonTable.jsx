import { X, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { comparisonDimensions } from '../data/mockData';

export default function ComparisonTable({ communities: selectedCommunities, onRemove }) {
  if (selectedCommunities.length === 0) return null;

  const TrendIcon = (trend) => {
    if (trend === 'up') return <ArrowUpRight size={14} className="text-red-500" />;
    if (trend === 'down') return <ArrowDownRight size={14} className="text-green-500" />;
    return <Minus size={14} className="text-warm-500" />;
  };

  const verdictStyles = {
    recommend: { bg: 'bg-emerald-50 text-emerald-700', text: '可去看' },
    cautious: { bg: 'bg-amber-50 text-amber-700', text: '谨慎' },
    avoid: { bg: 'bg-red-50 text-red-600', text: '暂不建议' },
  };

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="min-w-[700px] px-4 sm:px-0">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-4 bg-warm-50 rounded-tl-xl border-b border-warm-200
                             text-xs font-medium text-warm-500 uppercase tracking-wider w-[140px]">
                对比维度
              </th>
              {selectedCommunities.map((c, i) => (
                <th key={c.id} className={`p-4 bg-warm-50 border-b border-warm-200 text-left
                  ${i === selectedCommunities.length - 1 ? 'rounded-tr-xl' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-serif font-semibold text-warm-900">{c.name}</p>
                      <p className="text-xs text-warm-500">{c.district}·{c.subDistrict}</p>
                    </div>
                    {onRemove && (
                      <button
                        onClick={() => onRemove(c.id)}
                        className="p-1 rounded-full hover:bg-warm-200 text-warm-400"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Verdict */}
            <tr>
              <td className="p-4 border-b border-warm-100 text-sm font-medium text-warm-600 bg-warm-50/50">
                综合判断
              </td>
              {selectedCommunities.map((c) => {
                const v = verdictStyles[c.verdict] || verdictStyles.cautious;
                return (
                  <td key={c.id} className="p-4 border-b border-warm-100">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${v.bg}`}>
                      {v.text}
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* Price Trend */}
            <tr>
              <td className="p-4 border-b border-warm-100 text-sm font-medium text-warm-600 bg-warm-50/50">
                价格趋势
              </td>
              {selectedCommunities.map((c) => (
                <td key={c.id} className="p-4 border-b border-warm-100">
                  <span className="flex items-center gap-1 text-sm font-medium">
                    {TrendIcon(c.priceTrend)}
                    <span className={c.priceTrend === 'up' ? 'text-red-500' : c.priceTrend === 'down' ? 'text-green-500' : 'text-warm-500'}>
                      {c.priceChange}
                    </span>
                  </span>
                </td>
              ))}
            </tr>

            {/* Dimensions */}
            {comparisonDimensions.map((dim) => (
              <tr key={dim.key}>
                <td className="p-4 border-b border-warm-100 text-sm font-medium text-warm-600 bg-warm-50/50">
                  {dim.label}
                </td>
                {selectedCommunities.map((c) => (
                  <td key={c.id} className="p-4 border-b border-warm-100 text-sm text-warm-900">
                    {dim.format(c[dim.key])}
                  </td>
                ))}
              </tr>
            ))}

            {/* Metro */}
            <tr>
              <td className="p-4 border-b border-warm-100 text-sm font-medium text-warm-600 bg-warm-50/50">
                地铁
              </td>
              {selectedCommunities.map((c) => (
                <td key={c.id} className="p-4 border-b border-warm-100">
                  <div className="flex flex-wrap gap-1">
                    {c.nearbyMetro.map((m, i) => (
                      <span key={i} className="text-xs tag-slate">{m.split(' ')[0]}</span>
                    ))}
                  </div>
                </td>
              ))}
            </tr>

            {/* Highlights */}
            <tr>
              <td className="p-4 text-sm font-medium text-warm-600 bg-warm-50/50 align-top">
                核心优势
              </td>
              {selectedCommunities.map((c) => (
                <td key={c.id} className="p-4 align-top">
                  <ul className="space-y-1">
                    {c.highlights.slice(0, 3).map((h, i) => (
                      <li key={i} className="text-xs text-sage-600 flex items-start gap-1.5">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-sage-400 flex-shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>

            {/* Risks */}
            <tr>
              <td className="p-4 text-sm font-medium text-warm-600 bg-warm-50/50 align-top rounded-bl-xl">
                风险提醒
              </td>
              {selectedCommunities.map((c, i) => (
                <td key={c.id} className={`p-4 align-top ${i === selectedCommunities.length - 1 ? 'rounded-br-xl' : ''}`}>
                  <ul className="space-y-1">
                    {c.risks.map((r, j) => (
                      <li key={j} className="text-xs text-amber-600 flex items-start gap-1.5">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}