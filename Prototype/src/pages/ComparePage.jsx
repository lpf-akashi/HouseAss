import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, ListPlus } from 'lucide-react';
import ComparisonTable from '../components/ComparisonTable';
import { communities } from '../data/mockData';

export default function ComparePage({ initialCommunities = [], onBack, onViewCommunity }) {
  const [selected, setSelected] = useState(initialCommunities);
  const [showAddPanel, setShowAddPanel] = useState(false);

  const addCommunity = (c) => {
    if (selected.length >= 4) return;
    if (!selected.find(s => s.id === c.id)) {
      setSelected([...selected, c]);
    }
    setShowAddPanel(false);
  };

  const removeCommunity = (id) => {
    setSelected(selected.filter(s => s.id !== id));
  };

  const availableCommunities = communities.filter(
    c => !selected.find(s => s.id === c.id)
  );

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <div className="page-container pt-4 pb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-700 transition-colors"
          >
            <ArrowLeft size={16} />
            返回
          </button>
          <div className="flex items-center gap-3">
            {selected.length > 0 && (
              <button
                onClick={() => setSelected([])}
                className="flex items-center gap-1 text-xs text-warm-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={13} />
                清空
              </button>
            )}
          </div>
        </div>
        <div className="mt-4">
          <h1 className="font-serif text-2xl font-bold text-warm-900">小区对比</h1>
          <p className="text-sm text-warm-500 mt-1">
            横向比较多个小区的关键维度，一目了然
          </p>
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
            <span className="text-xs text-warm-400">请添加 2-4 个小区开始对比</span>
          )}
          {selected.length > 0 && selected.length < 2 && (
            <span className="text-xs text-amber-500">请至少添加 2 个小区</span>
          )}
          {selected.length >= 4 && (
            <span className="text-xs text-warm-400">最多对比 4 个小区</span>
          )}
        </div>

        {showAddPanel && (
          <div className="mt-3 card p-4 animate-fade-in-up">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {availableCommunities.map((c) => (
                <button
                  key={c.id}
                  onClick={() => addCommunity(c)}
                  className="flex items-center justify-between p-3 rounded-lg border border-warm-200
                             hover:border-warm-400 hover:bg-warm-50 transition-all text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-warm-900">{c.name}</p>
                    <p className="text-xs text-warm-500">{c.district}·{c.subDistrict}</p>
                  </div>
                  <span className="text-sm font-medium text-warm-900">{c.pricePerSqm}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Comparison Table */}
      {selected.length >= 2 ? (
        <div className="page-container animate-fade-in-up">
          <ComparisonTable communities={selected} onRemove={removeCommunity} />
        </div>
      ) : selected.length === 1 ? (
        <div className="page-container">
          <div className="card p-8 text-center">
            <ListPlus size={32} className="mx-auto text-warm-300 mb-3" />
            <p className="text-warm-500">再添加至少 1 个小区即可开始对比</p>
          </div>
        </div>
      ) : (
        <div className="page-container">
          <div className="card p-8 text-center">
            <ListPlus size={32} className="mx-auto text-warm-300 mb-3" />
            <p className="text-warm-500 mb-3">添加小区开始对比</p>
            <p className="text-xs text-warm-400">
              选择 2-4 个小区，从均价、通勤、楼龄、成交活跃度等维度进行横向比较
            </p>
          </div>
        </div>
      )}
    </div>
  );
}