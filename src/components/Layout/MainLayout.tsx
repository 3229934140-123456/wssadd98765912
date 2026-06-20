import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles: Record<string, string> = {
  '/map-overview': '地图总览',
  '/exception-handling': '异常处置',
  '/batch-archives': '批次档案',
};

const MainLayout: React.FC = () => {
  const location = useLocation();
  const title = pageTitles[location.pathname] || '疫苗冷链监管看板';

  return (
    <div className="flex w-full h-full bg-dashboard-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
