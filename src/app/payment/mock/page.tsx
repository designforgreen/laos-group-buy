'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';

// 模拟支付页面（开发测试用）
export default function MockPaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  const amount = searchParams.get('amount');
  const [processing, setProcessing] = useState(false);

  const formatPrice = (price: string | null) => {
    if (!price) return '0 ₭';
    return new Intl.NumberFormat('lo-LA').format(parseInt(price)) + ' ₭';
  };

  const handlePayment = async (success: boolean) => {
    setProcessing(true);

    // 模拟支付处理
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 调用回调
    await fetch('/api/payment/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderId,
        transaction_id: 'TXN' + Date.now(),
        amount,
        status: success ? 'success' : 'failed',
      }),
    });

    // 跳转结果页
    router.push(`/payment/result?order_id=${orderId}&status=${success ? 'success' : 'failed'}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        {/* BCEL Logo 模拟 */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto flex items-center justify-center mb-3">
            <span className="text-white text-2xl font-bold">B</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800">BCEL OnePay</h1>
          <p className="text-sm text-gray-500">模拟支付 (Mock Payment)</p>
        </div>

        {/* 订单信息 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-500">订单号</span>
            <span className="font-mono text-sm">{orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">支付金额</span>
            <span className="text-xl font-bold text-blue-600">{formatPrice(amount)}</span>
          </div>
        </div>

        {/* 支付按钮 */}
        {!processing ? (
          <div className="space-y-3">
            <button
              onClick={() => handlePayment(true)}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              ✅ 模拟支付成功
            </button>
            <button
              onClick={() => handlePayment(false)}
              className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
            >
              ❌ 模拟支付失败
            </button>
            <button
              onClick={() => router.back()}
              className="w-full bg-gray-200 text-gray-600 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              取消支付
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="animate-spin w-12 h-12 mx-auto text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="mt-4 text-gray-600">处理中...</p>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center mt-6">
          这是模拟支付页面，仅用于开发测试
        </p>
      </div>
    </div>
  );
}
