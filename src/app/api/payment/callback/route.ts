import { NextRequest, NextResponse } from 'next/server';

// BCEL OnePay 支付回调处理
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      order_id,
      transaction_id,
      amount,
      status,
      signature,
    } = body;

    console.log('Payment callback received:', { order_id, transaction_id, amount, status });

    // TODO: 验证签名
    // const expectedSignature = crypto
    //   .createHmac('sha256', process.env.BCEL_API_SECRET)
    //   .update(`${order_id}${transaction_id}${amount}${status}`)
    //   .digest('hex');
    // if (signature !== expectedSignature) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    // }

    // TODO: 更新订单状态
    // await supabase
    //   .from('orders')
    //   .update({
    //     status: status === 'success' ? 'deposit_paid' : 'payment_failed',
    //     payment_reference: transaction_id,
    //     updated_at: new Date().toISOString(),
    //   })
    //   .eq('id', order_id);

    // TODO: 更新拼团人数
    // if (status === 'success') {
    //   const { data: order } = await supabase
    //     .from('orders')
    //     .select('group_id')
    //     .eq('id', order_id)
    //     .single();
    //
    //   await supabase.rpc('increment_group_people', { group_id: order.group_id });
    // }

    // TODO: 发送通知（WhatsApp消息等）

    return NextResponse.json({
      success: true,
      message: 'Callback processed',
    });
  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.json(
      { error: 'Callback processing failed' },
      { status: 500 }
    );
  }
}

// 处理 GET 请求（用于测试）
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Payment callback endpoint is active',
  });
}
