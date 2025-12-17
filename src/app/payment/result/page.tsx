'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const status = searchParams.get('status');
  const isSuccess = status === 'success';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        {/* 状态图标 */}
        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${
          isSuccess ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {isSuccess ? (
            <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        {/* 状态文字 */}
        <h1 className={`text-2xl font-bold mb-2 ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
          {isSuccess ? 'ຈ່າຍເງິນສຳເລັດ!' : 'ຈ່າຍເງິນລົ້ມເຫຼວ'}
        </h1>
        <p className="text-gray-500 mb-2">
          {isSuccess ? '支付成功' : '支付失败'}
        </p>

        {orderId && (
          <p className="text-sm text-gray-400 mb-6">
            订单号: {orderId}
          </p>
        )}

        {/* 成功提示 */}
        {isSuccess && (
          <div className="bg-green-50 rounded-lg p-4 mb-6 text-left max-w-sm mx-auto">
            <h3 className="font-medium text-green-800 mb-2">📱 下一步</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• 等待拼团成功</li>
              <li>• 成团后补尾款</li>
              <li>• 我们会通过WhatsApp通知您</li>
            </ul>
          </div>
        )}

        {/* 失败提示 */}
        {!isSuccess && (
          <div className="bg-red-50 rounded-lg p-4 mb-6 text-left max-w-sm mx-auto">
            <h3 className="font-medium text-red-800 mb-2">❓ 可能的原因</h3>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• 余额不足</li>
              <li>• 网络问题</li>
              <li>• 支付超时</li>
            </ul>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="space-y-3 max-w-sm mx-auto">
          {isSuccess ? (
            <>
              <Link href="/orders" className="btn-primary w-full block text-center">
                查看我的订单
              </Link>
              <Link href="/" className="btn-secondary w-full block text-center">
                继续购物
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={() => window.history.back()}
                className="btn-primary w-full"
              >
                重新支付
              </button>
              <Link href="/" className="btn-secondary w-full block text-center">
                返回首页
              </Link>
            </>
          )}
        </div>

        {/* 客服联系 */}
        <div className="mt-8">
          <p className="text-sm text-gray-500 mb-2">遇到问题？联系客服</p>
          <a
            href="https://wa.me/85620xxxxxxxx"
            className="text-primary-500 text-sm font-medium"
          >
            WhatsApp: +856 20 xxxx xxxx
          </a>
        </div>
      </div>
    </div>
  );
}
