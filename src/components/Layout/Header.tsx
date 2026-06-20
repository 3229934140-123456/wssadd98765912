import React, { useState, useEffect } from 'react';
import { Bell, RefreshCw, Clock } from 'lucide-react';
import { useExceptionStore } from '@/store/exceptionStore';

const Header: React.FC<{ title: string }> = ({ title }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { getStats } = useExceptionStore();
  const stats = getStats();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  return (
    <header className="h-16 bg-dashboard-surface border-b border-dashboard-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        <div className="h-4 w-px bg-dashboard-border" />
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Clock className="w-4 h-4" />
          <span className="data-number">{formatDate(currentTime)}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
          <span>刷新数据</span>
        </button>

        <div className="relative">
          <button className="p-2 rounded-md hover:bg-dashboard-hover text-slate-400 hover:text-white transition-colors relative">
            <Bell className="w-5 h-5" />
            {stats.pending > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium">
                {stats.pending}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-dashboard-card border border-dashboard-border">
          <span className="status-dot bg-emerald-500 animate-pulse" />
          <span className="text-xs text-slate-400">系统运行正常</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
