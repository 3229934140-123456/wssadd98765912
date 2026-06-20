import React, { useState } from 'react';
import { FileBarChart, Search, RotateCcw, Package, Building2, Calendar, Thermometer, User, Truck, X, ChevronRight, Warehouse, MapPin, AlertTriangle, Download, Shield, Clock, CheckCircle, AlertCircle, FileSpreadsheet, CheckSquare, Square } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import TempChart from '@/components/TempChart';
import { Timeline, TimelineItem } from '@/components/Timeline';
import JurisdictionSelector from '@/components/JurisdictionSelector';
import RiskBadge from '@/components/RiskBadge';
import { useBatchStore } from '@/store/batchStore';
import { useExceptionStore } from '@/store/exceptionStore';
import { useVehicleStore } from '@/store/vehicleStore';
import { useJurisdictionStore } from '@/store/jurisdictionStore';
import { vaccineNames, batchStatusOptions } from '@/mock/batches';
import { getBatchStatusText, formatTemperature, formatDateTime, getExceptionTypeText, getExceptionStatusText, getVehicleStatusText, formatRelativeTime } from '@/utils/format';
import type { VaccineBatch, ExceptionEvent, CountyDistrict } from '@/types';

const BatchArchives: React.FC = () => {
  const {
    filters,
    setFilters,
    resetFilters,
    getFilteredBatches,
    selectedBatchId,
    setSelectedBatch,
    monthlyCheckMode,
    setMonthlyCheckMode,
    selectedBatchIds,
    setSelectedBatchIds,
    toggleSelectedBatchId,
    getBatchById,
  } = useBatchStore();

  const { exceptions } = useExceptionStore();
  const { vehicles } = useVehicleStore();
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const batches = getFilteredBatches();
  const selectedBatch = selectedBatchId ? getBatchById(selectedBatchId) : null;

  const normalCount = batches.filter((b) => b.status === 'normal').length;
  const warningCount = batches.filter((b) => b.status === 'warning').length;

  const hasSelected = selectedBatchIds.length > 0;
  const allSelected = hasSelected && selectedBatchIds.length === batches.length && batches.length > 0;
  const someSelected = hasSelected && !allSelected;

  const handleOpenDetail = (batch: VaccineBatch) => {
    if (monthlyCheckMode) {
      toggleSelectedBatchId(batch.id);
    } else {
      setSelectedBatch(batch.id);
      setIsDetailOpen(true);
    }
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setTimeout(() => setSelectedBatch(null), 300);
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedBatchIds([]);
    } else {
      setSelectedBatchIds(batches.map((b) => b.id));
    }
  };

  const handleExportSingleReport = (batch: VaccineBatch) => {
    const relatedExceptions = exceptions.filter((e) => {
      const vehicle = vehicles.find((v: any) => v.id === e.vehicleId);
      return vehicle && vehicle.batchNumbers.includes(batch.batchNumber);
    });
    const relatedVehicles = vehicles.filter((v: any) => v.batchNumbers.includes(batch.batchNumber));
    const report = generateBatchReport(batch, relatedExceptions, relatedVehicles);
    downloadReport(report, `批次倒查报告_${batch.batchNumber}_${new Date().toISOString().slice(0, 10)}.txt`);
  };

  const handleExportSummaryReport = () => {
    if (!hasSelected) return;
    const selectedBatches = batches.filter((b) => selectedBatchIds.includes(b.id));
    const { level, county } = useJurisdictionStore.getState();
    const districtName = level === 'county' && county ? county : '全市';

    const allRelatedExceptions: ExceptionEvent[] = [];
    const allRelatedVehicles = new Set<string>();
    let totalQuantity = 0;
    let totalExceptionCount = 0;
    let unresolvedCount = 0;
    const vaccineTypes = new Set<string>();

    interface VaccineSummary {
      vaccineName: string;
      batchCount: number;
      quantity: number;
      riskBatchCount: number;
      exceptionCount: number;
      unresolvedExceptionCount: number;
      vehicleIds: Set<string>;
    }
    const vaccineSummaryMap = new Map<string, VaccineSummary>();

    interface DistrictSummary {
      district: CountyDistrict | string;
      batchCount: number;
      quantity: number;
      riskBatchCount: number;
      exceptionCount: number;
      unresolvedExceptionCount: number;
      vehicleIds: Set<string>;
    }
    const districtSummaryMap = new Map<string, DistrictSummary>();

    selectedBatches.forEach((b) => {
      totalQuantity += b.quantity;
      vaccineTypes.add(b.vaccineName);

      const relatedEx = exceptions.filter((e) => {
        const vehicle = vehicles.find((v: any) => v.id === e.vehicleId);
        return vehicle && vehicle.batchNumbers.includes(b.batchNumber);
      });

      const relatedVehicleIds = new Set<string>();
      let batchHasRisk = false;

      relatedEx.forEach((ex) => {
        if (!allRelatedExceptions.find((e) => e.id === ex.id)) {
          allRelatedExceptions.push(ex);
        }
        if (ex.status !== 'resolved') unresolvedCount++;
        totalExceptionCount++;
        if (ex.vehicleId) {
          allRelatedVehicles.add(ex.vehicleId);
          relatedVehicleIds.add(ex.vehicleId);
        }
        if (ex.level === 'high' || ex.level === 'medium') batchHasRisk = true;
      });

      if (b.status === 'warning' || relatedEx.some((e) => e.status !== 'resolved')) {
        batchHasRisk = true;
      }

      if (!vaccineSummaryMap.has(b.vaccineName)) {
        vaccineSummaryMap.set(b.vaccineName, {
          vaccineName: b.vaccineName,
          batchCount: 0,
          quantity: 0,
          riskBatchCount: 0,
          exceptionCount: 0,
          unresolvedExceptionCount: 0,
          vehicleIds: new Set(),
        });
      }
      const vs = vaccineSummaryMap.get(b.vaccineName)!;
      vs.batchCount++;
      vs.quantity += b.quantity;
      if (batchHasRisk) vs.riskBatchCount++;
      vs.exceptionCount += relatedEx.length;
      vs.unresolvedExceptionCount += relatedEx.filter((e) => e.status !== 'resolved').length;
      relatedVehicleIds.forEach((vid) => vs.vehicleIds.add(vid));

      const batchDistricts = new Set<string>();
      vehicles.forEach((v: any) => {
        if (v.batchNumbers.includes(b.batchNumber)) {
          batchDistricts.add(v.district);
        }
      });
      batchDistricts.forEach((d) => {
        if (!districtSummaryMap.has(d)) {
          districtSummaryMap.set(d, {
            district: d,
            batchCount: 0,
            quantity: 0,
            riskBatchCount: 0,
            exceptionCount: 0,
            unresolvedExceptionCount: 0,
            vehicleIds: new Set(),
          });
        }
        const ds = districtSummaryMap.get(d)!;
        ds.batchCount++;
        ds.quantity += b.quantity;
        if (batchHasRisk) ds.riskBatchCount++;
        ds.exceptionCount += relatedEx.length;
        ds.unresolvedExceptionCount += relatedEx.filter((e) => e.status !== 'resolved').length;
        relatedVehicleIds.forEach((vid) => ds.vehicleIds.add(vid));
      });
    });

    const lines: string[] = [];
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('         疫 苗 冷 链 月 度 检 查 汇 总 报 告');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');
    lines.push(`【报告标识】`);
    lines.push(`  报告生成时间: ${new Date().toLocaleString('zh-CN')}`);
    lines.push(`  检查周期: ${new Date().toISOString().slice(0, 7)} 月度检查`);
    lines.push(`  上报辖区: ${districtName}`);
    lines.push(`  报告编号: JL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`);
    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('                    一、检 查 概 要');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');
    lines.push(`  本次检查批次数量: ${selectedBatches.length} 批`);
    lines.push(`  涉及疫苗品类: ${Array.from(vaccineTypes).join('、')}`);
    lines.push(`  批次总剂数: ${totalQuantity.toLocaleString()} 剂`);
    lines.push(`  风险批次数量: ${selectedBatches.filter((b) => {
      const relatedEx = exceptions.filter((e) => {
        const vehicle = vehicles.find((v: any) => v.id === e.vehicleId);
        return vehicle && vehicle.batchNumbers.includes(b.batchNumber);
      });
      return b.status === 'warning' || relatedEx.some((e) => e.status !== 'resolved');
    }).length} 批`);
    lines.push(`  关联异常事件: ${totalExceptionCount} 起`);
    lines.push(`  未闭环异常: ${unresolvedCount} 起`);
    lines.push(`  涉及运输车辆: ${allRelatedVehicles.size} 辆`);
    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('                  二、按 辖 区 汇 总');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');
    if (districtSummaryMap.size === 0) {
      lines.push('  无辖区数据。');
    } else {
      lines.push('  ┌──────────┬────────┬──────────┬────────┬────────┬────────┬────────┐');
      lines.push('  │ 辖区     │ 批次数 │ 剂数     │ 风险批 │ 异常数 │ 未闭环 │ 车辆数 │');
      lines.push('  ├──────────┼────────┼──────────┼────────┼────────┼────────┼────────┤');
      Array.from(districtSummaryMap.values()).forEach((ds) => {
        const dName = String(ds.district).padEnd(6, ' ');
        lines.push(`  │ ${dName} │ ${String(ds.batchCount).padStart(6)} │ ${String(ds.quantity.toLocaleString()).padStart(8)} │ ${String(ds.riskBatchCount).padStart(6)} │ ${String(ds.exceptionCount).padStart(6)} │ ${String(ds.unresolvedExceptionCount).padStart(6)} │ ${String(ds.vehicleIds.size).padStart(6)} │`);
      });
      lines.push('  └──────────┴────────┴──────────┴────────┴────────┴────────┴────────┘');
    }
    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('                三、按 疫 苗 品 类 汇 总');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');
    if (vaccineSummaryMap.size === 0) {
      lines.push('  无疫苗品类数据。');
    } else {
      lines.push('  ┌──────────────────┬────────┬──────────┬────────┬────────┬────────┬────────┐');
      lines.push('  │ 疫苗品类         │ 批次数 │ 剂数     │ 风险批 │ 异常数 │ 未闭环 │ 车辆数 │');
      lines.push('  ├──────────────────┼────────┼──────────┼────────┼────────┼────────┼────────┤');
      Array.from(vaccineSummaryMap.values()).forEach((vs) => {
        const vName = vs.vaccineName.padEnd(14, ' ');
        lines.push(`  │ ${vName} │ ${String(vs.batchCount).padStart(6)} │ ${String(vs.quantity.toLocaleString()).padStart(8)} │ ${String(vs.riskBatchCount).padStart(6)} │ ${String(vs.exceptionCount).padStart(6)} │ ${String(vs.unresolvedExceptionCount).padStart(6)} │ ${String(vs.vehicleIds.size).padStart(6)} │`);
      });
      lines.push('  └──────────────────┴────────┴──────────┴────────┴────────┴────────┴────────┘');
    }
    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('                  四、异 常 事 件 汇 总');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');
    if (allRelatedExceptions.length === 0) {
      lines.push('  本次检查范围内无异常事件，冷链管理情况良好。');
    } else {
      const highCount = allRelatedExceptions.filter((e) => e.level === 'high').length;
      const mediumCount = allRelatedExceptions.filter((e) => e.level === 'medium').length;
      const lowCount = allRelatedExceptions.filter((e) => e.level === 'low').length;
      const resolvedCount = allRelatedExceptions.filter((e) => e.status === 'resolved').length;
      const pendingCount = allRelatedExceptions.filter((e) => e.status === 'pending').length;
      const handlingCount = allRelatedExceptions.filter((e) => e.status === 'handling').length;
      lines.push('  【风险等级分布】');
      lines.push(`    高风险异常: ${highCount} 起`);
      lines.push(`    中风险异常: ${mediumCount} 起`);
      lines.push(`    低风险异常: ${lowCount} 起`);
      lines.push('');
      lines.push('  【处置状态分布】');
      lines.push(`    待处置: ${pendingCount} 起`);
      lines.push(`    处理中: ${handlingCount} 起`);
      lines.push(`    已闭环: ${resolvedCount} 起`);
      lines.push('');
      lines.push('  【异常类型统计】');
      const typeMap: Record<string, number> = {};
      allRelatedExceptions.forEach((ex) => {
        typeMap[getExceptionTypeText(ex.type)] = (typeMap[getExceptionTypeText(ex.type)] || 0) + 1;
      });
      Object.entries(typeMap).forEach(([type, count]) => {
        lines.push(`    ${type}: ${count} 起`);
      });
      lines.push('');
      lines.push('  【未闭环异常清单】');
      const unresolvedEx = allRelatedExceptions.filter((e) => e.status !== 'resolved');
      if (unresolvedEx.length === 0) {
        lines.push('    所有异常均已闭环。');
      } else {
        unresolvedEx.forEach((ex, i) => {
          lines.push(`    ${i + 1}. [${ex.level === 'high' ? '高' : ex.level === 'medium' ? '中' : '低'}风险] ${getExceptionTypeText(ex.type)} - ${ex.plateNumber}`);
          lines.push(`       描述: ${ex.description}`);
          if (ex.handleOpinion) {
            lines.push(`       处置意见: ${ex.handleOpinion} (${ex.handler} · ${ex.handleTime})`);
          }
          if (ex.carrierFeedback) {
            lines.push(`       承运反馈: ${ex.carrierFeedback} (${ex.carrierFeedbackTime})`);
          }
          lines.push(`       当前状态: ${getExceptionStatusText(ex.status)}`);
        });
      }
      lines.push('');
      lines.push('  【处置意见汇总】');
      allRelatedExceptions
        .filter((e) => e.handleOpinion)
        .forEach((ex, i) => {
          lines.push(`    ${i + 1}. [${getExceptionTypeText(ex.type)}] ${ex.plateNumber}`);
          lines.push(`       处置意见: ${ex.handleOpinion}`);
          lines.push(`       处置人: ${ex.handler} · ${ex.handleTime}`);
          if (ex.carrierFeedback) {
            lines.push(`       承运方反馈: ${ex.carrierFeedback} (${ex.carrierFeedbackTime})`);
          }
          if (ex.status === 'resolved') {
            lines.push(`       闭环确认: ${ex.resolver} · ${ex.resolveTime}`);
          }
        });
    }
    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('                五、涉 及 车 辆 状 态 汇 总');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');
    if (allRelatedVehicles.size === 0) {
      lines.push('  无涉及车辆。');
    } else {
      const vList = vehicles.filter((v: any) => allRelatedVehicles.has(v.id));
      vList.forEach((v: any, i) => {
        const isAbnormal = v.currentTemp > 8 || v.currentTemp < 2;
        const vExceptions = allRelatedExceptions.filter((e) => e.vehicleId === v.id);
        lines.push(`  ${i + 1}. ${v.plateNumber} (${v.carrier})`);
        lines.push(`     司机: ${v.driver} · 联系电话: ${v.phone}`);
        lines.push(`     所属辖区: ${v.district} · 线路: ${v.route}`);
        lines.push(`     状态: ${getVehicleStatusText(v.status)} · 当前温度: ${formatTemperature(v.currentTemp)}${isAbnormal ? ' (温度异常!)' : ''}`);
        lines.push(`     关联异常: ${vExceptions.length} 起 (未闭环 ${vExceptions.filter((e) => e.status !== 'resolved').length} 起)`);
      });
    }
    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('                    六、各 批 次 详 情');
    lines.push('═══════════════════════════════════════════════════════════════');
    selectedBatches.forEach((batch, idx) => {
      const relatedEx = exceptions.filter((e) => {
        const vehicle = vehicles.find((v: any) => v.id === e.vehicleId);
        return vehicle && vehicle.batchNumbers.includes(batch.batchNumber);
      });
      const relatedVs = vehicles.filter((v: any) => v.batchNumbers.includes(batch.batchNumber));
      const hasAbnormal = batch.temperatureRecords.some((r) => r.temp > 8 || r.temp < 2);
      const avgTemp = batch.temperatureRecords.reduce((sum, r) => sum + r.temp, 0) / (batch.temperatureRecords.length || 1);
      const maxTemp = Math.max(...batch.temperatureRecords.map((r) => r.temp));
      const minTemp = Math.min(...batch.temperatureRecords.map((r) => r.temp));
      const unresolvedEx = relatedEx.filter((e) => e.status !== 'resolved').length;

      lines.push('');
      lines.push(`  【批次 ${idx + 1}】 ${batch.batchNumber}`);
      lines.push(`    疫苗名称: ${batch.vaccineName}`);
      lines.push(`    生产厂家: ${batch.manufacturer} · 数量: ${batch.quantity.toLocaleString()} 剂`);
      lines.push(`    生产日期: ${batch.productionDate} · 有效期至: ${batch.expiryDate}`);
      lines.push(`    批次状态: ${getBatchStatusText(batch.status)}`);
      lines.push(`    温度统计: 平均 ${avgTemp.toFixed(1)}°C · 最高 ${maxTemp.toFixed(1)}°C · 最低 ${minTemp.toFixed(1)}°C · ${hasAbnormal ? '存在异常' : '全程正常'}`);
      lines.push(`    关联异常: ${relatedEx.length} 起 (未闭环 ${unresolvedEx} 起) · 涉及车辆: ${relatedVs.length} 辆`);
      if (relatedEx.length > 0) {
        lines.push('    异常明细:');
        relatedEx.forEach((ex, j) => {
          lines.push(`      ${j + 1}. [${ex.level === 'high' ? '高' : ex.level === 'medium' ? '中' : '低'}] ${getExceptionTypeText(ex.type)} (${getExceptionStatusText(ex.status)}) - ${ex.plateNumber}`);
          lines.push(`         ${ex.description}`);
          if (ex.handleOpinion) {
            lines.push(`         处置: ${ex.handleOpinion}`);
          }
          if (ex.status === 'resolved') {
            lines.push(`         闭环: ${ex.resolver} · ${ex.resolveTime}`);
          }
        });
      }
    });
    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push(`  上报单位: ${districtName}疾控中心冷链监管科`);
    lines.push('  本报告由疾控中心冷链监管系统自动生成');
    lines.push('═══════════════════════════════════════════════════════════════');

    downloadReport(lines.join('\n'), `月度检查汇总报告_${districtName}_${selectedBatches.length}批_${new Date().toISOString().slice(0, 10)}.txt`);
  };

  return (
    <div className="h-full flex flex-col gap-5 -m-6 p-6">
      <JurisdictionSelector />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="批次总数"
          value={batches.length}
          subtitle="在库/在途批次"
          icon={Package}
          color="blue"
        />
        <StatsCard
          title="正常批次"
          value={normalCount}
          subtitle="温度全程合规"
          icon={Building2}
          color="green"
        />
        <StatsCard
          title="预警批次"
          value={warningCount}
          subtitle="温度异常待评估"
          icon={AlertTriangle}
          color="yellow"
        />
        <StatsCard
          title="召回批次"
          value={0}
          subtitle="本月无召回"
          icon={FileBarChart}
          color="red"
        />
      </div>

      <div className="dashboard-card p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Search className="w-4 h-4" />
          <span className="text-sm">搜索筛选:</span>
        </div>
        <div className="relative">
          <input
            type="text"
            className="input-field w-64 pl-9"
            placeholder="输入批号/疫苗名称/厂家..."
            value={filters.keyword}
            onChange={(e) => setFilters({ keyword: e.target.value })}
          />
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        </div>
        <select
          className="select-field min-w-[160px]"
          value={filters.vaccineName}
          onChange={(e) => setFilters({ vaccineName: e.target.value })}
        >
          {vaccineNames.map((v) => (
            <option key={v.value} value={v.value}>{v.label}</option>
          ))}
        </select>
        <select
          className="select-field min-w-[140px]"
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value })}
        >
          {batchStatusOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-2 ml-auto">
          <button
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 ${
              monthlyCheckMode
                ? 'bg-primary-600 border-primary-500 text-white'
                : 'bg-dashboard-card border-dashboard-border text-slate-400 hover:text-white hover:border-primary-500/50'
            }`}
            onClick={() => setMonthlyCheckMode(!monthlyCheckMode)}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            月度检查模式
          </button>
          <button className="btn-secondary" onClick={resetFilters}>
            <RotateCcw className="w-4 h-4" />
            <span>重置</span>
          </button>
        </div>
      </div>

      {monthlyCheckMode && (
        <div className="dashboard-card p-3 bg-primary-500/5 border-primary-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              {allSelected ? (
                <CheckSquare className="w-4 h-4 text-primary-400" />
              ) : someSelected ? (
                <CheckSquare className="w-4 h-4 text-primary-400 opacity-60" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
              <span onClick={handleSelectAll}>全选</span>
            </label>
            <span className="text-xs text-slate-500">
              已选择 <span className="text-primary-400 font-medium">{selectedBatchIds.length}</span> / {batches.length} 批
            </span>
          </div>
          <button
            className="btn-primary text-xs"
            onClick={handleExportSummaryReport}
            disabled={!hasSelected}
          >
            <Download className="w-4 h-4" />
            <span>导出汇总报告</span>
          </button>
        </div>
      )}

      <div className="dashboard-card flex-1 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-dashboard-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            {monthlyCheckMode ? '月度检查批次列表' : '批次档案列表'}
          </h3>
          <span className="text-xs text-slate-500">共 {batches.length} 条记录</span>
        </div>
        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead>
              <tr className="bg-dashboard-surface text-left text-xs text-slate-400 sticky top-0">
                {monthlyCheckMode && (
                  <th className="px-3 py-3 font-medium w-12">
                    <label className="flex items-center justify-center">
                      {allSelected ? (
                        <CheckSquare className="w-4 h-4 text-primary-400 cursor-pointer" onClick={handleSelectAll} />
                      ) : someSelected ? (
                        <CheckSquare className="w-4 h-4 text-primary-400 opacity-60 cursor-pointer" onClick={handleSelectAll} />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 cursor-pointer" onClick={handleSelectAll} />
                      )}
                    </label>
                  </th>
                )}
                <th className="px-4 py-3 font-medium">批号</th>
                <th className="px-4 py-3 font-medium">疫苗名称</th>
                <th className="px-4 py-3 font-medium">生产厂家</th>
                <th className="px-4 py-3 font-medium">数量</th>
                <th className="px-4 py-3 font-medium">生产日期</th>
                <th className="px-4 py-3 font-medium">有效期</th>
                <th className="px-4 py-3 font-medium">异常数</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashboard-border">
              {batches.map((batch, idx) => {
                const relatedExceptions = exceptions.filter((e) => {
                  const vehicle = vehicles.find((v: any) => v.id === e.vehicleId);
                  return vehicle && vehicle.batchNumbers.includes(batch.batchNumber);
                });
                const hasUnresolved = relatedExceptions.some((e) => e.status !== 'resolved');
                const isSelected = selectedBatchIds.includes(batch.id);

                return (
                  <tr
                    key={batch.id}
                    className={`hover:bg-dashboard-hover transition-colors animate-fade-in ${
                      isSelected ? 'bg-primary-500/10' : ''
                    }`}
                    style={{ animationDelay: `${idx * 30}ms` }}
                    onClick={() => handleOpenDetail(batch)}
                  >
                    {monthlyCheckMode && (
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <label className="flex items-center justify-center cursor-pointer">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-primary-400" onClick={() => toggleSelectedBatchId(batch.id)} />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500 hover:text-slate-300" onClick={() => toggleSelectedBatchId(batch.id)} />
                          )}
                        </label>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-white">{batch.batchNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-200">{batch.vaccineName}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{batch.manufacturer}</td>
                    <td className="px-4 py-3 text-sm text-slate-200 data-number">{batch.quantity.toLocaleString()} 剂</td>
                    <td className="px-4 py-3 text-sm text-slate-400 data-number">{batch.productionDate}</td>
                    <td className="px-4 py-3 text-sm text-slate-400 data-number">{batch.expiryDate}</td>
                    <td className="px-4 py-3">
                      {relatedExceptions.length > 0 ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                          hasUnresolved ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          <AlertTriangle className="w-3 h-3" />
                          {relatedExceptions.length}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs ${
                        batch.status === 'normal' ? 'bg-emerald-500/20 text-emerald-400' :
                        batch.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        <span className={`status-dot ${
                          batch.status === 'normal' ? 'bg-emerald-500' :
                          batch.status === 'warning' ? 'bg-amber-500' :
                          'bg-red-500'
                        }`} />
                        {getBatchStatusText(batch.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {monthlyCheckMode ? (
                        <button
                          className="text-xs text-slate-400 hover:text-primary-400 flex items-center gap-1 ml-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBatch(batch.id);
                            setIsDetailOpen(true);
                          }}
                        >
                          查看 <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1 ml-auto">
                          <span>倒查</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {batches.length === 0 && (
                <tr>
                  <td colSpan={monthlyCheckMode ? 10 : 9} className="px-4 py-16 text-center text-slate-500">
                    <FileBarChart className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                    <div>未找到匹配的批次记录</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDetailOpen && selectedBatch && (
        <BatchDetailDrawer
          batch={selectedBatch}
          onClose={handleCloseDetail}
          onExport={handleExportSingleReport}
          exceptions={exceptions}
          vehicles={vehicles}
        />
      )}
    </div>
  );
};

const BatchDetailDrawer: React.FC<{
  batch: VaccineBatch;
  onClose: () => void;
  onExport: (batch: VaccineBatch) => void;
  exceptions: any[];
  vehicles: any[];
}> = ({ batch, onClose, onExport, exceptions, vehicles }) => {
  const relatedExceptions = exceptions.filter((e) => {
    const vehicle = vehicles.find((v: any) => v.id === e.vehicleId);
    return vehicle && vehicle.batchNumbers.includes(batch.batchNumber);
  });

  const relatedVehicles = vehicles.filter((v: any) => v.batchNumbers.includes(batch.batchNumber));

  const timelineItems: TimelineItem[] = batch.transportChain.map((node) => ({
    type: node.type,
    title: node.name,
    time: node.time,
    description: node.description,
    person: node.person,
  }));

  const hasAnomaly = batch.temperatureRecords.some((r) => r.temp > 8 || r.temp < 2);
  const avgTemp = batch.temperatureRecords.reduce((sum, r) => sum + r.temp, 0) / (batch.temperatureRecords.length || 1);
  const maxTemp = Math.max(...batch.temperatureRecords.map((r) => r.temp));
  const minTemp = Math.min(...batch.temperatureRecords.map((r) => r.temp));

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="ml-auto w-full max-w-3xl h-full bg-dashboard-surface border-l border-dashboard-border overflow-hidden flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-dashboard-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white font-mono">{batch.batchNumber}</h2>
              <p className="text-xs text-slate-400">{batch.vaccineName} · 倒查视图</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs ml-2 ${
              batch.status === 'normal' ? 'bg-emerald-500/20 text-emerald-400' :
              batch.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {hasAnomaly && batch.status === 'normal' && <AlertTriangle className="w-3 h-3" />}
              {getBatchStatusText(batch.status)}
            </span>
          </div>
          <button
            className="p-2 rounded-md hover:bg-dashboard-hover text-slate-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="dashboard-card p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
                <Building2 className="w-3.5 h-3.5" />
                生产厂家
              </div>
              <div className="text-sm text-white">{batch.manufacturer}</div>
            </div>
            <div className="dashboard-card p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
                <Package className="w-3.5 h-3.5" />
                批次数量
              </div>
              <div className="text-sm text-white data-number">{batch.quantity.toLocaleString()} 剂</div>
            </div>
            <div className="dashboard-card p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
                <Calendar className="w-3.5 h-3.5" />
                生产日期
              </div>
              <div className="text-sm text-white data-number">{batch.productionDate}</div>
            </div>
            <div className="dashboard-card p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
                <Calendar className="w-3.5 h-3.5" />
                有效期至
              </div>
              <div className="text-sm text-white data-number">{batch.expiryDate}</div>
            </div>
          </div>

          {relatedExceptions.length > 0 && (
            <div className="dashboard-card p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-400" />
                关联异常事件
                <span className="text-xs text-slate-500 font-normal">({relatedExceptions.length})</span>
              </h3>
              <div className="space-y-3">
                {relatedExceptions.map((ex) => (
                  <div key={ex.id} className="p-3 rounded bg-dashboard-surface border border-dashboard-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          ex.level === 'high' ? 'bg-red-500' : ex.level === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        <span className="text-sm text-white font-medium">{getExceptionTypeText(ex.type)}</span>
                        <RiskBadge level={ex.level} size="sm" />
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        ex.status === 'pending' ? 'bg-red-500/20 text-red-400' :
                        ex.status === 'handling' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {getExceptionStatusText(ex.status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{ex.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        {ex.plateNumber}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(ex.timestamp)}
                      </span>
                      {ex.temperature !== undefined && (
                        <span className={`data-number ${ex.temperature > 8 ? 'text-red-400' : 'text-slate-400'}`}>
                          {formatTemperature(ex.temperature)}
                        </span>
                      )}
                    </div>
                    {ex.handleOpinion && (
                      <div className="mt-2 pt-2 border-t border-dashboard-border">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                          <User className="w-3 h-3" />
                          <span>最新处置意见 · {ex.handler} · {formatDateTime(ex.handleTime!)}</span>
                        </div>
                        <div className="text-xs text-primary-300 bg-dashboard-hover p-2 rounded">
                          {ex.handleOpinion}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {relatedVehicles.length > 0 && (
            <div className="dashboard-card p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary-400" />
                涉及车辆当前状态
                <span className="text-xs text-slate-500 font-normal">({relatedVehicles.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {relatedVehicles.map((v: any) => {
                  const isAbnormal = v.currentTemp > 8 || v.currentTemp < 2;
                  return (
                    <div key={v.id} className="p-3 rounded bg-dashboard-surface border border-dashboard-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Truck className={`w-4 h-4 ${isAbnormal ? 'text-red-400' : 'text-emerald-400'}`} />
                          <span className="text-sm text-white font-medium">{v.plateNumber}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          v.status === 'in-transit' ? 'bg-primary-500/20 text-primary-400' :
                          v.status === 'stopped' ? 'bg-amber-500/20 text-amber-400' :
                          v.status === 'loading' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {getVehicleStatusText(v.status)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Thermometer className="w-3 h-3" />
                          <span className={`data-number ${isAbnormal ? 'text-red-400' : 'text-emerald-400'}`}>
                            {formatTemperature(v.currentTemp)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{v.district}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>承运:</span>
                          <span className="text-slate-300">{v.carrier}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>线路:</span>
                          <span className="text-slate-300 truncate">{v.route}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="dashboard-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-primary-400" />
                温度监控记录
              </h3>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">平均:</span>
                  <span className={`data-number ${avgTemp > 8 || avgTemp < 2 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {avgTemp.toFixed(1)}°C
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">最高:</span>
                  <span className={`data-number ${maxTemp > 8 ? 'text-red-400' : 'text-slate-200'}`}>
                    {maxTemp.toFixed(1)}°C
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">最低:</span>
                  <span className={`data-number ${minTemp < 2 ? 'text-red-400' : 'text-slate-200'}`}>
                    {minTemp.toFixed(1)}°C
                  </span>
                </div>
              </div>
            </div>
            <TempChart records={batch.temperatureRecords} height={200} />
            {hasAnomaly && (
              <div className="mt-4 p-3 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  该批次存在温度异常记录，部分时段温度超出 2-8°C 安全范围，请结合运输记录评估疫苗有效性并决定是否召回。
                </span>
              </div>
            )}
          </div>

          <div className="dashboard-card p-4">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary-400" />
              全链路追溯
            </h3>
            <div className="pl-2">
              <Timeline items={timelineItems} />
            </div>
          </div>

          <div className="dashboard-card p-4">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-400" />
              责任人员汇总
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {batch.transportChain.map((node, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded bg-dashboard-surface">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    node.type === 'warehouse' ? 'bg-blue-500/20 text-blue-400' :
                    node.type === 'vehicle' ? 'bg-primary-500/20 text-primary-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {node.type === 'warehouse' ? <Warehouse className="w-4 h-4" /> :
                     node.type === 'vehicle' ? <Truck className="w-4 h-4" /> :
                     <MapPin className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm text-white truncate">{node.person}</div>
                    <div className="text-xs text-slate-500 truncate">{node.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-dashboard-border flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-500">
            <Warehouse className="w-3.5 h-3.5 inline mr-1" />
            起始仓: {batch.warehouse}
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={onClose}>关闭</button>
            <button
              className="btn-primary"
              onClick={() => onExport(batch)}
            >
              <Download className="w-4 h-4" />
              <span>导出倒查报告</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function generateBatchReport(
  batch: VaccineBatch,
  relatedExceptions: any[],
  relatedVehicles: any[]
): string {
  const lines: string[] = [];
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('                       疫苗批次倒查简要报告');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`报告生成时间: ${new Date().toLocaleString('zh-CN')}`);
  lines.push('');
  lines.push('【一、批次基础信息】');
  lines.push(`  批号: ${batch.batchNumber}`);
  lines.push(`  疫苗名称: ${batch.vaccineName}`);
  lines.push(`  生产厂家: ${batch.manufacturer}`);
  lines.push(`  生产日期: ${batch.productionDate}`);
  lines.push(`  有效期至: ${batch.expiryDate}`);
  lines.push(`  批次数量: ${batch.quantity.toLocaleString()} 剂`);
  lines.push(`  起始仓库: ${batch.warehouse}`);
  lines.push(`  当前状态: ${getBatchStatusText(batch.status)}`);
  lines.push('');

  const hasAnomaly = batch.temperatureRecords.some((r) => r.temp > 8 || r.temp < 2);
  const avgTemp = batch.temperatureRecords.reduce((sum, r) => sum + r.temp, 0) / (batch.temperatureRecords.length || 1);
  const maxTemp = Math.max(...batch.temperatureRecords.map((r) => r.temp));
  const minTemp = Math.min(...batch.temperatureRecords.map((r) => r.temp));

  lines.push('【二、温度监控概要】');
  lines.push(`  温度异常: ${hasAnomaly ? '是' : '否'}`);
  lines.push(`  平均温度: ${avgTemp.toFixed(1)}°C`);
  lines.push(`  最高温度: ${maxTemp.toFixed(1)}°C`);
  lines.push(`  最低温度: ${minTemp.toFixed(1)}°C`);
  lines.push('');

  lines.push('【三、关联异常事件】');
  if (relatedExceptions.length === 0) {
    lines.push('  无关联异常');
  } else {
    relatedExceptions.forEach((ex, i) => {
      lines.push(`  ${i + 1}. [${getExceptionStatusText(ex.status)}] ${getExceptionTypeText(ex.type)} - ${ex.plateNumber}`);
      lines.push(`     描述: ${ex.description}`);
      if (ex.handleOpinion) {
        lines.push(`     最新处置意见: ${ex.handleOpinion} (${ex.handler} · ${ex.handleTime})`);
      }
    });
  }
  lines.push('');

  lines.push('【四、涉及车辆及当前状态】');
  if (relatedVehicles.length === 0) {
    lines.push('  无关联车辆');
  } else {
    relatedVehicles.forEach((v, i) => {
      const isAbnormal = v.currentTemp > 8 || v.currentTemp < 2;
      lines.push(`  ${i + 1}. ${v.plateNumber} (${v.carrier}) - ${getVehicleStatusText(v.status)} - 当前温度: ${formatTemperature(v.currentTemp)}${isAbnormal ? ' (温度异常)' : ''}`);
    });
  }
  lines.push('');

  lines.push('【五、全链路运输记录】');
  batch.transportChain.forEach((node) => {
    lines.push(`  [${node.type === 'warehouse' ? '仓库' : node.type === 'vehicle' ? '车辆' : '站点'}] ${node.name} | ${node.person} | ${node.time}`);
    lines.push(`    ${node.description}`);
  });
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('  本报告由疾控中心冷链监管系统自动生成');
  lines.push('═══════════════════════════════════════════════════════════════');

  return lines.join('\n');
}

function downloadReport(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default BatchArchives;
