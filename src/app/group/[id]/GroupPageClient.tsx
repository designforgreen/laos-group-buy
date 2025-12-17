'use client';

import { useState } from 'react';
import CountdownTimer from '@/components/CountdownTimer';
import PriceTiers from '@/components/PriceTiers';
import GroupProgress from '@/components/GroupProgress';
import { formatPrice } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  name: string;
  name_lo?: string;
  description?: string;
  description_lo?: string;
  images: string[];
  original_price: number;
  tiers: { min_people: number; price: number }[];
}

interface GroupBuy {
  id: string;
  product_id: string;
  current_people: number;
  target_people: number;
  status: string;
  expires_at: string;
  is_official?: boolean;
}

export default function GroupPageClient({
  product,
  groupBuy,
  allGroupBuys = [],
}: {
  product: Product;
  groupBuy: GroupBuy;
  allGroupBuys?: GroupBuy[];
}) {
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showOtherGroups, setShowOtherGroups] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 获取当前价格
  const getCurrentPrice = () => {
    const tier = product.tiers.find(t => t.min_people <= groupBuy.current_people + 1);
    return tier?.price || product.original_price;
  };

  // 计算定金（30%）
  const depositPercentage = 30;
  const currentPrice = getCurrentPrice();
  const depositAmount = Math.ceil(currentPrice * depositPercentage / 100);

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. 创建拼团成员记录
      const { data: member, error: memberError } = await supabase
        .from('gb_group_members')
        .insert([{
          group_id: groupBuy.id,
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          deposit_amount: depositAmount,
          final_amount: currentPrice - depositAmount,
          payment_method: 'pending',
          status: 'joined',
        }])
        .select()
        .single();

      if (memberError) throw memberError;

      // 2. 创建订单
      const { data: order, error: orderError } = await supabase
        .from('gb_orders')
        .insert([{
          group_id: groupBuy.id,
          member_id: member.id,
          product_id: product.id,
          quantity: 1,
          unit_price: currentPrice,
          total_price: currentPrice,
          deposit_amount: depositAmount,
          final_amount: currentPrice - depositAmount,
          status: 'pending_deposit',
          payment_status: 'pending',
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. 跳转到支付页面
      window.location.href = `/payment/${order.id}`;
    } catch (error) {
      console.error('Submit error:', error);
      alert('提交失败，请重试');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-24">
      {/* 商品图片轮播 */}
      <div className="relative aspect-square bg-gray-100">
        {product.images[currentImageIndex] ? (
          <img
            src={product.images[currentImageIndex]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-center text-gray-400">
              <svg className="w-24 h-24 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{product.name}</span>
            </div>
          </div>
        )}

        {/* 图片指示器 */}
        {product.images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {product.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 拼团信息卡片 */}
      <div className="mx-4 -mt-6 relative z-10 card p-4">
        {/* 倒计时 */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">ເຫຼືອເວລາ (剩余时间)</span>
          <CountdownTimer expiresAt={groupBuy.expires_at} />
        </div>

        {/* 阶梯价格 */}
        <PriceTiers
          tiers={product.tiers}
          currentPeople={groupBuy.current_people}
          originalPrice={product.original_price}
        />

        {/* 拼团进度 */}
        <div className="mt-4">
          <GroupProgress
            current={groupBuy.current_people}
            target={groupBuy.target_people}
          />
        </div>
      </div>

      {/* 商品详情 */}
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-gray-800 mb-2">
          {product.name}
        </h1>
        {product.name_lo && (
          <p className="text-gray-500 mb-4">{product.name_lo}</p>
        )}
        <p className="text-gray-600 leading-relaxed">
          {product.description}
        </p>
        {product.description_lo && (
          <p className="text-gray-400 mt-2">{product.description_lo}</p>
        )}
      </div>

      {/* 拼团规则 */}
      <div className="px-4 py-4 bg-gray-50">
        <h3 className="font-bold text-gray-700 mb-3">📋 ກົດລະບຽບ (拼团规则)</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-primary-500">1.</span>
            <span>ຈ່າຍເງິນມັດຈຳ {depositPercentage}% ເພື່ອເຂົ້າຮ່ວມ (支付{depositPercentage}%定金参团)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500">2.</span>
            <span>ຈັບກຸ່ມສຳເລັດ ຈ່າຍສ່ວນທີ່ເຫຼືອ (成团后补尾款)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500">3.</span>
            <span>ບໍ່ສຳເລັດ ຄືນເງິນມັດຈຳ (不成团全额退款)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500">4.</span>
            <span>ຄົນຫຼາຍ ລາຄາຖືກກວ່າ (人越多价格越低)</span>
          </li>
        </ul>
      </div>

      {/* 其他进行中的团 */}
      {allGroupBuys.length > 1 && (
        <div className="px-4 py-4">
          <button
            onClick={() => setShowOtherGroups(!showOtherGroups)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-bold text-gray-700">
              👥 ກຸ່ມອື່ນທີ່ກຳລັງດຳເນີນ (其他进行中的团)
            </h3>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${
                showOtherGroups ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showOtherGroups && (
            <div className="mt-4 space-y-3">
              {allGroupBuys
                .filter(g => g.id !== groupBuy.id)
                .map((group) => {
                  const progress = (group.current_people / group.target_people) * 100;
                  return (
                    <div
                      key={group.id}
                      className="card p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => window.location.href = `/group/${group.id}?product=${product.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">
                            👥 {group.current_people}/{group.target_people} ຄົນ
                          </span>
                          {group.is_official && (
                            <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded">
                              官方
                            </span>
                          )}
                        </div>
                        <CountdownTimer expiresAt={group.expires_at} />
                      </div>

                      {/* 进度条 */}
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="mt-2 text-xs text-gray-500">
                        ຄລິກເພື່ອເຂົ້າຮ່ວມກຸ່ມນີ້ (点击加入此团)
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* 参团表单 */}
      {showJoinForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">ເຂົ້າຮ່ວມຈັບກຸ່ມ (参加拼团)</h3>
              <button
                onClick={() => setShowJoinForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">ຊື່ (姓名) *</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="ປ້ອນຊື່ຂອງທ່ານ"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">ເບີໂທ (电话) *</label>
                <input
                  type="tel"
                  required
                  className="input"
                  placeholder="020 xxxx xxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">ທີ່ຢູ່ (地址) *</label>
                <textarea
                  required
                  className="input"
                  rows={3}
                  placeholder="ປ້ອນທີ່ຢູ່ຈັດສົ່ງ"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              {/* 费用明细 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">商品价格</span>
                  <span>{formatPrice(currentPrice)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">定金比例</span>
                  <span>{depositPercentage}%</span>
                </div>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="flex justify-between font-bold">
                  <span>ເງິນມັດຈຳ (需付定金)</span>
                  <span className="text-primary-500">{formatPrice(depositAmount)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    处理中...
                  </>
                ) : (
                  <>
                    💰 ຈ່າຍເງິນມັດຈຳ {formatPrice(depositAmount)}
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center">
                支付后将跳转到 BCEL OnePay 完成付款
              </p>
            </form>
          </div>
        </div>
      )}

      {/* 底部固定按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-500">ເງິນມັດຈຳ (定金)</p>
            <p className="text-xl font-bold text-primary-500">{formatPrice(depositAmount)}</p>
          </div>
          <button
            onClick={() => setShowJoinForm(true)}
            className="btn-primary flex-1"
          >
            🛒 ເຂົ້າຮ່ວມດຽວນີ້ (立即参团)
          </button>
        </div>
      </div>
    </div>
  );
}
