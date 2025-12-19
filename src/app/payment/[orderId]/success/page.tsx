'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export const runtime = 'edge';

export default function PaymentSuccessPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* 成功图标 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ສົ່ງສຳເລັດ! (提交成功!)
          </h1>
          <p className="text-gray-600">
            ພວກເຮົາໄດ້ຮັບຮູບຫຼັກຖານການຈ່າຍເງິນແລ້ວ
          </p>
          <p className="text-sm text-gray-500">
            我们已收到您的支付凭证
          </p>
        </div>

        {/* 信息卡片 */}
        <div className="card p-6 mb-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">ກຳລັງກວດສອບ (审核中)</p>
                <p className="text-sm text-gray-500 mt-1">
                  管理员会在1-2小时内审核您的支付凭证
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-gray-400 font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-400">ຮໍຖ້າການຢືນຢັນ (等待确认)</p>
                <p className="text-sm text-gray-400 mt-1">
                  审核通过后，您将正式加入拼团
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-gray-400 font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-400">ສຳເລັດ (完成)</p>
                <p className="text-sm text-gray-400 mt-1">
                  拼团成功后，我们将联系您补尾款并发货
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="card p-4 bg-blue-50 border border-blue-200 mb-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800 mb-1">
                ສິ່ງທີ່ຕ້ອງຮູ້ (重要提示)
              </p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• ກະລຸນາເປີດໂທລະສັບໄວ້ ເພື່ອໃຫ້ພວກເຮົາຕິດຕໍ່ທ່ານ (请保持电话畅通，方便我们联系您)</li>
                <li>• ຜົນການກວດສອບຈະແຈ້ງທາງໂທລະສັບ/ຂໍ້ຄວາມ (审核结果将通过电话/短信通知)</li>
                <li>• ຖ້າມີບັນຫາ ກະລຸນາຕິດຕໍ່ພະນັກງານ (如有问题，请联系客服)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 按钮 */}
        <div className="space-y-3">
          <Link href="/" className="btn-primary w-full text-center block">
            🏠 ກັບໜ້າຫຼັກ (返回首页)
          </Link>

          <Link
            href="/orders/check"
            className="block w-full text-center py-3 px-4 bg-white border-2 border-primary-500 rounded-lg text-primary-500 hover:bg-primary-50 transition-colors font-medium"
          >
            📋 ກວດສອບອໍເດີ (查询订单)
          </Link>

          {/* 订单号提示 */}
          <div className="text-center text-sm text-gray-500">
            <p>ເລກອໍເດີຂອງທ່ານ (您的订单号):</p>
            <p className="font-mono text-gray-700 font-medium mt-1">{orderId.slice(0, 8)}</p>
            <p className="text-xs mt-2">
              ທ່ານສາມາດໃຊ້ເບີໂທຊອກຫາອໍເດີໄດ້ທຸກເວລາ<br/>
              (您可以随时用电话号码查询订单)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
