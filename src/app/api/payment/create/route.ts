import { NextRequest, NextResponse } from 'next/server';

// BCEL OnePay API 配置
const BCEL_CONFIG = {
  merchantId: process.env.BCEL_MERCHANT_ID || '',
  apiKey: process.env.BCEL_API_KEY || '',
  apiSecret: process.env.BCEL_API_SECRET || '',
  apiUrl: process.env.BCEL_API_URL || 'https://api.bcelbank.la/onepay',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, amount, description, customer_phone } = body;

    // 验证参数
    if (!order_id || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 构建回调URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/payment/result?order_id=${order_id}`;
    const callbackUrl = `${baseUrl}/api/payment/callback`;

    // TODO: 实际调用 BCEL OnePay API
    // 这里是模拟响应，实际部署时需要替换为真实的API调用

    /*
    // 真实 BCEL API 调用示例：
    const crypto = require('crypto');
    const timestamp = Date.now().toString();
    const signature = crypto
      .createHmac('sha256', BCEL_CONFIG.apiSecret)
      .update(`${BCEL_CONFIG.merchantId}${order_id}${amount}${timestamp}`)
      .digest('hex');

    const response = await fetch(`${BCEL_CONFIG.apiUrl}/v1/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Merchant-ID': BCEL_CONFIG.merchantId,
        'X-API-Key': BCEL_CONFIG.apiKey,
        'X-Signature': signature,
        'X-Timestamp': timestamp,
      },
      body: JSON.stringify({
        order_id,
        amount,
        currency: 'LAK',
        description,
        customer_phone,
        return_url: returnUrl,
        callback_url: callbackUrl,
      }),
    });

    const data = await response.json();
    */

    // 模拟支付URL（开发测试用）
    const mockPaymentUrl = `${baseUrl}/payment/mock?order_id=${order_id}&amount=${amount}`;

    return NextResponse.json({
      success: true,
      payment_url: mockPaymentUrl,
      order_id,
      amount,
      message: 'Payment URL created successfully',
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
