import React from 'react';
import { NavLink } from 'react-router-dom';
import { Map, AlertTriangle, FileBarChart, Shield, Settings, User } from 'lucide-react';

const navItems = [
  { path: '/map-overview', label: '地图总览', icon: Map },
  { path: '/exception-handling', label: '异常处置', icon: AlertTriangle },
  { path: '/batch-archives', label: '批次档案', icon: FileBarChart },
];

const Sidebar: React.FC = () => {
  return (
    <aside className="w-60 bg-dashboard-surface border-r border-dashboard-border flex flex-col h-full">
      <div className="h-16 flex items-center px-5 border-b border-dashboard-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">疫苗冷链监管</div>
            <div className="text-xs text-slate-500">疾控中心看板</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-dashboard-border">
        <div className="flex items-center gap-3 p-2 rounded-md hover:bg-dashboard-hover cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-dashboard-hover flex items-center justify-center">
            <User className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white truncate">市级管理员</div>
            <div className="text-xs text-slate-500 truncate">市疾控中心</div>
          </div>
          <Settings className="w-4 h-4 text-slate-500" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
