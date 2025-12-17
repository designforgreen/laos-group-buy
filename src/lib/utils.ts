// 格式化价格（老挝基普）- 使用固定格式避免 hydration 错误
export function formatPrice(price: number): string {
  // 手动格式化，避免 Intl.NumberFormat 在服务端/客户端不一致
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₭';
}

// 格式化价格（不带货币符号）
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 计算定金
export function calculateDeposit(price: number, percentage: number = 30): number {
  return Math.ceil(price * percentage / 100);
}

// 计算折扣百分比
export function calculateDiscount(originalPrice: number, currentPrice: number): number {
  return Math.round((1 - currentPrice / originalPrice) * 100);
}
