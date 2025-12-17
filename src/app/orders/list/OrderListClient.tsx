'use client';

import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

interface Order {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  deposit_amount: number;
  final_amount: number;
  status: string;
  payment_status: string;
  shipping_status?: string;
  created_at: string;
  gb_products: {
    id: string;
    name: string;
    name_lo?: string;
    images: string[];
  };
  gb_group_buys: {
    id: string;
    status: string;
    current_people: number;
    target_people: number;
    expires_at: string;
  };
  gb_group_members: {
    id: string;
    name: string;
    address: string;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending_deposit':
      return 'bg-yellow-100 text-yellow-800';
    case 'deposit_paid':
      return 'bg-blue-100 text-blue-800';
    case 'pending_final':
      return 'bg-orange-100 text-orange-800';
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'shipped':
      return 'bg-purple-100 text-purple-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
    case 'refunded':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: string, paymentStatus: string) => {
  if (paymentStatus === 'pending_verify') {
    return { lo: 'ກຳລັງກວດສອບ', zh: '审核中' };
  }
  if (paymentStatus === 'rejected') {
    return { lo: 'ຖືກປະຕິເສດ', zh: '已拒绝' };
  }

  switch (status) {
    case 'pending_deposit':
      return { lo: 'ລໍຖ້າຈ່າຍມັດຈຳ', zh: '待付定金' };
    case 'deposit_paid':
      return { lo: 'ຈ່າຍມັດຈຳແລ້ວ', zh: '已付定金' };
    case 'pending_final':
      return { lo: 'ລໍຖ້າຈ່າຍທ້າຍ', zh: '待付尾款' };
    case 'paid':
      return { lo: 'ຈ່າຍຄົບແລ້ວ', zh: '已付款' };
    case 'shipped':
      return { lo: 'ກຳລັງຈັດສົ່ງ', zh: '配送中' };
    case 'delivered':
      return { lo: 'ສົ່ງສຳເລັດ', zh: '已送达' };
    case 'cancelled':
      return { lo: 'ຍົກເລີກແລ້ວ', zh: '已取消' };
    case 'refunded':
      return { lo: 'ຄືນເງິນແລ້ວ', zh: '已退款' };
    default:
      return { lo: status, zh: status };
  }
};

const getGroupStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return { lo: 'ກຳລັງຈັບກຸ່ມ', zh: '拼团中' };
    case 'success':
      return { lo: 'ສຳເລັດແລ້ວ', zh: '已成团' };
    case 'failed':
      return { lo: 'ລົ້ມເຫລວ', zh: '已失败' };
    case 'expired':
      return { lo: 'ໝົດເວລາ', zh: '已过期' };
    default:
      return { lo: status, zh: status };
  }
};

export default function OrderListClient({
  phone,
  orders,
}: {
  phone: string;
  orders: Order[];
}) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <a href="/orders/check" className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <div>
              <h1 className="text-lg font-bold text-gray-800">
                ອໍເດີຂອງຂ້ອຍ (我的订单)
              </h1>
              <p className="text-sm text-gray-500">{phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = getStatusText(order.status, order.payment_status);
            const groupStatus = getGroupStatusText(order.gb_group_buys.status);
            const product = order.gb_products;

            return (
              <Link
                key={order.id}
                href={`/order/${order.id}`}
                className="card p-4 hover:shadow-md transition-shadow block"
              >
                {/* 订单头部 */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                  <div className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                    {statusInfo.lo} {statusInfo.zh}
                  </div>
                </div>

                {/* 商品信息 */}
                <div className="flex gap-3 mb-3">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 mb-1">{product.name}</h3>
                    {product.name_lo && (
                      <p className="text-sm text-gray-500 mb-2">{product.name_lo}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        order.gb_group_buys.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {groupStatus.lo}
                      </span>
                      <span className="text-xs text-gray-500">
                        👥 {order.gb_group_buys.current_people}/{order.gb_group_buys.target_people}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 价格信息 */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">ລາຄາລວມ (订单总额)</span>
                    <span className="font-medium">{formatPrice(order.total_price)}</span>
                  </div>
                  {order.status === 'pending_deposit' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">ມັດຈຳທີ່ຕ້ອງຈ່າຍ (需付定金)</span>
                      <span className="font-bold text-primary-500">{formatPrice(order.deposit_amount)}</span>
                    </div>
                  )}
                  {order.status === 'deposit_paid' && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>✓ ຈ່າຍມັດຈຳແລ້ວ (已付定金)</span>
                      <span>{formatPrice(order.deposit_amount)}</span>
                    </div>
                  )}
                  {(order.status === 'pending_final' || order.status === 'paid') && (
                    <>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>✓ ມັດຈຳ (定金)</span>
                        <span>{formatPrice(order.deposit_amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className={order.status === 'paid' ? 'text-green-600' : 'text-gray-600'}>
                          {order.status === 'paid' ? '✓ ' : ''}ທ້າຍ (尾款)
                        </span>
                        <span className={order.status === 'paid' ? 'text-green-600 font-medium' : 'font-bold text-primary-500'}>
                          {formatPrice(order.final_amount)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* 查看详情提示 */}
                <div className="mt-3 text-xs text-gray-400 text-right">
                  ເບິ່ງລາຍລະອຽດ (查看详情) →
                </div>
              </Link>
            );
          })}
        </div>

        {/* 统计信息 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          ທັງຫມົດ {orders.length} ອໍເດີ (共 {orders.length} 个订单)
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <a href="/" className="flex-1 text-center py-3 px-4 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors">
            🏠 ໜ້າຫຼັກ (首页)
          </a>
          <a href="/orders/check" className="flex-1 text-center py-3 px-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
            🔍 ຊອກອີກ (再次查询)
          </a>
        </div>
      </div>
    </div>
  );
}
