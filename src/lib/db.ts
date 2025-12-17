import { supabase } from './supabase';
import { Product, GroupBuy, GroupMember, Order } from '@/types';

// ==================== 商品操作 ====================

// 获取所有商品
export async function getProducts(status: 'active' | 'inactive' | 'all' = 'active') {
  let query = supabase
    .from('gb_products')
    .select('*')
    .order('created_at', { ascending: false });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data as Product[];
}

// 获取单个商品
export async function getProduct(id: string) {
  const { data, error } = await supabase
    .from('gb_products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }

  return data as Product;
}

// 创建商品
export async function createProduct(product: Omit<Product, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('gb_products')
    .insert([{
      ...product,
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    return null;
  }

  return data as Product;
}

// 更新商品
export async function updateProduct(id: string, updates: Partial<Product>) {
  const { data, error } = await supabase
    .from('gb_products')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    return null;
  }

  return data as Product;
}

// 删除商品（软删除，设置为inactive）
export async function deleteProduct(id: string) {
  return updateProduct(id, { status: 'inactive' });
}

// ==================== 拼团操作 ====================

// 获取进行中的拼团（带商品信息）
export async function getActiveGroupBuys() {
  const { data, error } = await supabase
    .from('gb_group_buys')
    .select(`
      *,
      product:gb_products(*)
    `)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching group buys:', error);
    return [];
  }

  return data as (GroupBuy & { product: Product })[];
}

// 获取单个拼团
export async function getGroupBuy(id: string) {
  const { data, error } = await supabase
    .from('gb_group_buys')
    .select(`
      *,
      product:gb_products(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching group buy:', error);
    return null;
  }

  return data as (GroupBuy & { product: Product });
}

// 创建拼团
export async function createGroupBuy(productId: string, targetPeople: number, expiresInHours: number = 48) {
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('gb_group_buys')
    .insert([{
      product_id: productId,
      target_people: targetPeople,
      current_people: 0,
      current_tier: 0,
      status: 'pending',
      expires_at: expiresAt,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating group buy:', error);
    return null;
  }

  return data as GroupBuy;
}

// 获取商品的推荐拼团（优先级：官方团 > 快满的团 > 最新的团）
export async function getRecommendedGroupBuy(productId: string) {
  const { data, error } = await supabase
    .from('gb_group_buys')
    .select('*')
    .eq('product_id', productId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('is_official', { ascending: false })
    .order('current_people', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  // 过滤掉已经满员的团（虽然理论上不应该存在状态为pending但已满的团）
  const availableGroup = data[0];
  if (availableGroup && availableGroup.current_people < availableGroup.target_people) {
    return availableGroup as GroupBuy;
  }

  return null;
}

// 获取商品的所有进行中拼团
export async function getProductGroupBuys(productId: string) {
  const { data, error } = await supabase
    .from('gb_group_buys')
    .select('*')
    .eq('product_id', productId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('is_official', { ascending: false })
    .order('current_people', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching product group buys:', error);
    return [];
  }

  return data as GroupBuy[];
}

// 智能获取或创建拼团
export async function getOrCreateGroupBuy(productId: string) {
  // 1. 先尝试获取推荐拼团
  const recommended = await getRecommendedGroupBuy(productId);

  if (recommended) {
    return recommended;
  }

  // 2. 没有合适的团，检查是否应该创建新团
  // 获取商品信息
  const product = await getProduct(productId);
  if (!product) return null;

  // 3. 创建新的用户自发团（默认最大档位）
  const maxTier = product.tiers[product.tiers.length - 1];
  if (!maxTier) return null;

  const newGroup = await createGroupBuy(productId, maxTier.min_people, 48);
  return newGroup;
}

// 更新拼团人数
export async function incrementGroupPeople(groupId: string) {
  // 先获取当前数据
  const { data: current } = await supabase
    .from('gb_group_buys')
    .select('current_people, target_people')
    .eq('id', groupId)
    .single();

  if (!current) return null;

  const newPeople = current.current_people + 1;
  const newStatus = newPeople >= current.target_people ? 'success' : 'pending';

  const { data, error } = await supabase
    .from('gb_group_buys')
    .update({
      current_people: newPeople,
      status: newStatus,
    })
    .eq('id', groupId)
    .select()
    .single();

  if (error) {
    console.error('Error updating group buy:', error);
    return null;
  }

  return data as GroupBuy;
}

// ==================== 成员操作 ====================

// 加入拼团
export async function joinGroup(groupId: string, member: {
  name: string;
  phone: string;
  address: string;
  deposit_amount: number;
}) {
  const { data, error } = await supabase
    .from('gb_group_members')
    .insert([{
      group_id: groupId,
      ...member,
      status: 'joined',
    }])
    .select()
    .single();

  if (error) {
    console.error('Error joining group:', error);
    return null;
  }

  return data as GroupMember;
}

// 更新成员支付状态
export async function updateMemberPayment(memberId: string, updates: {
  deposit_paid?: boolean;
  final_paid?: boolean;
  payment_reference?: string;
  status?: string;
}) {
  const { data, error } = await supabase
    .from('gb_group_members')
    .update(updates)
    .eq('id', memberId)
    .select()
    .single();

  if (error) {
    console.error('Error updating member:', error);
    return null;
  }

  return data as GroupMember;
}

// ==================== 订单操作 ====================

// 创建订单
export async function createOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('gb_orders')
    .insert([order])
    .select()
    .single();

  if (error) {
    console.error('Error creating order:', error);
    return null;
  }

  return data as Order;
}

// 获取用户订单（通过手机号）
export async function getOrdersByPhone(phone: string) {
  const { data, error } = await supabase
    .from('gb_orders')
    .select(`
      *,
      product:gb_products(*),
      group:gb_group_buys(*),
      member:gb_group_members(*)
    `)
    .eq('member.phone', phone)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

  return data as Order[];
}

// 获取所有订单（后台用）
export async function getAllOrders() {
  const { data, error } = await supabase
    .from('gb_orders')
    .select(`
      *,
      product:gb_products(*),
      group:gb_group_buys(*),
      member:gb_group_members(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

  return data as Order[];
}

// 更新订单状态
export async function updateOrderStatus(orderId: string, status: string, shippingStatus?: string, trackingNumber?: string) {
  const { data, error } = await supabase
    .from('gb_orders')
    .update({
      status,
      shipping_status: shippingStatus,
      tracking_number: trackingNumber,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating order:', error);
    return null;
  }

  return data as Order;
}

// ==================== 统计 ====================

// 获取后台统计数据
export async function getStats() {
  const [orders, pendingGroups, successGroups] = await Promise.all([
    supabase.from('gb_orders').select('total_price', { count: 'exact' }),
    supabase.from('gb_group_buys').select('*', { count: 'exact' }).eq('status', 'pending'),
    supabase.from('gb_group_buys').select('*', { count: 'exact' }).eq('status', 'success'),
  ]);

  const totalRevenue = orders.data?.reduce((sum, o) => sum + (parseFloat(o.total_price) || 0), 0) || 0;

  return {
    total_orders: orders.count || 0,
    pending_groups: pendingGroups.count || 0,
    success_groups: successGroups.count || 0,
    total_revenue: totalRevenue,
  };
}
