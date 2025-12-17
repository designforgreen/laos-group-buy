'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface PaymentMethod {
  id: string;
  payment_type: string;
  title: string;
  title_lo?: string;
  qr_code_url?: string;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  instructions?: string;
  instructions_lo?: string;
}

interface Order {
  id: string;
  deposit_amount: number;
  status: string;
  member: {
    name: string;
    phone: string;
  };
  product: {
    name: string;
    name_lo?: string;
  };
}

export default function PaymentPageClient({
  order,
  paymentMethods,
}: {
  order: Order;
  paymentMethods: PaymentMethod[];
}) {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState(paymentMethods[0]?.payment_type || 'qrcode');
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentMethod = paymentMethods.find(m => m.payment_type === selectedMethod);

  // 复制订单号
  const copyOrderId = () => {
    navigator.clipboard.writeText(order.id.slice(0, 8));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 上传支付截图
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件大小（最大5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('文件大小不能超过5MB');
      return;
    }

    setUploading(true);

    try {
      // 生成唯一文件名
      const fileExt = file.name.split('.').pop();
      const fileName = `${order.id}_${Date.now()}.${fileExt}`;
      const filePath = `payment-proofs/${fileName}`;

      // 上传到Supabase Storage
      const { data, error } = await supabase.storage
        .from('group-buy')
        .upload(filePath, file);

      if (error) throw error;

      // 获取公开URL
      const { data: { publicUrl } } = supabase.storage
        .from('group-buy')
        .getPublicUrl(filePath);

      setUploadedUrl(publicUrl);
    } catch (error) {
      console.error('Upload error:', error);
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  // 提交支付凭证
  const handleSubmitProof = async () => {
    if (!uploadedUrl) {
      alert('请先上传支付截图');
      return;
    }

    setSubmitting(true);

    try {
      // 创建支付凭证记录
      const { error: proofError } = await supabase
        .from('gb_payment_proofs')
        .insert([{
          order_id: order.id,
          member_id: (order as any).member_id,
          payment_method: selectedMethod,
          proof_image_url: uploadedUrl,
          amount: order.deposit_amount,
          status: 'pending',
        }]);

      if (proofError) throw proofError;

      // 更新订单状态
      const { error: orderError } = await supabase
        .from('gb_orders')
        .update({
          payment_status: 'pending_verify',
          payment_proof_url: uploadedUrl,
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      // 跳转到成功页面
      router.push(`/payment/${order.id}/success`);
    } catch (error) {
      console.error('Submit error:', error);
      alert('提交失败，请重试');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部状态 */}
      <div className="bg-primary-500 text-white p-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm opacity-90">ຈ່າຍເງິນມັດຈຳ (支付定金)</p>
              <p className="text-2xl font-bold">{formatPrice(order.deposit_amount)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm opacity-75">
              <p>ເລກອໍເດີ / 订单号</p>
              <p className="font-mono font-bold">{order.id.slice(0, 8)}</p>
            </div>
            <button
              onClick={copyOrderId}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors flex items-center gap-1"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  ຄັດລອກແລ້ວ
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  ຄັດລອກ
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* 订单信息 */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-800 mb-3">📦 ຂໍ້ມູນອໍເດີ (订单信息)</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">商品</span>
              <span className="font-medium">{order.product.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">购买人</span>
              <span className="font-medium">{order.member.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">电话</span>
              <span className="font-medium">{order.member.phone}</span>
            </div>
          </div>
        </div>

        {/* 选择支付方式 */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-800 mb-3">💳 ເລືອກວິທີຈ່າຍເງິນ (选择支付方式)</h3>
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <label
                key={method.id}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedMethod === method.payment_type
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={method.payment_type}
                  checked={selectedMethod === method.payment_type}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="w-4 h-4 text-primary-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{method.title}</p>
                  {method.title_lo && (
                    <p className="text-xs text-gray-500">{method.title_lo}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 支付信息 */}
        {currentMethod && (
          <div className="card p-4">
            <h3 className="font-bold text-gray-800 mb-3">
              {currentMethod.payment_type === 'qrcode' ? '📱 ສະແກນ QR (扫码支付)' : '🏦 ຂໍ້ມູນບັນຊີ (银行账户)'}
            </h3>

            {currentMethod.payment_type === 'qrcode' ? (
              <div className="text-center">
                {currentMethod.qr_code_url ? (
                  <img
                    src={currentMethod.qr_code_url}
                    alt="QR Code"
                    className="w-64 h-64 mx-auto bg-white p-4 rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">暂无收款码</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-500">银行</span>
                  <span className="font-medium">{currentMethod.bank_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">账号</span>
                  <span className="font-mono font-medium">{currentMethod.account_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">户名</span>
                  <span className="font-medium">{currentMethod.account_name}</span>
                </div>
              </div>
            )}

            {/* 说明 */}
            {currentMethod.instructions && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ {currentMethod.instructions}
                </p>
                {currentMethod.instructions_lo && (
                  <p className="text-xs text-yellow-700 mt-1">
                    {currentMethod.instructions_lo}
                  </p>
                )}
                <div className="mt-3 p-2 bg-yellow-100 rounded flex items-center justify-between">
                  <div className="text-sm text-yellow-900">
                    <p className="font-medium">ໝາຍເຫດ / 备注</p>
                    <p className="font-mono font-bold text-base">{order.id.slice(0, 8)}</p>
                  </div>
                  <button
                    onClick={copyOrderId}
                    className="px-3 py-2 bg-yellow-200 hover:bg-yellow-300 rounded text-xs font-medium text-yellow-900 transition-colors flex items-center gap-1.5"
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        已复制
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        复制
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 上传支付凭证 */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-800 mb-3">📸 ອັບໂຫຼດຮູບຫຼັກຖານ (上传支付凭证)</h3>

          {uploadedUrl ? (
            <div className="space-y-3">
              <img
                src={uploadedUrl}
                alt="Payment proof"
                className="w-full rounded-lg border-2 border-green-200"
              />
              <button
                onClick={() => setUploadedUrl('')}
                className="text-sm text-primary-500 hover:text-primary-600"
              >
                重新上传
              </button>
            </div>
          ) : (
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
                {uploading ? (
                  <>
                    <svg className="animate-spin w-8 h-8 mx-auto mb-2 text-primary-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-sm text-gray-500">上传中...</p>
                  </>
                ) : (
                  <>
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="font-medium text-gray-700 mb-1">点击上传截图</p>
                    <p className="text-xs text-gray-500">支持 JPG, PNG，最大5MB</p>
                  </>
                )}
              </div>
            </label>
          )}
        </div>
      </div>

      {/* 底部提交按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmitProof}
            disabled={!uploadedUrl || submitting}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                提交中...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                ສົ່ງຫຼັກຖານການຈ່າຍເງິນ (提交支付凭证)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
