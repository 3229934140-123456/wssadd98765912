import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import MapOverview from '@/pages/MapOverview';
import ExceptionHandling from '@/pages/ExceptionHandling';
import BatchArchives from '@/pages/BatchArchives';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/map-overview" replace />} />
          <Route path="map-overview" element={<MapOverview />} />
          <Route path="exception-handling" element={<ExceptionHandling />} />
          <Route path="batch-archives" element={<BatchArchives />} />
        </Route>
      </Routes>
    </Router>
  );
}
