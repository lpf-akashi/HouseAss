import { useState } from 'react';
import { ListChecks, Copy, CheckCircle2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { checklistItems } from '../data/mockData';

export default function ChecklistPage() {
  const [checked, setChecked] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ha_checklist') || '{}');
    } catch { return {}; }
  });
  const [showCopyMsg, setShowCopyMsg] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCheck = (id) => {
    const updated = { ...checked, [id]: !checked[id] };
    setChecked(updated);
    localStorage.setItem('ha_checklist', JSON.stringify(updated));
  };

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const copyUnchecked = () => {
    const unchecked = checklistItems
      .filter(item => !checked[item.id])
      .map((item, i) => `${i + 1}. ${item.question}`);
    const text = unchecked.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setShowCopyMsg(true);
      setTimeout(() => setShowCopyMsg(false), 2000);
    });
  };

  // Group by category
  const categories = {};
  checklistItems.forEach(item => {
    if (!categories[item.category]) {
      categories[item.category] = [];
    }
    categories[item.category].push(item);
  });

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const totalCount = checklistItems.length;
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen pb-16">
      <div className="page-container pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-warm-900">看房清单</h1>
            <p className="text-sm text-warm-500 mt-1">
              线下看房逐项确认，不遗漏关键信息
            </p>
          </div>
          <button
            onClick={copyUnchecked}
            className="btn-secondary text-xs flex items-center gap-1.5"
            disabled={checkedCount === totalCount}
          >
            <Copy size={12} />
            {showCopyMsg ? '已复制！' : '复制未确认项'}
          </button>
        </div>

        {/* Progress */}
        <div className="mt-4 card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-warm-700">
              确认进度
            </span>
            <span className="text-sm text-warm-500">
              {checkedCount}/{totalCount} 项
            </span>
          </div>
          <div className="w-full h-2 bg-warm-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-sage-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="page-container">
        <div className="space-y-4">
          {Object.entries(categories).map(([category, items]) => {
            const catChecked = items.filter(i => checked[i.id]).length;
            const isExpanded = expandedCategories[category] !== false; // default expanded

            return (
              <div key={category} className="card overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full p-4 flex items-center justify-between hover:bg-warm-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-semibold text-warm-900">{category}</span>
                    <span className="text-xs text-warm-400">
                      {catChecked}/{items.length}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-warm-400" />
                  ) : (
                    <ChevronDown size={16} className="text-warm-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-warm-100">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggleCheck(item.id)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors
                          hover:bg-warm-50 border-b border-warm-50 last:border-0`}
                      >
                        <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center
                          flex-shrink-0 transition-all ${
                            checked[item.id]
                              ? 'bg-sage-500 border-sage-500'
                              : 'border-warm-300 hover:border-warm-400'
                          }`}>
                          {checked[item.id] && <CheckCircle2 size={14} className="text-white" />}
                        </div>
                        <span className={`text-sm flex-1 ${
                          checked[item.id] ? 'text-warm-400 line-through' : 'text-warm-700'
                        }`}>
                          {item.question}
                        </span>
                        {item.important && (
                          <span className="tag-red text-xs flex-shrink-0">重要</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 card p-4 flex items-start gap-3">
          <Info size={16} className="text-warm-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-warm-500">
            以上清单为通用建议，建议根据具体小区情况补充个性化问题（如学区政策、周边规划等）。
            确认状态保存在本地浏览器中。
          </p>
        </div>
      </div>
    </div>
  );
}