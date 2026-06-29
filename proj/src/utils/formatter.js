/**
 * 价格格式化
 * @param {number} price - 总价（万元）或单价（元/㎡）
 * @param {'total'|'unit'} type - 价格类型
 */
export function formatPrice(price, type = 'total') {
  if (price == null || isNaN(price)) return '暂无数据';
  if (type === 'unit') {
    return `${(price / 10000).toFixed(2)}万/㎡`;
  }
  return `${price}万`;
}

export function formatNumber(num) {
  if (num == null || isNaN(num)) return '—';
  return num.toLocaleString();
}

export function formatDistance(meters) {
  if (meters == null) return '暂无数据';
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '未知';
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}