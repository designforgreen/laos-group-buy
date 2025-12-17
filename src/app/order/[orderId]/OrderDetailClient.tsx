'use client';

import { useState } from 'react';
import Link from 'next/link';
import CountdownTimer from '@/components/CountdownTimer';
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
  payment_proof_url?: string;
  shipping_status?: string;
  tracking_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  gb_products: {
    id: string;
    name: string;
    name_lo?: string;
    description?: string;
    description_lo?: string;
    images: string[];
    original_price: number;
    tiers: { min_people: number; price: number }[];
  };
  gb_group_buys: {
    id: string;
    status: string;
    current_people: number;
    target_people: number;
    expires_at: string;
    is_official?: boolean;
  };
  gb_group_members: {
    id: string;
    name: string;
    phone: string;
    address: string;
  };
}

interface PaymentProof {
  id: string;
  payment_method: string;
  proof_image_url: string;
  amount: number;
  status: string;
  admin_note?: string;
  verified_at?: string;
  created_at: string;
}

const getStatusInfo = (status: string, paymentStatus: string) => {
  if (paymentStatus === 'pending_verify') {
    return {
      lo: 'ກຳລັງກວດສອບ',
      zh: '审核中',
      color: 'bg-yellow-100 text-yellow-800',
      icon: '⏳',
    };
  }
  if (paymentStatus === 'rejected') {
    return {
      lo: 'ຖືກປະຕິເສດ',
      zh: '已拒绝',
      color: 'bg-red-100 text-red-800',
      icon: '❌',
    };
  }

  switch (status) {
    case 'pending_deposit':
      return { lo: 'ລໍຖ້າຈ່າຍມັດຈຳ', zh: '待付定金', color: 'bg-yellow-100 text-yellow-800', icon: '💰' };
    case 'deposit_paid':
      return { lo: 'ຈ່າຍມັດຈຳແລ້ວ', zh: '已付定金', color: 'bg-blue-100 text-blue-800', icon: '✓' };
    case 'pending_final':
      return { lo: 'ລໍຖ້າຈ່າຍທ້າຍ', zh: '待付尾款', color: 'bg-orange-100 text-orange-800', icon: '💵' };
    case 'paid':
      return { lo: 'ຈ່າຍຄົບແລ້ວ', zh: '已付款', color: 'bg-green-100 text-green-800', icon: '✓' };
    case 'shipped':
      return { lo: 'ກຳລັງຈັດສົ່ງ', zh: '配送中', color: 'bg-purple-100 text-purple-800', icon: '🚚' };
    case 'delivered':
      return { lo: 'ສົ່ງສຳເລັດ', zh: '已送达', color: 'bg-green-100 text-green-800', icon: '✓' };
    case 'cancelled':
      return { lo: 'ຍົກເລີກແລ້ວ', zh: '已取消', color: 'bg-gray-100 text-gray-800', icon: '✗' };
    case 'refunded':
      return { lo: 'ຄືນເງິນແລ້ວ', zh: '已退款', color: 'bg-gray-100 text-gray-800', icon: '↩' };
    default:
      return { lo: status, zh: status, color: 'bg-gray-100 text-gray-800', icon: '•' };
  }
};

export default function OrderDetailClient({
  order,
  paymentProofs,
}: {
  order: Order;
  paymentProofs: PaymentProof[];
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showProofImage, setShowProofImage] = useState<string | null>(null);

  const statusInfo = getStatusInfo(order.status, order.payment_status);
  const product = order.gb_products;
  const group = order.gb_group_buys;
  const member = order.gb_group_members;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('ຄັດລອກແລ້ວ (已复制)');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-800">
                ລາຍລະອຽດອໍເດີ (订单详情)
              </h1>
              <p className="text-xs text-gray-500 font-mono">{order.id.slice(0, 8)}</p>
            </div>
            <button
              onClick={() => copyToClipboard(order.id)}
              className="text-sm text-primary-500 hover:text-primary-600"
            >
              ຄັດລອກ (复制)
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* 状态卡片 */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${statusInfo.color} text-lg font-medium`}>
                <span>{statusInfo.icon}</span>
                <span>{statusInfo.lo}</span>
                <span>{statusInfo.zh}</span>
              </div>
            </div>
          </div>

          {/* 时间信息 */}
          <div className="text-sm text-gray-500 space-y-1">
            <p>ສ້າງເມື່ອ (创建时间): {new Date(order.created_at).toLocaleString('zh-CN')}</p>
            {order.updated_at !== order.created_at && (
              <p>ອັບເດດເມື່ອ (更新时间): {new Date(order.updated_at).toLocaleString('zh-CN')}</p>
            )}
          </div>

          {/* 拼团状态 */}
          {group.status === 'pending' && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">ສະຖານະການຈັບກຸ່ມ (拼团状态)</span>
                <Link
                  href={`/group/${group.id}?product=${product.id}`}
                  className="text-sm text-primary-500 hover:text-primary-600"
                >
                  ເບິ່ງກຸ່ມ (查看拼团) →
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${(group.current_people / group.target_people) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    👥 {group.current_people}/{group.target_people} ຄົນ
                  </p>
                </div>
                <CountdownTimer expiresAt={group.expires_at} />
              </div>
            </div>
          )}
          {group.status === 'success' && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700 font-medium">
                  ✓ ຈັບກຸ່ມສຳເລັດ (拼团成功)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 商品信息 */}
        <div className="card p-4">
          <h2 className="font-bold text-gray-700 mb-3">ສິນຄ້າ (商品信息)</h2>

          {/* 商品图片 */}
          {product.images.length > 0 && (
            <div className="mb-4">
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={product.images[currentImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {product.images.length > 1 && (
                <div className="flex justify-center gap-2 mt-2">
                  {product.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex ? 'bg-primary-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <h3 className="font-medium text-gray-800 mb-1">{product.name}</h3>
          {product.name_lo && (
            <p className="text-sm text-gray-500 mb-2">{product.name_lo}</p>
          )}

          <div className="text-sm text-gray-600 mt-3 space-y-1">
            <p>ຈຳນວນ (数量): {order.quantity} ຊິ້ນ</p>
            <p>ລາຄາຕໍ່ຫົວ (单价): {formatPrice(order.unit_price)}</p>
          </div>
        </div>

        {/* 收货信息 */}
        <div className="card p-4">
          <h2 className="font-bold text-gray-700 mb-3">ຂໍ້ມູນຜູ້ຮັບ (收货信息)</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">ຊື່ (姓名):</span>
              <span className="font-medium">{member.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ເບີໂທ (电话):</span>
              <span className="font-medium font-mono">{member.phone}</span>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-gray-600 mb-1">ທີ່ຢູ່ (地址):</p>
              <p className="font-medium">{member.address}</p>
            </div>
          </div>
        </div>

        {/* 费用明细 */}
        <div className="card p-4">
          <h2 className="font-bold text-gray-700 mb-3">ລາຍລະອຽດຄ່າໃຊ້ຈ່າຍ (费用明细)</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">ລາຄາສິນຄ້າ (商品价格)</span>
              <span>{formatPrice(order.total_price)}</span>
            </div>

            <div className="border-t border-gray-200 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ມັດຈຳ {order.status !== 'pending_deposit' ? '✓' : ''} (定金)</span>
                <span className={order.status !== 'pending_deposit' ? 'text-green-600' : 'font-bold text-primary-500'}>
                  {formatPrice(order.deposit_amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ທ້າຍ {order.status === 'paid' ? '✓' : ''} (尾款)</span>
                <span className={order.status === 'paid' ? 'text-green-600' : 'font-medium'}>
                  {formatPrice(order.final_amount)}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between font-bold">
                <span>ລວມທັງຫມົດ (总计)</span>
                <span className="text-primary-500 text-lg">{formatPrice(order.total_price)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 支付凭证 */}
        {paymentProofs.length > 0 && (
          <div className="card p-4">
            <h2 className="font-bold text-gray-700 mb-3">ຫຼັກຖານການຈ່າຍເງິນ (支付凭证)</h2>
            <div className="space-y-3">
              {paymentProofs.map((proof) => (
                <div key={proof.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start gap-3 mb-2">
                    <div
                      className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 flex-shrink-0"
                      onClick={() => setShowProofImage(proof.proof_image_url)}
                    >
                      <img
                        src={proof.proof_image_url}
                        alt="Payment Proof"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          proof.status === 'verified' ? 'bg-green-100 text-green-700' :
                          proof.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {proof.status === 'verified' ? '✓ ຢືນຢັນແລ້ວ (已验证)' :
                           proof.status === 'rejected' ? '✗ ປະຕິເສດ (已拒绝)' :
                           '⏳ ກວດສອບ (审核中)'}
                        </span>
                      </div>
                      <p className="text-gray-600">ຈຳນວນ (金额): {formatPrice(proof.amount)}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(proof.created_at).toLocaleString('zh-CN')}
                      </p>
                      {proof.admin_note && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <span className="text-gray-600">ໝາຍເຫດ (备注): </span>
                          <span className="text-gray-700">{proof.admin_note}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 物流信息 */}
        {order.tracking_number && (
          <div className="card p-4">
            <h2 className="font-bold text-gray-700 mb-3">ຂໍ້ມູນການຈັດສົ່ງ (物流信息)</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ເລກຕິດຕາມ (运单号):</span>
                <span className="font-mono font-medium">{order.tracking_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ສະຖານະ (状态):</span>
                <span>{order.shipping_status || '-'}</span>
              </div>
            </div>
          </div>
        )}

        {/* 备注 */}
        {order.notes && (
          <div className="card p-4">
            <h2 className="font-bold text-gray-700 mb-3">ໝາຍເຫດ (备注)</h2>
            <p className="text-sm text-gray-600">{order.notes}</p>
          </div>
        )}

        {/* 需要付款按钮 */}
        {order.status === 'pending_deposit' && order.payment_status === 'pending' && (
          <Link href={`/payment/${order.id}`} className="btn-primary w-full text-center block">
            💰 ຈ່າຍມັດຈຳ {formatPrice(order.deposit_amount)} (支付定金)
          </Link>
        )}
      </div>

      {/* 支付凭证大图预览 */}
      {showProofImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowProofImage(null)}
        >
          <div className="max-w-2xl w-full">
            <img
              src={showProofImage}
              alt="Payment Proof"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      )}

      {/* 底部按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <a href="/" className="flex-1 text-center py-3 px-4 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors">
            🏠 ໜ້າຫຼັກ (首页)
          </a>
          <a href="/orders/check" className="flex-1 text-center py-3 px-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
            📋 ອໍເດີອື່ນ (查看订单)
          </a>
        </div>
      </div>
    </div>
  );
}
