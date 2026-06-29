import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DetailPage from './pages/DetailPage';
import ComparePage from './pages/ComparePage';
import FavoritesPage from './pages/FavoritesPage';
import ChecklistPage from './pages/ChecklistPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#faf8f5]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/detail/:id" element={<DetailPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/checklist" element={<ChecklistPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}