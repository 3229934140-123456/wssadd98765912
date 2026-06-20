import React from 'react';
import { Building2, MapPin } from 'lucide-react';
import { useJurisdictionStore } from '@/store/jurisdictionStore';
import type { CountyDistrict } from '@/types';
import { districts } from '@/mock/vehicles';

const JurisdictionSelector: React.FC = () => {
  const { level, county, setLevel, setCounty } = useJurisdictionStore();

  const jurisdictionLabel =
    level === 'city' ? '全市辖区' : county ? `县级·${county}` : '县级·未选择辖区';

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 bg-dashboard-card border border-dashboard-border rounded-lg overflow-hidden">
        <button
          className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
            level === 'city'
              ? 'bg-primary-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-dashboard-hover'
          }`}
          onClick={() => setLevel('city')}
        >
          <Building2 className="w-3.5 h-3.5" />
          市级
        </button>
        <button
          className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
            level === 'county'
              ? 'bg-primary-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-dashboard-hover'
          }`}
          onClick={() => setLevel('county')}
        >
          <MapPin className="w-3.5 h-3.5" />
          县级
        </button>
      </div>
      {level === 'county' && (
        <select
          className="select-field text-xs min-w-[130px] py-1.5"
          value={county}
          onChange={(e) => setCounty(e.target.value as CountyDistrict | '')}
        >
          <option value="">选择辖区</option>
          {districts.filter((d) => d.value).map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      )}
      <div className="text-xs text-slate-500 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
        当前视图: <span className="text-primary-400">{jurisdictionLabel}</span>
      </div>
    </div>
  );
};

export default JurisdictionSelector;
