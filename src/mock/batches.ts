import type { VaccineBatch } from '@/types';

const generateTempRecords = (startTime: string, count: number, hasAnomaly = false): { timestamp: string; temp: number }[] => {
  const records: { timestamp: string; temp: number }[] = [];
  const base = new Date(startTime);
  for (let i = 0; i < count; i++) {
    const time = new Date(base.getTime() + i * 15 * 60 * 1000);
    let temp = 3.5 + Math.random() * 2;
    if (hasAnomaly && i >= count / 2 && i <= count * 0.7) {
      temp = 7 + Math.random() * 3;
    }
    records.push({
      timestamp: time.toISOString().slice(0, 16).replace('T', ' '),
      temp: Math.round(temp * 10) / 10,
    });
  }
  return records;
};

export const mockBatches: VaccineBatch[] = [
  {
    id: 'b001',
    batchNumber: 'B20260615-A01',
    vaccineName: '新冠灭活疫苗',
    manufacturer: '国药集团北京生物制品研究所',
    productionDate: '2026-06-10',
    expiryDate: '2027-06-09',
    quantity: 1200,
    warehouse: '市疾控中心一号冷库',
    status: 'normal',
    temperatureRecords: generateTempRecords('2026-06-21 14:00', 12),
    transportChain: [
      { type: 'warehouse', name: '生产企业成品库', person: '质量部-陈敏', time: '2026-06-12 09:00', description: '出厂检验合格，签发检验报告' },
      { type: 'vehicle', name: '国药冷链-京A·88888', person: '司机-刘国强', time: '2026-06-12 14:30', description: '全程温度3.8-4.5°C，运输正常' },
      { type: 'warehouse', name: '市疾控中心一号冷库', person: '库管员-赵晓峰', time: '2026-06-12 18:00', description: '入库验收，扫码登记1200剂' },
      { type: 'vehicle', name: '华运冷链-京A·12345', person: '司机-张建国', time: '2026-06-21 14:00', description: '装车出库，温度4.0°C' },
      { type: 'station', name: '朝阳区社区接种中心', person: '接种点-王丽华', time: '预计2026-06-21 16:30', description: '等待收货' },
    ],
  },
  {
    id: 'b002',
    batchNumber: 'B20260615-A02',
    vaccineName: '新冠灭活疫苗',
    manufacturer: '国药集团北京生物制品研究所',
    productionDate: '2026-06-10',
    expiryDate: '2027-06-09',
    quantity: 800,
    warehouse: '市疾控中心一号冷库',
    status: 'normal',
    temperatureRecords: generateTempRecords('2026-06-21 14:00', 12),
    transportChain: [
      { type: 'warehouse', name: '生产企业成品库', person: '质量部-陈敏', time: '2026-06-12 09:00', description: '出厂检验合格' },
      { type: 'vehicle', name: '国药冷链-京A·88888', person: '司机-刘国强', time: '2026-06-12 14:30', description: '全程冷链运输' },
      { type: 'warehouse', name: '市疾控中心一号冷库', person: '库管员-赵晓峰', time: '2026-06-12 18:00', description: '入库800剂' },
      { type: 'vehicle', name: '华运冷链-京A·12345', person: '司机-张建国', time: '2026-06-21 14:00', description: '装车出库' },
      { type: 'station', name: '朝阳区社区接种中心', person: '接种点-王丽华', time: '预计2026-06-21 16:30', description: '等待收货' },
    ],
  },
  {
    id: 'b003',
    batchNumber: 'B20260610-B03',
    vaccineName: '重组乙肝疫苗',
    manufacturer: '深圳康泰生物制品股份有限公司',
    productionDate: '2026-06-05',
    expiryDate: '2028-06-04',
    quantity: 500,
    warehouse: '市疾控中心二号冷库',
    status: 'warning',
    temperatureRecords: generateTempRecords('2026-06-21 13:00', 12, true),
    transportChain: [
      { type: 'warehouse', name: '生产企业成品库', person: '质量部-林志强', time: '2026-06-08 10:00', description: '出厂检验合格' },
      { type: 'vehicle', name: '康泰冷链-粤B·66666', person: '司机-黄海涛', time: '2026-06-08 15:00', description: '跨省冷链运输' },
      { type: 'warehouse', name: '市疾控中心二号冷库', person: '库管员-孙文博', time: '2026-06-10 08:00', description: '入库验收500剂' },
      { type: 'vehicle', name: '中通冷链-京B·67890', person: '司机-李卫东', time: '2026-06-21 13:00', description: '装车出库，温度4.8°C' },
      { type: 'station', name: '海淀区预防接种门诊', person: '接种点-周医生', time: '预计2026-06-21 15:45', description: '运输中出现温度异常，待评估' },
    ],
  },
  {
    id: 'b004',
    batchNumber: 'B20260612-C01',
    vaccineName: '百白破联合疫苗',
    manufacturer: '武汉生物制品研究所有限责任公司',
    productionDate: '2026-06-08',
    expiryDate: '2027-12-07',
    quantity: 600,
    warehouse: '市疾控中心一号冷库',
    status: 'normal',
    temperatureRecords: generateTempRecords('2026-06-21 14:30', 8),
    transportChain: [
      { type: 'warehouse', name: '生产企业成品库', person: '质量部-马晓东', time: '2026-06-10 08:30', description: '批签发合格' },
      { type: 'vehicle', name: '武汉生物冷链-鄂A·99999', person: '司机-吴建军', time: '2026-06-10 14:00', description: '全程温度3.2-4.1°C' },
      { type: 'warehouse', name: '市疾控中心一号冷库', person: '库管员-赵晓峰', time: '2026-06-11 20:00', description: '入库600剂' },
      { type: 'vehicle', name: '华运冷链-京C·24680', person: '司机-王海涛', time: '2026-06-21 14:30', description: '装车出库' },
      { type: 'station', name: '丰台区疾控中心接种点', person: '接种点-刘护士', time: '预计2026-06-21 17:10', description: '运输中' },
    ],
  },
  {
    id: 'b005',
    batchNumber: 'B20260608-D02',
    vaccineName: '九价HPV疫苗',
    manufacturer: '默沙东（美国）',
    productionDate: '2026-03-15',
    expiryDate: '2028-03-14',
    quantity: 200,
    warehouse: '市疾控中心专用冷库',
    status: 'normal',
    temperatureRecords: generateTempRecords('2026-06-21 15:00', 6),
    transportChain: [
      { type: 'warehouse', name: '上海进口疫苗监管仓', person: '海关-检验检疫', time: '2026-05-20 10:00', description: '进口检验合格' },
      { type: 'vehicle', name: '专业冷链-沪A·77777', person: '司机-郑伟', time: '2026-05-22 09:00', description: '恒温运输2-8°C' },
      { type: 'warehouse', name: '市疾控中心专用冷库', person: '库管员-钱主任', time: '2026-05-23 16:00', description: '入库200剂，专库管理' },
      { type: 'vehicle', name: '顺丰冷链-京D·13579', person: '司机-赵明辉', time: '2026-06-21 15:00', description: '装车中' },
      { type: 'station', name: '通州区妇幼保健院', person: '接种点-妇科门诊', time: '预计2026-06-21 18:00', description: '待发货' },
    ],
  },
  {
    id: 'b006',
    batchNumber: 'B20260614-E01',
    vaccineName: '四价流感疫苗',
    manufacturer: '华兰生物疫苗股份有限公司',
    productionDate: '2026-06-01',
    expiryDate: '2027-05-31',
    quantity: 1000,
    warehouse: '市疾控中心一号冷库',
    status: 'normal',
    temperatureRecords: generateTempRecords('2026-06-21 14:00', 10),
    transportChain: [
      { type: 'warehouse', name: '生产企业成品库', person: '质量部-徐静', time: '2026-06-05 11:00', description: '批签发合格' },
      { type: 'vehicle', name: '华兰生物冷链-豫A·55555', person: '司机-韩磊', time: '2026-06-06 08:00', description: '全程冷链运输' },
      { type: 'warehouse', name: '市疾控中心一号冷库', person: '库管员-赵晓峰', time: '2026-06-07 14:00', description: '入库1000剂' },
      { type: 'vehicle', name: '中通冷链-京E·98765', person: '司机-孙志远', time: '2026-06-21 14:00', description: '装车出库' },
      { type: 'station', name: '大兴区人民医院接种点', person: '接种点-预防保健科', time: '预计2026-06-21 16:50', description: '运输中' },
    ],
  },
  {
    id: 'b007',
    batchNumber: 'B20260613-F01',
    vaccineName: '23价肺炎疫苗',
    manufacturer: '成都生物制品研究所有限责任公司',
    productionDate: '2026-05-20',
    expiryDate: '2028-05-19',
    quantity: 400,
    warehouse: '市疾控中心一号冷库',
    status: 'normal',
    temperatureRecords: generateTempRecords('2026-06-21 13:30', 10),
    transportChain: [
      { type: 'warehouse', name: '生产企业成品库', person: '质量部-冯刚', time: '2026-06-02 09:30', description: '批签发合格' },
      { type: 'vehicle', name: '成都生物冷链-川A·33333', person: '司机-邓辉', time: '2026-06-03 10:00', description: '全程温度3.5-4.8°C' },
      { type: 'warehouse', name: '市疾控中心一号冷库', person: '库管员-孙文博', time: '2026-06-05 18:00', description: '入库400剂' },
      { type: 'vehicle', name: '华运冷链-京F·55555', person: '司机-周建华', time: '2026-06-21 13:30', description: '装车出库' },
      { type: 'station', name: '昌平区疾控中心', person: '接种点-疾控科', time: '预计2026-06-21 17:30', description: '运输中' },
    ],
  },
];

export const vaccineNames = [
  { value: '', label: '全部疫苗' },
  { value: '新冠灭活疫苗', label: '新冠灭活疫苗' },
  { value: '重组乙肝疫苗', label: '重组乙肝疫苗' },
  { value: '百白破联合疫苗', label: '百白破联合疫苗' },
  { value: '九价HPV疫苗', label: '九价HPV疫苗' },
  { value: '四价流感疫苗', label: '四价流感疫苗' },
  { value: '23价肺炎疫苗', label: '23价肺炎疫苗' },
];

export const batchStatusOptions = [
  { value: '', label: '全部状态' },
  { value: 'normal', label: '正常' },
  { value: 'warning', label: '预警' },
  { value: 'recalled', label: '召回' },
];
