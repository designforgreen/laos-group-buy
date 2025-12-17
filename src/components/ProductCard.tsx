'use client';

import Link from 'next/link';
import { Product, GroupBuy } from '@/types';
import { formatPrice } from '@/lib/utils';
import CountdownTimer from './CountdownTimer';

interface ProductCardProps {
  product: Product;
  groupBuy?: GroupBuy;
}

export default function ProductCard({ product, groupBuy }: ProductCardProps) {

  // 获取最低拼团价
  const lowestPrice = product.tiers.length > 0
    ? Math.min(...product.tiers.map(t => t.price))
    : product.original_price;

  // 计算折扣
  const discount = Math.round((1 - lowestPrice / product.original_price) * 100);

  return (
    <Link href={`/group/${groupBuy?.id || 'new'}?product=${product.id}`}>
      <div className="card hover:shadow-lg transition-shadow duration-300">
        {/* 商品图片 */}
        <div className="relative aspect-square bg-gray-100">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* 折扣标签 */}
          {discount > 0 && (
            <div className="absolute top-2 left-2 bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded">
              -{discount}%
            </div>
          )}

          {/* 拼团状态 */}
          {groupBuy && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <div className="flex items-center justify-between text-white text-xs">
                <div className="flex items-center gap-1">
                  <span className="font-bold">👥 {groupBuy.current_people}/{groupBuy.target_people}</span>
                  {groupBuy.is_official && (
                    <span className="bg-yellow-500 text-white px-1 py-0.5 rounded text-[10px]">官方</span>
                  )}
                </div>
                <CountdownTimer expiresAt={groupBuy.expires_at} />
              </div>
              {/* 进度条 */}
              <div className="mt-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${(groupBuy.current_people / groupBuy.target_people) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 商品信息 */}
        <div className="p-3">
          <h3 className="font-medium text-gray-800 line-clamp-2 mb-2">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2">
            <span className="text-primary-500 font-bold text-xl">
              {formatPrice(lowestPrice)}
            </span>
            <span className="text-gray-400 text-sm line-through">
              {formatPrice(product.original_price)}
            </span>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            {product.tiers.length > 0 && (
              <span>{product.tiers[product.tiers.length - 1].min_people}ຄົນ ລາຄານີ້ ({product.tiers[product.tiers.length - 1].min_people}人成团)</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
