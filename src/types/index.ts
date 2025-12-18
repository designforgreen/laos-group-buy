// 商品类型
export interface Product {
  id: string;
  name: string;
  name_lo?: string; // 老挝语名称
  description: string;
  description_lo?: string;
  images: string[];
  original_price: number; // 原价（单位：LAK）
  tiers: PriceTier[]; // 阶梯价格
  stock: number;
  category: string;
  status: 'active' | 'inactive';
  created_at: string;
}

// 阶梯价格
export interface PriceTier {
  min_people: number; // 最少人数
  price: number; // 该档位价格
}

// 拼团
export interface GroupBuy {
  id: string;
  product_id: string;
  product?: Product;
  current_people: number;
  target_people: number;
  current_tier: number; // 当前达到的价格档位
  status: 'pending' | 'success' | 'failed' | 'expired';
  expires_at: string;
  is_official?: boolean; // 是否官方团
  created_at: string;
}

// 拼团参与者
export interface GroupMember {
  id: string;
  group_id: string;
  phone: string;
  name: string;
  address: string;
  deposit_paid: boolean;
  deposit_amount: number;
  final_paid: boolean;
  final_amount: number;
  payment_method: 'bcel' | 'transfer' | 'cod';
  payment_reference?: string;
  status: 'joined' | 'paid_deposit' | 'paid_full' | 'refunded' | 'cancelled';
  created_at: string;
}

// 订单
export interface Order {
  id: string;
  group_id: string;
  member_id: string;
  product_id: string;
  product?: Product;
  group?: GroupBuy;
  member?: GroupMember;
  quantity: number;
  unit_price: number;
  total_price: number;
  deposit_amount: number;
  final_amount: number;
  status: 'pending_deposit' | 'deposit_paid' | 'pending_final' | 'paid' | 'shipped' | 'delivered' | 'refunded' | 'cancelled';
  shipping_status?: 'pending' | 'shipped' | 'in_transit' | 'delivered';
  tracking_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// BCEL支付请求
export interface BCELPaymentRequest {
  order_id: string;
  amount: number;
  description: string;
  return_url: string;
  callback_url: string;
}

// BCEL支付响应
export interface BCELPaymentResponse {
  success: boolean;
  payment_url?: string;
  transaction_id?: string;
  error?: string;
}
