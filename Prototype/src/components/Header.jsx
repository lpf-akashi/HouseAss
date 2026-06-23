import { useState } from 'react';
import { Search, Home, Heart, ListChecks, Menu, X } from 'lucide-react';

export default function Header({ currentPage, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'search', label: '搜索', icon: Search },
    { id: 'favorites', label: '收藏', icon: Heart },
    { id: 'checklist', label: '看房清单', icon: ListChecks },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-warm-200">
      <div className="page-container">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 bg-warm-900 rounded-lg flex items-center justify-center group-hover:bg-warm-800 transition-colors">
              <span className="text-warm-50 text-sm font-serif font-bold">豪</span>
            </div>
            <span className="font-serif text-lg font-semibold text-warm-900 hidden sm:block">
              豪斯助手
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-warm-100 text-warm-900'
                      : 'text-warm-500 hover:text-warm-700 hover:bg-warm-50'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 rounded-lg text-warm-500 hover:bg-warm-100"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="sm:hidden pb-3 border-t border-warm-100 pt-2">
            <div className="flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-warm-100 text-warm-900'
                        : 'text-warm-500'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}