import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import PaymentPageClient from './PaymentPageClient';

export default async function PaymentPage({
  params,
}: {
  params: { orderId: string };
}) {
  const orderId = params.orderId;

  // 获取订单信息
  const { data: order, error: orderError } = await supabase
    .from('gb_orders')
    .select(`
      *,
      member:gb_group_members(*),
      product:gb_products(*),
      group:gb_group_buys(*)
    `)
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    notFound();
  }

  // 获取支付配置
  const { data: paymentMethods, error: configError } = await supabase
    .from('gb_payment_config')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  return (
    <PaymentPageClient
      order={order}
      paymentMethods={paymentMethods || []}
    />
  );
}
