import ProductCard from '@/components/ProductCard';
import { getProducts, getRecommendedGroupBuy } from '@/lib/db';

export const revalidate = 60; // 每60秒重新验证

export default async function Home() {
  // 从数据库获取数据
  const products = await getProducts();

  // 为每个商品获取推荐拼团
  const productsWithGroupBuys = await Promise.all(
    products.map(async (product) => {
      const recommendedGroupBuy = await getRecommendedGroupBuy(product.id);
      return {
        ...product,
        recommendedGroupBuy,
      };
    })
  );

  return (
    <div className="px-4 py-6">
      {/* 全部商品 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            🛍️ ສິນຄ້າທັງໝົດ (全部商品)
          </h2>
          <span className="text-sm text-gray-500">{productsWithGroupBuys.length} ລາຍການ</span>
        </div>

        {productsWithGroupBuys.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {productsWithGroupBuys.map((item: any) => (
              <ProductCard
                key={item.id}
                product={item}
                groupBuy={item.recommendedGroupBuy}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p>暂无商品</p>
            <p className="text-sm mt-2">请在后台添加商品</p>
          </div>
        )}
      </section>

      {/* 底部提示 */}
      <div className="mt-8 p-4 bg-primary-50 rounded-lg text-center">
        <p className="text-sm text-primary-700">
          💡 ຈັບກຸ່ມຫຼາຍຄົນ ລາຄາຖືກກວ່າ!
        </p>
        <p className="text-xs text-primary-500 mt-1">
          人越多价格越低，邀请朋友一起拼！
        </p>
      </div>
    </div>
  );
}
