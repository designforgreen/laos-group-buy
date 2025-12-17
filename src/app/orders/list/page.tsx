import { supabase } from '@/lib/supabase';
import OrderListClient from './OrderListClient';

export default async function OrderListPage({
  searchParams,
}: {
  searchParams: { phone?: string };
}) {
  const phone = searchParams.phone;

  if (!phone) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">ກະລຸນາປ້ອນເບີໂທລະສັບ (请输入电话号码)</p>
          <a href="/orders/check" className="btn-primary inline-block">
            ກັບໄປຊອກຫາ (返回查询)
          </a>
        </div>
      </div>
    );
  }

  // 查询该电话号码的所有成员记录
  const { data: members, error: membersError } = await supabase
    .from('gb_group_members')
    .select('*')
    .eq('phone', phone);

  if (membersError) {
    console.error('Members error:', membersError);
  }

  if (!members || members.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="card p-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              ບໍ່ພົບອໍເດີ (未找到订单)
            </h2>
            <p className="text-gray-600 mb-1">
              ເບີໂທ: {phone}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              ບໍ່ມີອໍເດີທີ່ກ່ຽວຂ້ອງກັບເບີນີ້
              <br />
              (该电话号码没有相关订单)
            </p>
            <a href="/orders/check" className="btn-primary inline-block">
              ລອງໃໝ່ (重新查询)
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 获取所有订单
  const memberIds = members.map(m => m.id);
  const { data: orders, error: ordersError } = await supabase
    .from('gb_orders')
    .select(`
      *,
      gb_products (
        id,
        name,
        name_lo,
        images
      ),
      gb_group_buys (
        id,
        status,
        current_people,
        target_people,
        expires_at
      ),
      gb_group_members (
        id,
        name,
        address
      )
    `)
    .in('member_id', memberIds)
    .order('created_at', { ascending: false });

  if (ordersError) {
    console.error('Orders error:', ordersError);
  }

  return <OrderListClient phone={phone} orders={orders || []} />;
}
