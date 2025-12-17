'use client';

import { PriceTier } from '@/types';
import { formatPrice } from '@/lib/utils';

interface PriceTiersProps {
  tiers: PriceTier[];
  currentPeople: number;
  originalPrice: number;
}

export default function PriceTiers({ tiers, currentPeople, originalPrice }: PriceTiersProps) {

  // 找到当前激活的价格档位
  const getCurrentTierIndex = () => {
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (currentPeople >= tiers[i].min_people) {
        return i;
      }
    }
    return -1;
  };

  const currentTierIndex = getCurrentTierIndex();

  return (
    <div className="space-y-2">
      {/* 原价 */}
      <div className="flex items-center gap-2 text-gray-400">
        <span className="text-sm">ລາຄາເດີມ (原价):</span>
        <span className="line-through">{formatPrice(originalPrice)}</span>
      </div>

      {/* 阶梯价格 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tiers.map((tier, index) => {
          const isActive = currentPeople >= tier.min_people;
          const isCurrent = index === currentTierIndex;
          const discount = Math.round((1 - tier.price / originalPrice) * 100);

          return (
            <div
              key={index}
              className={`
                flex-shrink-0 p-3 rounded-lg border-2 min-w-[100px] text-center
                transition-all duration-300
                ${isCurrent
                  ? 'border-primary-500 bg-primary-50 progress-active'
                  : isActive
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }
              `}
            >
              <div className="text-xs text-gray-500 mb-1">
                {tier.min_people}ຄົນ ({tier.min_people}人)
              </div>
              <div className={`font-bold text-lg ${isCurrent ? 'text-primary-500' : isActive ? 'text-green-600' : 'text-gray-700'}`}>
                {formatPrice(tier.price)}
              </div>
              <div className={`text-xs ${isCurrent ? 'text-primary-400' : 'text-gray-400'}`}>
                -{discount}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
