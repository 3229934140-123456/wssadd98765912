export const formatTemperature = (temp: number): string => {
  return `${temp.toFixed(1)}°C`;
};

export const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const formatRelativeTime = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}小时前`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}天前`;
};

export const getRiskLevelText = (level: string): string => {
  const map: Record<string, string> = {
    high: '高风险',
    medium: '中风险',
    low: '低风险',
  };
  return map[level] || level;
};

export const getExceptionTypeText = (type: string): string => {
  const map: Record<string, string> = {
    'over-temperature': '温度超标',
    'long-stop': '长时间停留',
    'route-deviation': '路线偏离',
    'door-open': '异常开门',
  };
  return map[type] || type;
};

export const getVehicleStatusText = (status: string): string => {
  const map: Record<string, string> = {
    'in-transit': '运输中',
    stopped: '已停车',
    loading: '装卸中',
    arrived: '已到达',
  };
  return map[status] || status;
};

export const getEventTypeText = (type: string): string => {
  const map: Record<string, string> = {
    normal: '正常行驶',
    loading: '装车',
    unloading: '卸车',
    stop: '停车',
    'door-open': '开门',
    'door-close': '关门',
  };
  return map[type] || type;
};

export const getExceptionStatusText = (status: string): string => {
  const map: Record<string, string> = {
    pending: '待处理',
    handling: '处理中',
    resolved: '已解决',
  };
  return map[status] || status;
};

export const getBatchStatusText = (status: string): string => {
  const map: Record<string, string> = {
    normal: '正常',
    warning: '预警',
    recalled: '召回',
  };
  return map[status] || status;
};
