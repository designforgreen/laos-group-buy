'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OrderCheckPage() {
  const [phone, setPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setIsSearching(true);
    // 跳转到订单列表页面，将电话号码作为查询参数
    router.push(`/orders/list?phone=${encodeURIComponent(phone)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ກວດສອບອໍເດີ (订单查询)
          </h1>
          <p className="text-gray-600">
            ປ້ອນເບີໂທລະສັບເພື່ອເບິ່ງອໍເດີຂອງທ່ານ
          </p>
          <p className="text-sm text-gray-500">
            输入电话号码查看您的订单
          </p>
        </div>

        {/* Form Card */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ເບີໂທລະສັບ (电话号码) *
              </label>
              <input
                type="tel"
                required
                className="input text-lg"
                placeholder="020 xxxx xxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSearching}
              />
              <p className="text-xs text-gray-500 mt-2">
                ປ້ອນເບີໂທທີ່ທ່ານໃຊ້ໃນເວລາສັ່ງຊື້
                <br />
                (输入您下单时使用的电话号码)
              </p>
            </div>

            <button
              type="submit"
              disabled={isSearching || !phone.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSearching ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  ກຳລັງຊອກຫາ...
                </>
              ) : (
                <>
                  🔍 ຊອກຫາອໍເດີ (查询订单)
                </>
              )}
            </button>
          </form>
        </div>

        {/* 提示信息 */}
        <div className="mt-6 card p-4 bg-blue-50 border border-blue-200">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">ໝາຍເຫດ (温馨提示)</p>
              <ul className="text-xs space-y-1">
                <li>• ທ່ານສາມາດກວດສອບສະຖານະການຈ່າຍເງິນ (可查看支付状态)</li>
                <li>• ກວດສອບສະຖານະການຈັດສົ່ງ (可查看配送状态)</li>
                <li>• ລາຍລະອຽດຂອງການສັ່ງຊື້ທັງຫມົດ (查看所有订单详情)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 返回首页 */}
        <div className="mt-4 text-center">
          <a href="/" className="text-sm text-gray-500 hover:text-primary-500">
            ← ກັບໜ້າຫຼັກ (返回首页)
          </a>
        </div>
      </div>
    </div>
  );
}
