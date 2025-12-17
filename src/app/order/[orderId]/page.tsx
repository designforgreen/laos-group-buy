import { supabase } from '@/lib/supabase';
import OrderDetailClient from './OrderDetailClient';

export default async function OrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const { orderId } = params;

  // 获取订单详情
  const { data: order, error } = await supabase
    .from('gb_orders')
    .select(`
      *,
      gb_products (
        id,
        name,
        name_lo,
        description,
        description_lo,
        images,
        original_price,
        tiers
      ),
      gb_group_buys (
        id,
        status,
        current_people,
        target_people,
        expires_at,
        is_official
      ),
      gb_group_members (
        id,
        name,
        phone,
        address
      )
    `)
    .eq('id', orderId)
    .single();

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            ບໍ່ພົບອໍເດີ (订单不存在)
          </h2>
          <p className="text-gray-600 mb-6">
            ອໍເດີນີ້ບໍ່ມີຢູ່ໃນລະບົບ
            <br />
            (该订单不存在或已被删除)
          </p>
          <a href="/" className="btn-primary inline-block">
            ກັບໜ້າຫຼັກ (返回首页)
          </a>
        </div>
      </div>
    );
  }

  // 获取支付凭证
  const { data: paymentProofs } = await supabase
    .from('gb_payment_proofs')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  return <OrderDetailClient order={order} paymentProofs={paymentProofs || []} />;
}
