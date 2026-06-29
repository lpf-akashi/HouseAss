import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * 简易价格走势图（纯 SVG 实现，无第三方图表库依赖）
 * @param {Array} transactions - 成交记录数组 [{date, price, unitPrice, size, floor, direction}]
 * @param {string} priceTrend - 价格趋势 'up' | 'down' | 'stable'
 * @param {number} avgPrice - 均价（用于参考线）
 */
export default function PriceChart({ transactions = [], priceTrend = 'stable', avgPrice }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!transactions.length) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        暂无成交数据
      </div>
    );
  }

  const sorted = [...transactions].reverse(); // 按时间升序
  const prices = sorted.map((t) => t.unitPrice);
  const minPrice = Math.min(...prices) * 0.98;
  const maxPrice = Math.max(...prices) * 1.02;
  const range = maxPrice - minPrice || 1;

  const width = 400;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 35, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const barWidth = Math.min(28, (chartW / sorted.length) * 0.6);
  const gap = chartW / sorted.length;

  const trendColor = priceTrend === 'up' ? '#ef4444' : priceTrend === 'down' ? '#22c55e' : '#64748b';
  const hoverColor = priceTrend === 'up' ? '#fca5a5' : priceTrend === 'down' ? '#86efac' : '#94a3b8';

  // Y轴刻度
  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = minPrice + (range / yTicks) * i;
    return Math.round(val / 100) * 100;
  });

  // 参考线（均价）
  const avgY = avgPrice ? padding.top + chartH * (1 - (avgPrice - minPrice) / range) : null;

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-slate-700">近期成交单价走势</span>
        <span
          className={`flex items-center gap-0.5 text-xs font-medium ${
            priceTrend === 'up' ? 'text-red-500' : priceTrend === 'down' ? 'text-green-500' : 'text-slate-500'
          }`}
        >
          {priceTrend === 'up' ? (
            <TrendingUp size={14} />
          ) : priceTrend === 'down' ? (
            <TrendingDown size={14} />
          ) : null}
          {priceTrend === 'up' ? '上涨' : priceTrend === 'down' ? '下跌' : '持平'}
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-lg" style={{ minHeight: height }}>
        {/* Y轴刻度线和标签 */}
        {yTickValues.map((val) => {
          const y = padding.top + chartH * (1 - (val - minPrice) / range);
          return (
            <g key={val}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4,4"
              />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-slate-400">
                {val}
              </text>
            </g>
          );
        })}

        {/* 均价参考线 */}
        {avgY && (
          <g>
            <line
              x1={padding.left}
              y1={avgY}
              x2={width - padding.right}
              y2={avgY}
              stroke="#f59e0b"
              strokeDasharray="6,3"
              strokeWidth={1.5}
            />
            <text
              x={width - padding.right}
              y={avgY - 6}
              textAnchor="end"
              className="text-[10px] fill-amber-500 font-medium"
            >
              均价 {avgPrice}
            </text>
          </g>
        )}

        {/* 柱状图 */}
        {sorted.map((t, i) => {
          const x = padding.left + i * gap + (gap - barWidth) / 2;
          const barH = Math.max(4, chartH * ((t.unitPrice - minPrice) / range));
          const y = padding.top + chartH - barH;
          const isHovered = hoveredIndex === i;

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            >
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={3}
                fill={isHovered ? hoverColor : trendColor}
                className="transition-all duration-150"
              />
              {/* X轴标签 */}
              <text
                x={x + barWidth / 2}
                y={height - 8}
                textAnchor="middle"
                className="text-[10px] fill-slate-400"
              >
                {t.date.replace('2026-', '')}
              </text>
            </g>
          );
        })}

        {/* Tooltip */}
        {hoveredIndex !== null && (() => {
          const t = sorted[hoveredIndex];
          const x = padding.left + hoveredIndex * gap + gap / 2;
          const barH = Math.max(4, chartH * ((t.unitPrice - minPrice) / range));
          const y = padding.top + chartH - barH;
          return (
            <g>
              <rect
                x={Math.max(0, x - 60)}
                y={Math.max(0, y - 50)}
                width={120}
                height={42}
                rx={6}
                fill="#1e293b"
                opacity={0.9}
              />
              <text
                x={Math.max(0, x - 60) + 60}
                y={Math.max(0, y - 50) + 16}
                textAnchor="middle"
                className="text-[11px] fill-white font-medium"
              >
                {t.unitPrice.toLocaleString()}元/㎡
              </text>
              <text
                x={Math.max(0, x - 60) + 60}
                y={Math.max(0, y - 50) + 32}
                textAnchor="middle"
                className="text-[10px] fill-slate-300"
              >
                {t.size} · {t.direction}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}