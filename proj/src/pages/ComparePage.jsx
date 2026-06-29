import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ListPlus, X, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { communities } from '../data/mockData';
import { formatPrice, formatDistance } from '../utils/formatter';

const attentionStyles = {
  high: { bg: 'bg-emerald-50 text-emerald-700', text: '看房优先级高' },
  medium: { bg: 'bg-amber-50 text-amber-700', text: '看房需关注风险' },
  low: { bg: 'bg-red-50 text-red-600', text: '暂不建议看房' },
};

const TrendIcon = ({ trend }) => {
  if (trend === 'up') return <ArrowUpRight size={14} className="text-red-500" />;
  if (trend === 'down') return <ArrowDownRight size={14} className="text-green-500" />;
  return <Minus size={14} className="text-slate-500" />;
};

export default function ComparePage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [showAddPanel, setShowAddPanel] = useState(false);

  const addCommunity = (c) => {
    if (selected.length >= 4) return;
    if (!selected.find((s) => s._id === c._id)) {
      setSelected([...selected, c]);
    }
    setShowAddPanel(false);
  };

  const removeCommunity = (id) => {
    setSelected(selected.filter((s) => s._id !== id));
  };

  const availableCommunities = communities.filter((c) => !selected.find((s) => s._id === c._id));

  const comparisonRows = [
    { label: '均价', key: 'avgPrice', format: (v) => formatPrice(v, 'unit') },
    { label: '建成年份', key: 'buildYear', format: (v) => `${v}年` },
    { label: '物业费', key: 'propertyFee', format: (v) => v },
    { label: '绿化率', key: 'greenRate', format: (v) => v },
    { label: '容积率', key: 'plotRatio', format: (v) => v },
    { label: '距地铁', key: 'distanceToMetroMeters', format: (v) => formatDistance(v) },
    { label: '在售房源', key: 'listingCount', format: (v) => `${v}套` },
    { label: '月成交', key: 'monthlyTransactions', format: (v) => `${v}套` },
    { label: '平均成交周期', key: 'avgDaysOnMarket', format: (v) => `${v}天` },
  ];

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <div className="page-container pt-4 pb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft size={16} />
            返回
          </button>
          <div className="flex items-center gap-3">
            {selected.length > 0 && (
              <button
                onClick={() => setSelected([])}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={13} />
                清空
              </button>
            )}
          </div>
        </div>
        <div className="mt-4">
          <h1 className="text-2xl font-bold text-slate-800">小区对比</h1>
          <p className="text-sm text-slate-500 mt-1">横向比较多个小区的关键维度，一目了然</p>
        </div>
      </div>

      {/* Add Panel */}
      <div className="page-container mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddPanel(!showAddPanel)}
            className="btn-secondary text-sm flex items-center gap-1.5"
            disabled={selected.length >= 4}
          >
            <Plus size={14} />
            添加小区
          </button>
          {selected.length === 0 && (
            <span className="text-xs text-slate-400">请添加 2-4 个小区开始对比</span>
          )}
          {selected.length > 0 && selected.length < 2 && (
            <span className="text-xs text-amber-500">请至少添加 2 个小区</span>
          )}
          {selected.length >= 4 && (
            <span className="text-xs text-slate-400">最多对比 4 个小区</span>
          )}
        </div>

        {showAddPanel && (
          <div className="mt-3 card p-4 animate-fade-in-up">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {availableCommunities.map((c) => (
                <button
                  key={c._id}
                  onClick={() => addCommunity(c)}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200
                             hover:border-slate-400 hover:bg-slate-50 transition-all text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-500">
                      {c.district}·{c.subDistrict}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-slate-800">{formatPrice(c.avgPrice, 'unit')}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Comparison Table */}
      {selected.length >= 2 ? (
        <div className="page-container animate-fade-in-up">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[700px] px-4 sm:px-0">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-4 bg-slate-50 rounded-tl-xl border-b border-slate-200
                                   text-xs font-medium text-slate-500 uppercase tracking-wider w-[140px]">
                      对比维度
                    </th>
                    {selected.map((c, i) => (
                      <th
                        key={c._id}
                        className={`p-4 bg-slate-50 border-b border-slate-200 text-left ${
                          i === selected.length - 1 ? 'rounded-tr-xl' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-800">{c.name}</p>
                            <p className="text-xs text-slate-500">
                              {c.district}·{c.subDistrict}
                            </p>
                          </div>
                          <button
                            onClick={() => removeCommunity(c._id)}
                            className="p-1 rounded-full hover:bg-slate-200 text-slate-400"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* 综合判断 */}
                  <tr>
                    <td className="p-4 border-b border-slate-100 text-sm font-medium text-slate-600 bg-slate-50/50">
                      综合判断
                    </td>
                    {selected.map((c) => {
                      const attn = attentionStyles[c.attentionLevel] || attentionStyles.medium;
                      return (
                        <td key={c._id} className="p-4 border-b border-slate-100">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${attn.bg}`}>
                            {attn.text}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* 价格趋势 */}
                  <tr>
                    <td className="p-4 border-b border-slate-100 text-sm font-medium text-slate-600 bg-slate-50/50">
                      价格趋势
                    </td>
                    {selected.map((c) => (
                      <td key={c._id} className="p-4 border-b border-slate-100">
                        <span className="flex items-center gap-1 text-sm font-medium">
                          <TrendIcon trend={c.priceTrend} />
                          <span
                            className={
                              c.priceTrend === 'up'
                                ? 'text-red-500'
                                : c.priceTrend === 'down'
                                  ? 'text-green-500'
                                  : 'text-slate-500'
                            }
                          >
                            {c.priceChange}
                          </span>
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* 维度对比 */}
                  {comparisonRows.map((row) => (
                    <tr key={row.key}>
                      <td className="p-4 border-b border-slate-100 text-sm font-medium text-slate-600 bg-slate-50/50">
                        {row.label}
                      </td>
                      {selected.map((c) => (
                        <td key={c._id} className="p-4 border-b border-slate-100 text-sm text-slate-800">
                          {row.format(c[row.key])}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* 地铁 */}
                  <tr>
                    <td className="p-4 border-b border-slate-100 text-sm font-medium text-slate-600 bg-slate-50/50">
                      地铁
                    </td>
                    {selected.map((c) => (
                      <td key={c._id} className="p-4 border-b border-slate-100">
                        <div className="flex flex-wrap gap-1">
                          {c.nearbyMetro.map((m, i) => (
                            <span key={i} className="text-xs tag-slate">
                              {m.split(' ')[0]}
                            </span>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* 核心优势 */}
                  <tr>
                    <td className="p-4 text-sm font-medium text-slate-600 bg-slate-50/50 align-top">核心优势</td>
                    {selected.map((c) => (
                      <td key={c._id} className="p-4 align-top">
                        <ul className="space-y-1">
                          {c.highlights.slice(0, 3).map((h, i) => (
                            <li key={i} className="text-xs text-emerald-600 flex items-start gap-1.5">
                              <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />
                              {h}
                            </li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>

                  {/* 风险提醒 */}
                  <tr>
                    <td className="p-4 text-sm font-medium text-slate-600 bg-slate-50/50 align-top rounded-bl-xl">
                      风险提醒
                    </td>
                    {selected.map((c, i) => (
                      <td
                        key={c._id}
                        className={`p-4 align-top ${i === selected.length - 1 ? 'rounded-br-xl' : ''}`}
                      >
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
        </div>
      ) : selected.length === 1 ? (
        <div className="page-container">
          <div className="card p-8 text-center">
            <ListPlus size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">再添加至少 1 个小区即可开始对比</p>
          </div>
        </div>
      ) : (
        <div className="page-container">
          <div className="card p-8 text-center">
            <ListPlus size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 mb-3">添加小区开始对比</p>
            <p className="text-xs text-slate-400">
              选择 2-4 个小区，从均价、通勤、楼龄、成交活跃度等维度进行横向比较
            </p>
          </div>
        </div>
      )}
    </div>
  );
}