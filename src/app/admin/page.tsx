'use client';

import { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { checkAuth, signOut } from '@/lib/auth';
import { uploadImage, deleteImage } from '@/lib/upload';

interface Product {
  id: string;
  name: string;
  name_lo?: string;
  description?: string;
  description_lo?: string;
  images: string[];
  original_price: number;
  tiers: { min_people: number; price: number }[];
  stock: number;
  category?: string;
  status: string;
  created_at: string;
}

interface Order {
  id: string;
  member: { name: string; phone: string };
  product: { name: string };
  total_price: number;
  status: string;
  created_at: string;
}

interface GroupBuy {
  id: string;
  product: { name: string };
  current_people: number;
  target_people: number;
  status: string;
  expires_at: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending_deposit: { label: '待付定金', color: 'bg-yellow-100 text-yellow-800' },
  deposit_paid: { label: '待成团', color: 'bg-blue-100 text-blue-800' },
  pending_final: { label: '待补尾款', color: 'bg-orange-100 text-orange-800' },
  paid: { label: '已付款', color: 'bg-green-100 text-green-800' },
  shipped: { label: '已发货', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: '已收货', color: 'bg-gray-100 text-gray-800' },
};

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'orders' | 'groups' | 'products' | 'review'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [groups, setGroups] = useState<GroupBuy[]>([]);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [stats, setStats] = useState({ total_orders: 0, pending_groups: 0, success_groups: 0, total_revenue: 0, pending_reviews: 0 });
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showGroupBuyForm, setShowGroupBuyForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reviewingOrder, setReviewingOrder] = useState<any | null>(null);

  // 检查认证
  useEffect(() => {
    const checkAuthentication = async () => {
      const user = await checkAuth();
      if (!user) {
        router.push('/admin/login');
      } else {
        setIsAuthenticated(true);
      }
    };
    checkAuthentication();
  }, [router]);

  // 加载数据
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 加载商品
      const { data: productsData } = await supabase
        .from('gb_products')
        .select('*')
        .order('created_at', { ascending: false });
      setProducts(productsData || []);

      // 加载订单
      const { data: ordersData } = await supabase
        .from('gb_orders')
        .select(`
          *,
          product:gb_products(name),
          member:gb_group_members(name, phone)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      setOrders(ordersData || []);

      // 加载拼团
      const { data: groupsData } = await supabase
        .from('gb_group_buys')
        .select(`
          *,
          product:gb_products(name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      setGroups(groupsData || []);

      // 加载待审核订单
      const { data: reviewsData } = await supabase
        .from('gb_orders')
        .select(`
          *,
          product:gb_products(name, name_lo, images),
          member:gb_group_members(name, phone, address),
          group:gb_group_buys(*)
        `)
        .eq('payment_status', 'pending_verify')
        .order('created_at', { ascending: false });
      setPendingReviews(reviewsData || []);

      // 统计
      const { count: orderCount } = await supabase.from('gb_orders').select('*', { count: 'exact', head: true });
      const { count: pendingCount } = await supabase.from('gb_group_buys').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: successCount } = await supabase.from('gb_group_buys').select('*', { count: 'exact', head: true }).eq('status', 'success');
      const { count: reviewCount } = await supabase.from('gb_orders').select('*', { count: 'exact', head: true }).eq('payment_status', 'pending_verify');

      setStats({
        total_orders: orderCount || 0,
        pending_groups: pendingCount || 0,
        success_groups: successCount || 0,
        total_revenue: 0,
        pending_reviews: reviewCount || 0,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  // 退出登录
  const handleLogout = async () => {
    await signOut();
    router.push('/admin/login');
  };

  // 删除商品
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('确定要删除这个商品吗？')) return;

    const { error } = await supabase
      .from('gb_products')
      .update({ status: 'inactive' })
      .eq('id', id);

    if (!error) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  // 编辑商品
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  // 发起拼团
  const handleCreateGroupBuy = (product: Product) => {
    setSelectedProduct(product);
    setShowGroupBuyForm(true);
  };

  // 审核订单 - 通过
  const handleApprovePayment = async (order: any) => {
    if (!confirm('确认通过此支付？')) return;

    try {
      // 1. 更新订单状态
      const { error: orderError } = await supabase
        .from('gb_orders')
        .update({
          payment_status: 'verified',
          status: 'deposit_paid',
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      // 2. 更新支付凭证状态
      const { error: proofError } = await supabase
        .from('gb_payment_proofs')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
        })
        .eq('order_id', order.id);

      // 3. 更新拼团人数
      const { data: groupData } = await supabase
        .from('gb_group_buys')
        .select('current_people, target_people')
        .eq('id', order.group_id)
        .single();

      if (groupData) {
        const newPeople = groupData.current_people + 1;
        const newStatus = newPeople >= groupData.target_people ? 'success' : 'pending';

        await supabase
          .from('gb_group_buys')
          .update({
            current_people: newPeople,
            status: newStatus,
          })
          .eq('id', order.group_id);
      }

      alert('审核通过！');
      loadData(); // 重新加载数据
    } catch (error) {
      console.error('Approve error:', error);
      alert('操作失败');
    }
  };

  // 审核订单 - 拒绝
  const handleRejectPayment = async (order: any) => {
    const reason = prompt('请输入拒绝原因：');
    if (!reason) return;

    try {
      // 1. 更新订单状态
      const { error: orderError } = await supabase
        .from('gb_orders')
        .update({
          payment_status: 'rejected',
          notes: reason,
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      // 2. 更新支付凭证状态
      await supabase
        .from('gb_payment_proofs')
        .update({
          status: 'rejected',
          admin_note: reason,
          verified_at: new Date().toISOString(),
        })
        .eq('order_id', order.id);

      alert('已拒绝');
      loadData();
    } catch (error) {
      console.error('Reject error:', error);
      alert('操作失败');
    }
  };

  // 如果未认证，显示加载中
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin w-8 h-8 mx-auto mb-4 text-primary-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-500">ກຳລັງກວດສອບ... (验证中...)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">🔧 管理后台</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>ອອກຈາກລະບົບ (退出)</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">总订单</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total_orders}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">进行中拼团</p>
            <p className="text-2xl font-bold text-blue-600">{stats.pending_groups}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">成功拼团</p>
            <p className="text-2xl font-bold text-green-600">{stats.success_groups}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">商品数</p>
            <p className="text-xl font-bold text-primary-500">{products.length}</p>
          </div>
        </div>

        {/* 标签页 */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('review')}
              className={`flex-1 px-4 py-3 text-sm font-medium relative ${
                activeTab === 'review'
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-gray-500'
              }`}
            >
              ✅ 待审核
              {stats.pending_reviews > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {stats.pending_reviews}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === 'products'
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-gray-500'
              }`}
            >
              🛍️ 商品管理
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === 'orders'
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-gray-500'
              }`}
            >
              📋 订单管理
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === 'groups'
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-gray-500'
              }`}
            >
              👥 拼团管理
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">
              加载中...
            </div>
          ) : (
            <>
              {/* 待审核订单 */}
              {activeTab === 'review' && (
                <div className="p-4">
                  {pendingReviews.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-lg">暂无待审核订单</p>
                      <p className="text-sm mt-1">所有支付凭证已审核完成</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingReviews.map((order) => (
                        <div key={order.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                          {/* 订单头部 */}
                          <div className="bg-yellow-50 px-4 py-3 border-b flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-gray-700">订单号：{order.id.slice(0, 8)}</span>
                              <span className="ml-3 text-xs text-gray-500">
                                {new Date(order.created_at).toLocaleString('zh-CN')}
                              </span>
                            </div>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                              待审核
                            </span>
                          </div>

                          <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* 左侧：订单信息 */}
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">商品</p>
                                  <p className="font-medium text-gray-800">{order.product.name}</p>
                                  {order.product.name_lo && (
                                    <p className="text-sm text-gray-500">{order.product.name_lo}</p>
                                  )}
                                </div>

                                <div>
                                  <p className="text-xs text-gray-500 mb-1">购买人</p>
                                  <p className="text-sm text-gray-800">{order.member.name}</p>
                                  <p className="text-sm text-gray-500">{order.member.phone}</p>
                                </div>

                                <div>
                                  <p className="text-xs text-gray-500 mb-1">收货地址</p>
                                  <p className="text-sm text-gray-600">{order.member.address}</p>
                                </div>

                                <div>
                                  <p className="text-xs text-gray-500 mb-1">定金金额</p>
                                  <p className="text-lg font-bold text-primary-500">
                                    {formatPrice(order.deposit_amount)}
                                  </p>
                                </div>
                              </div>

                              {/* 右侧：支付截图 */}
                              <div>
                                <p className="text-xs text-gray-500 mb-2">支付凭证</p>
                                {order.payment_proof_url ? (
                                  <div className="relative group">
                                    <img
                                      src={order.payment_proof_url}
                                      alt="Payment proof"
                                      className="w-full rounded-lg border-2 border-gray-200 cursor-pointer hover:border-primary-400 transition-colors"
                                      onClick={() => window.open(order.payment_proof_url, '_blank')}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                                      <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                      </svg>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400">
                                    无截图
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 操作按钮 */}
                            <div className="mt-4 pt-4 border-t flex gap-3">
                              <button
                                onClick={() => handleApprovePayment(order)}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                通过审核
                              </button>
                              <button
                                onClick={() => handleRejectPayment(order)}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                拒绝
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 商品管理 */}
              {activeTab === 'products' && (
                <div className="p-4">
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setShowProductForm(true);
                    }}
                    className="btn-primary mb-4 text-sm"
                  >
                    + 添加商品
                  </button>

                  {products.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      暂无商品，点击上方按钮添加
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {products.filter(p => p.status === 'active').map((product) => (
                        <div key={product.id} className="border rounded-lg p-4 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                              {product.images?.[0] ? (
                                <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-2xl">📦</span>
                              )}
                            </div>
                            <div>
                              <h3 className="font-medium">{product.name}</h3>
                              <p className="text-sm text-gray-500">
                                原价: {formatPrice(product.original_price)} | 库存: {product.stock}
                              </p>
                              <p className="text-xs text-gray-400">
                                阶梯: {product.tiers?.map(t => `${t.min_people}人${formatPrice(t.price)}`).join(' / ')}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCreateGroupBuy(product)}
                              className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded"
                            >
                              发起拼团
                            </button>
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 订单管理 */}
              {activeTab === 'orders' && (
                <div className="divide-y">
                  {orders.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      暂无订单
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{order.member?.name || '未知'}</span>
                              <span className={`px-2 py-0.5 rounded text-xs ${statusMap[order.status]?.color || 'bg-gray-100'}`}>
                                {statusMap[order.status]?.label || order.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{order.member?.phone}</p>
                            <p className="text-sm text-gray-600 mt-1">{order.product?.name}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(order.created_at).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary-500">{formatPrice(order.total_price)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 拼团管理 */}
              {activeTab === 'groups' && (
                <div className="p-4">
                  {groups.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      暂无进行中的拼团
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {groups.map((group) => (
                        <div key={group.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{group.product?.name}</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                已参团: {group.current_people}/{group.target_people}人
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                截止: {new Date(group.expires_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button className="text-xs bg-green-500 text-white px-3 py-1 rounded">
                                手动成团
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 商品表单弹窗 */}
      {showProductForm && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
          onSave={() => {
            setShowProductForm(false);
            setEditingProduct(null);
            loadData();
          }}
        />
      )}

      {/* 创建拼团弹窗 */}
      {showGroupBuyForm && selectedProduct && (
        <GroupBuyFormModal
          product={selectedProduct}
          onClose={() => {
            setShowGroupBuyForm(false);
            setSelectedProduct(null);
          }}
          onSave={() => {
            setShowGroupBuyForm(false);
            setSelectedProduct(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// 商品表单组件
function ProductFormModal({
  product,
  onClose,
  onSave,
}: {
  product: Product | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    name_lo: product?.name_lo || '',
    description: product?.description || '',
    description_lo: product?.description_lo || '',
    original_price: product?.original_price || 0,
    stock: product?.stock || 100,
    category: product?.category || '3C数码',
    tier1_people: product?.tiers?.[0]?.min_people || 1,
    tier1_price: product?.tiers?.[0]?.price || 0,
    tier2_people: product?.tiers?.[1]?.min_people || 3,
    tier2_price: product?.tiers?.[1]?.price || 0,
    tier3_people: product?.tiers?.[2]?.min_people || 5,
    tier3_price: product?.tiers?.[2]?.price || 0,
  });
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  // 处理图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadImage(file, 'payment-proofs', 'products');
        uploadedUrls.push(url);
      }

      setImages([...images, ...uploadedUrls]);
    } catch (error: any) {
      alert(error.message || '上传失败');
    } finally {
      setUploadingImage(false);
      // 重置input
      e.target.value = '';
    }
  };

  // 删除图片
  const handleRemoveImage = async (index: number) => {
    const imageUrl = images[index];

    // 从状态中删除
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);

    // 从Storage中删除（不阻塞UI）
    deleteImage(imageUrl, 'payment-proofs');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const tiers = [
      { min_people: formData.tier1_people, price: formData.tier1_price },
      { min_people: formData.tier2_people, price: formData.tier2_price },
      { min_people: formData.tier3_people, price: formData.tier3_price },
    ].filter(t => t.price > 0);

    const productData = {
      name: formData.name,
      name_lo: formData.name_lo || null,
      description: formData.description || null,
      description_lo: formData.description_lo || null,
      images,
      original_price: formData.original_price,
      stock: formData.stock,
      category: formData.category,
      tiers,
      status: 'active',
      updated_at: new Date().toISOString(),
    };

    try {
      if (product) {
        // 更新
        await supabase
          .from('gb_products')
          .update(productData)
          .eq('id', product.id);
      } else {
        // 新建
        await supabase
          .from('gb_products')
          .insert([productData]);
      }
      onSave();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('保存失败');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">{product ? '编辑商品' : '添加商品'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 商品名称 */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">商品名称 (中文) *</label>
            <input
              type="text"
              required
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="TWS蓝牙耳机"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">商品名称 (老挝语)</label>
            <input
              type="text"
              className="input"
              value={formData.name_lo}
              onChange={(e) => setFormData({ ...formData, name_lo: e.target.value })}
              placeholder="ຫູຟັງບລູທູດ"
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">商品描述 (中文)</label>
            <textarea
              className="input"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="蓝牙5.3，续航6小时"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">商品描述 (老挝语)</label>
            <textarea
              className="input"
              rows={2}
              value={formData.description_lo}
              onChange={(e) => setFormData({ ...formData, description_lo: e.target.value })}
              placeholder="ບລູທູດ 5.3, ໃຊ້ໄດ້ 6 ຊົ່ວໂມງ"
            />
          </div>

          {/* 商品图片 */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">商品图片</label>

            {/* 已上传的图片 */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {images.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 上传按钮 */}
            <label className={`flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <div className="flex flex-col items-center justify-center">
                {uploadingImage ? (
                  <>
                    <svg className="animate-spin w-8 h-8 text-primary-500 mb-1" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-xs text-gray-500">上传中...</p>
                  </>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <p className="text-xs text-gray-500">点击上传图片</p>
                    <p className="text-xs text-gray-400 mt-1">支持 JPG, PNG (最大5MB)</p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                multiple
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
            </label>
          </div>

          {/* 价格和库存 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">原价 (LAK) *</label>
              <input
                type="number"
                required
                className="input"
                value={formData.original_price}
                onChange={(e) => setFormData({ ...formData, original_price: Number(e.target.value) })}
                placeholder="180000"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">库存 *</label>
              <input
                type="number"
                required
                className="input"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* 分类 */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">分类</label>
            <select
              className="input"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="3C数码">3C数码</option>
              <option value="美妆工具">美妆工具</option>
              <option value="生活电器">生活电器</option>
              <option value="日用百货">日用百货</option>
            </select>
          </div>

          {/* 阶梯价格 */}
          <div className="border-t pt-4">
            <label className="block text-sm text-gray-600 mb-2">阶梯价格</label>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="input w-20"
                  value={formData.tier1_people}
                  onChange={(e) => setFormData({ ...formData, tier1_people: Number(e.target.value) })}
                />
                <span className="text-gray-500">人</span>
                <input
                  type="number"
                  className="input flex-1"
                  value={formData.tier1_price}
                  onChange={(e) => setFormData({ ...formData, tier1_price: Number(e.target.value) })}
                  placeholder="价格"
                />
                <span className="text-gray-500">₭</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="input w-20"
                  value={formData.tier2_people}
                  onChange={(e) => setFormData({ ...formData, tier2_people: Number(e.target.value) })}
                />
                <span className="text-gray-500">人</span>
                <input
                  type="number"
                  className="input flex-1"
                  value={formData.tier2_price}
                  onChange={(e) => setFormData({ ...formData, tier2_price: Number(e.target.value) })}
                  placeholder="价格"
                />
                <span className="text-gray-500">₭</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="input w-20"
                  value={formData.tier3_people}
                  onChange={(e) => setFormData({ ...formData, tier3_people: Number(e.target.value) })}
                />
                <span className="text-gray-500">人</span>
                <input
                  type="number"
                  className="input flex-1"
                  value={formData.tier3_price}
                  onChange={(e) => setFormData({ ...formData, tier3_price: Number(e.target.value) })}
                  placeholder="价格"
                />
                <span className="text-gray-500">₭</span>
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 创建拼团表单组件
function GroupBuyFormModal({
  product,
  onClose,
  onSave,
}: {
  product: Product;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    target_people: product.tiers[product.tiers.length - 1]?.min_people || 5,
    expires_hours: 48,
    is_official: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const expiresAt = new Date(Date.now() + formData.expires_hours * 60 * 60 * 1000).toISOString();

      await supabase
        .from('gb_group_buys')
        .insert([{
          product_id: product.id,
          target_people: formData.target_people,
          current_people: 0,
          current_tier: 0,
          status: 'pending',
          expires_at: expiresAt,
          is_official: formData.is_official,
        }]);

      onSave();
    } catch (error) {
      console.error('Error creating group buy:', error);
      alert('创建失败');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between rounded-t-xl">
          <h2 className="text-lg font-bold">发起拼团</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 商品信息 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">📦</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-xs text-gray-500">
                  阶梯: {product.tiers?.map(t => `${t.min_people}人${formatPrice(t.price)}`).join(' / ')}
                </p>
              </div>
            </div>
          </div>

          {/* 目标人数 */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">目标人数 *</label>
            <select
              className="input"
              value={formData.target_people}
              onChange={(e) => setFormData({ ...formData, target_people: Number(e.target.value) })}
            >
              {product.tiers.map(tier => (
                <option key={tier.min_people} value={tier.min_people}>
                  {tier.min_people}人团 - {formatPrice(tier.price)}
                </option>
              ))}
            </select>
          </div>

          {/* 有效期 */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">有效期（小时）*</label>
            <select
              className="input"
              value={formData.expires_hours}
              onChange={(e) => setFormData({ ...formData, expires_hours: Number(e.target.value) })}
            >
              <option value={24}>24小时</option>
              <option value={48}>48小时</option>
              <option value={72}>72小时</option>
              <option value={168}>7天</option>
            </select>
          </div>

          {/* 是否官方团 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_official"
              checked={formData.is_official}
              onChange={(e) => setFormData({ ...formData, is_official: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="is_official" className="text-sm text-gray-600">
              标记为官方拼团（优先展示）
            </label>
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1"
            >
              {saving ? '创建中...' : '立即发起'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
