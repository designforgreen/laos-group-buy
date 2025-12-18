'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

// 模拟订单数据
const mockOrders = [
  {
    id: 'o1',
    product_name: 'TWS蓝牙耳机 无线降噪',
    product_image: '',
    status: 'pending_final',
    deposit_paid: true,
    deposit_amount: 45000,
    final_amount: 105000,
    total_price: 150000,
    group_status: 'success',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 'o2',
    product_name: '20000mAh快充充电宝',
    product_image: '',
    status: 'deposit_paid',
    deposit_paid: true,
    deposit_amount: 72000,
    final_amount: 168000,
    total_price: 240000,
    group_status: 'pending',
    group_people: '3/5',
    expires_at: '2024-01-16T18:00:00Z',
    created_at: '2024-01-14T14:20:00Z',
  },
];

const statusMap: Record<string, { label: string; color: string }> = {
  pending_deposit: { label: 'ລໍຖ້າມັດຈຳ (待付定金)', color: 'bg-yellow-100 text-yellow-800' },
  deposit_paid: { label: 'ລໍຖ້າຈັບກຸ່ມ (待成团)', color: 'bg-blue-100 text-blue-800' },
  pending_final: { label: 'ລໍຖ້າຈ່າຍສ່ວນທີ່ເຫຼືອ (待补尾款)', color: 'bg-orange-100 text-orange-800' },
  paid: { label: 'ຈ່າຍແລ້ວ (已付款)', color: 'bg-green-100 text-green-800' },
  shipped: { label: 'ສົ່ງແລ້ວ (已发货)', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'ຮັບແລ້ວ (已收货)', color: 'bg-gray-100 text-gray-800' },
  refunded: { label: 'ຄືນເງິນແລ້ວ (已退款)', color: 'bg-red-100 text-red-800' },
};

export default function OrdersPage() {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<typeof mockOrders>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 实际查询逻辑
    setOrders(mockOrders);
    setSearched(true);
  };

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">
        📋 ຄົ້ນຫາຄຳສັ່ງຊື້ (查询订单)
      </h1>

      {/* 搜索表单 */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="tel"
            className="input flex-1"
            placeholder="ປ້ອນເບີໂທຂອງທ່ານ (输入手机号)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button type="submit" className="btn-primary px-6">
            ຄົ້ນຫາ
          </button>
        </div>
      </form>

      {/* 订单列表 */}
      {searched && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>ບໍ່ພົບຄຳສັ່ງຊື້ (未找到订单)</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="card p-4">
                <div className="flex gap-3">
                  {/* 商品图片 */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                    {order.product_image ? (
                      <img src={order.product_image} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-3xl">📦</span>
                    )}
                  </div>

                  {/* 订单信息 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">{order.product_name}</h3>
                    <div className={`inline-block px-2 py-0.5 rounded text-xs mt-1 ${statusMap[order.status]?.color}`}>
                      {statusMap[order.status]?.label}
                    </div>

                    {/* 拼团状态 */}
                    {order.group_status === 'pending' && (
                      <div className="text-xs text-gray-500 mt-1">
                        拼团中: {order.group_people}
                      </div>
                    )}

                    {/* 价格信息 */}
                    <div className="mt-2 text-sm">
                      {order.status === 'pending_final' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">待补尾款:</span>
                          <span className="text-primary-500 font-bold">{formatPrice(order.final_amount)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">已付定金:</span>
                          <span className="text-green-600">{formatPrice(order.deposit_amount)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                {order.status === 'pending_final' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button className="btn-primary w-full text-sm">
                      💰 ຈ່າຍສ່ວນທີ່ເຫຼືອ {formatPrice(order.final_amount)}
                    </button>
                  </div>
                )}

                {order.status === 'shipped' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                    物流单号: XXXX1234567890
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 帮助信息 */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-700 mb-2">❓ ຕ້ອງການຄວາມຊ່ວຍເຫຼືອ?</h3>
        <p className="text-sm text-gray-500 mb-3">
          如有问题请联系客服
        </p>
        <a
          href="https://wa.me/8562096060666"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary w-full text-sm flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp ຕິດຕໍ່
        </a>
      </div>
    </div>
  );
}
