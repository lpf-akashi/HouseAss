import { useState, useCallback } from 'react';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import DetailPage from './pages/DetailPage';
import ComparePage from './pages/ComparePage';
import FavoritesPage from './pages/FavoritesPage';
import ChecklistPage from './pages/ChecklistPage';
import { communities } from './data/mockData';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [compareCommunities, setCompareCommunities] = useState([]);

  const handleNavigate = useCallback((page) => {
    setCurrentPage(page);
    if (page !== 'detail') {
      setSelectedCommunity(null);
    }
    if (page !== 'compare') {
      setCompareCommunities([]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleViewCommunity = useCallback((community, action) => {
    setSelectedCommunity(community);
    if (action === 'compare') {
      setCompareCommunities([community]);
      setCurrentPage('compare');
    } else {
      setCurrentPage('detail');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBack = useCallback(() => {
    if (currentPage === 'detail') {
      setSelectedCommunity(null);
    }
    if (currentPage === 'compare') {
      setCompareCommunities([]);
    }
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            onNavigate={handleNavigate}
            onViewCommunity={handleViewCommunity}
          />
        );
      case 'search':
        // Search is built into the home page, so just show home
        return (
          <HomePage
            onNavigate={handleNavigate}
            onViewCommunity={handleViewCommunity}
          />
        );
      case 'detail':
        return selectedCommunity ? (
          <DetailPage
            community={selectedCommunity}
            onBack={handleBack}
            onViewCommunity={handleViewCommunity}
          />
        ) : (
          <HomePage
            onNavigate={handleNavigate}
            onViewCommunity={handleViewCommunity}
          />
        );
      case 'compare':
        return (
          <ComparePage
            initialCommunities={compareCommunities}
            onBack={handleBack}
            onViewCommunity={handleViewCommunity}
          />
        );
      case 'favorites':
        return (
          <FavoritesPage
            onViewCommunity={handleViewCommunity}
          />
        );
      case 'checklist':
        return <ChecklistPage />;
      default:
        return (
          <HomePage
            onNavigate={handleNavigate}
            onViewCommunity={handleViewCommunity}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-warm-50">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />
      <main>{renderPage()}</main>
    </div>
  );
}