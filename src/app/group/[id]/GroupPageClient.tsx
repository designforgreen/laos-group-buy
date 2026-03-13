'use client';

import { useState } from 'react';
import CountdownTimer from '@/components/CountdownTimer';
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
  const [selectedGroup, setSelectedGroup] = useState<GroupBuy | null>(null);
  const [selectedTier, setSelectedTier] = useState<{ min_people: number; price: number } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [shareToast, setShareToast] = useState(false);

  // 按目标人数分组现有团
  const groupsByTarget = (targetPeople: number) =>
    allGroupBuys.filter(g => g.target_people === targetPeople && g.current_people < g.target_people);

  // 获取选中的价格
  const getSelectedPrice = () => {
    if (selectedTier) return selectedTier.price;
    return product.original_price;
  };

  // 计算定金（30%）
  const depositPercentage = 30;
  const selectedPrice = getSelectedPrice();
  const depositAmount = Math.ceil(selectedPrice * depositPercentage / 100);

  // 分享功能
  const shareLink = typeof window !== 'undefined'
    ? `${window.location.origin}/group/${selectedGroup?.id || groupBuy.id}?product=${product.id}`
    : '';

  const handleShare = async () => {
    const text = `${product.name_lo || product.name} - ${formatPrice(product.tiers[product.tiers.length - 1]?.price || product.original_price)}! ເຂົ້າຮ່ວມຈັບກຸ່ມ!`;

    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text, url: shareLink });
      } catch {}
    } else {
      await navigator.clipboard.writeText(`${text}\n${shareLink}`);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `${product.name_lo || product.name}\n${formatPrice(product.tiers[product.tiers.length - 1]?.price || product.original_price)} ເທົ່ານັ້ນ!\nເຂົ້າຮ່ວມຈັບກຸ່ມ: ${shareLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // 选择直接购买
  const handleDirectBuy = () => {
    setSelectedGroup(null);
    setSelectedTier(null);
    setShowJoinForm(true);
  };

  // 加入已有团
  const handleJoinGroup = (group: GroupBuy, tier: { min_people: number; price: number }) => {
    setSelectedGroup(group);
    setSelectedTier(tier);
    setShowJoinForm(true);
  };

  // 开新团
  const handleCreateGroup = (tier: { min_people: number; price: number }) => {
    setSelectedGroup(null);
    setSelectedTier(tier);
    setShowJoinForm(true);
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let groupId = selectedGroup?.id;

      // 如果是开新团或直接购买，先创建团
      if (!groupId) {
        const targetPeople = selectedTier?.min_people || 1;
        const { data: newGroup, error: groupError } = await supabase
          .from('gb_group_buys')
          .insert([{
            product_id: product.id,
            target_people: targetPeople,
            current_people: 0,
            current_tier: 0,
            status: targetPeople === 1 ? 'success' : 'pending',
            expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            is_official: false,
          }])
          .select()
          .single();

        if (groupError) throw groupError;
        groupId = newGroup.id;
      }

      // 创建拼团成员记录
      const { data: member, error: memberError } = await supabase
        .from('gb_group_members')
        .insert([{
          group_id: groupId,
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          deposit_amount: depositAmount,
          final_amount: selectedPrice - depositAmount,
          payment_method: 'pending',
          status: 'joined',
        }])
        .select()
        .single();

      if (memberError) throw memberError;

      // 创建订单
      const { data: order, error: orderError } = await supabase
        .from('gb_orders')
        .insert([{
          group_id: groupId,
          member_id: member.id,
          product_id: product.id,
          quantity: 1,
          unit_price: selectedPrice,
          total_price: selectedPrice,
          deposit_amount: depositAmount,
          final_amount: selectedPrice - depositAmount,
          status: 'pending_deposit',
          payment_status: 'pending',
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      window.location.href = `/payment/${order.id}`;
    } catch (error) {
      console.error('Submit error:', error);
      alert('提交失败，请重试');
      setIsSubmitting(false);
    }
  };

  // 排序 tiers: min_people 从小到大
  const sortedTiers = [...product.tiers].sort((a, b) => a.min_people - b.min_people);

  return (
    <div className="pb-24">
      {/* 商品图片轮播 */}
      <div
        className="relative aspect-square bg-gray-100"
        onTouchStart={(e) => {
          const touch = e.touches[0];
          (e.currentTarget as any)._touchStartX = touch.clientX;
        }}
        onTouchEnd={(e) => {
          const startX = (e.currentTarget as any)._touchStartX;
          if (startX === undefined) return;
          const endX = e.changedTouches[0].clientX;
          const diff = startX - endX;
          if (Math.abs(diff) > 50) {
            if (diff > 0 && currentImageIndex < product.images.length - 1) {
              setCurrentImageIndex(currentImageIndex + 1);
            } else if (diff < 0 && currentImageIndex > 0) {
              setCurrentImageIndex(currentImageIndex - 1);
            }
          }
        }}
      >
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

        {/* 左右箭头 */}
        {product.images.length > 1 && (
          <>
            {currentImageIndex > 0 && (
              <button
                onClick={() => setCurrentImageIndex(currentImageIndex - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center text-white"
              >
                ‹
              </button>
            )}
            {currentImageIndex < product.images.length - 1 && (
              <button
                onClick={() => setCurrentImageIndex(currentImageIndex + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center text-white"
              >
                ›
              </button>
            )}
          </>
        )}

        {/* 图片指示器 */}
        {product.images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2">
            <span className="bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">
              {currentImageIndex + 1} / {product.images.length}
            </span>
            <div className="flex gap-2">
              {product.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 商品信息 */}
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-gray-800">
          {product.name_lo || product.name}
        </h1>
        {product.name_lo && (
          <p className="text-sm text-gray-500 mt-1">{product.name}</p>
        )}
        <p className="text-gray-600 mt-3 leading-relaxed text-sm">
          {product.description_lo || product.description}
        </p>
        {product.description_lo && product.description && (
          <p className="text-gray-400 mt-1 text-sm">{product.description}</p>
        )}
      </div>

      {/* 购买方式选择 */}
      <div className="px-4 pb-4">
        <h2 className="font-bold text-gray-800 mb-3">🛒 ເລືອກວິທີຊື້ (选择购买方式)</h2>

        {/* 直接购买 */}
        <div className="card p-4 mb-3 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">💳 ຊື້ເລີຍ (直接购买)</div>
              <div className="text-xl font-bold text-gray-700 mt-1">
                {formatPrice(product.original_price)}
              </div>
              <div className="text-xs text-gray-400">ບໍ່ຕ້ອງລໍຖ້າ (无需等待)</div>
            </div>
            <button
              onClick={handleDirectBuy}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              ຊື້ເລີຍ
            </button>
          </div>
        </div>

        {/* 各阶梯团购 */}
        {sortedTiers.map((tier, index) => {
          if (tier.min_people <= 1) return null;
          const existingGroups = groupsByTarget(tier.min_people);
          const discount = Math.round((1 - tier.price / product.original_price) * 100);

          return (
            <div key={index} className="card p-4 mb-3 border-2 border-primary-200 bg-primary-50/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary-600">
                      👥 {tier.min_people}ຄົນ ({tier.min_people}人团)
                    </span>
                    <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded">
                      -{discount}%
                    </span>
                  </div>
                  <div className="text-xl font-bold text-primary-600 mt-1">
                    {formatPrice(tier.price)}
                  </div>
                </div>
                <button
                  onClick={() => handleCreateGroup(tier)}
                  className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  ເປີດກຸ່ມໃໝ່
                  <span className="block text-xs opacity-80">开新团</span>
                </button>
              </div>

              {/* 已有的团 */}
              {existingGroups.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 font-medium">
                    ກຸ່ມທີ່ມີຢູ່ແລ້ວ (已有的团，可直接加入):
                  </div>
                  {existingGroups.map((group) => {
                    const progress = (group.current_people / group.target_people) * 100;
                    const remaining = group.target_people - group.current_people;
                    return (
                      <div
                        key={group.id}
                        className="bg-white rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              👥 {group.current_people}/{group.target_people}
                            </span>
                            {group.is_official && (
                              <span className="bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded">
                                ທາງການ
                              </span>
                            )}
                            <span className="text-xs text-primary-500">
                              ຍັງຂາດ {remaining} ຄົນ
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="mt-1">
                            <CountdownTimer expiresAt={group.expires_at} />
                          </div>
                        </div>
                        <button
                          onClick={() => handleJoinGroup(group, tier)}
                          className="ml-3 bg-primary-100 text-primary-600 px-3 py-2 rounded-lg text-sm font-medium"
                        >
                          ເຂົ້າຮ່ວມ
                          <span className="block text-xs">加入</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {existingGroups.length === 0 && (
                <div className="text-xs text-gray-400 text-center py-2">
                  ຍັງບໍ່ມີກຸ່ມ, ເປີດກຸ່ມໃໝ່ແລ້ວແບ່ງປັນໃຫ້ໝູ່ເພື່ອນ!
                  <br />还没有团，开新团分享给朋友吧！
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 分享按钮 */}
      <div className="px-4 pb-4">
        <div className="card p-4">
          <h3 className="font-bold text-gray-700 mb-3">📢 ແບ່ງປັນ (分享给朋友)</h3>
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-3 rounded-lg font-medium text-sm"
            >
              🔗 ສຳເນົາລິ້ງ (复制链接)
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-600 py-3 rounded-lg font-medium text-sm"
            >
              💬 WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* 拼团规则 */}
      <div className="px-4 py-4 bg-gray-50">
        <h3 className="font-bold text-gray-700 mb-3">📋 ກົດລະບຽບ (拼团规则)</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-primary-500">1.</span>
            <span>ເລືອກຊື້ໂດຍກົງ ຫຼື ເຂົ້າຮ່ວມກຸ່ມ (选择直接购买或加入团购)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500">2.</span>
            <span>ຈ່າຍເງິນມັດຈຳ {depositPercentage}% ເພື່ອເຂົ້າຮ່ວມ (支付{depositPercentage}%定金参团)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500">3.</span>
            <span>ຈັບກຸ່ມສຳເລັດ ຈ່າຍສ່ວນທີ່ເຫຼືອ (成团后补尾款)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500">4.</span>
            <span>ບໍ່ສຳເລັດ ຄືນເງິນມັດຈຳ (不成团全额退款)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500">5.</span>
            <span>ແບ່ງປັນໃຫ້ໝູ່ເພື່ອນ ເພື່ອໃຫ້ລາຄາຖືກກວ່າ! (分享给朋友，价格更低！)</span>
          </li>
        </ul>
      </div>

      {/* 复制成功提示 */}
      {shareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm z-50">
          ສຳເນົາລິ້ງສຳເລັດ! (链接已复制!)
        </div>
      )}

      {/* 参团表单 */}
      {showJoinForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                {selectedTier
                  ? `ເຂົ້າຮ່ວມ ${selectedTier.min_people} ຄົນ (${selectedTier.min_people}人团)`
                  : 'ຊື້ໂດຍກົງ (直接购买)'
                }
              </h3>
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
                  <span className="text-gray-500">ລາຄາສິນຄ້າ (商品价格)</span>
                  <span>{formatPrice(selectedPrice)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">ເງິນມັດຈຳ (定金比例)</span>
                  <span>{depositPercentage}%</span>
                </div>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="flex justify-between font-bold">
                  <span>ຕ້ອງຈ່າຍ (需付定金)</span>
                  <span className="text-primary-500">{formatPrice(depositAmount)}</span>
                </div>
                {selectedTier && (
                  <div className="mt-2 text-xs text-gray-400">
                    ເມື່ອຈັບກຸ່ມສຳເລັດ ຈ່າຍອີກ {formatPrice(selectedPrice - depositAmount)} (成团后补尾款)
                  </div>
                )}
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
                    ກຳລັງດຳເນີນການ...
                  </>
                ) : (
                  <>
                    💰 ຈ່າຍເງິນມັດຈຳ {formatPrice(depositAmount)}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
