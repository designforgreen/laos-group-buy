import { notFound } from 'next/navigation';
import { getGroupBuy, getProduct, getOrCreateGroupBuy, getProductGroupBuys } from '@/lib/db';
import GroupPageClient from './GroupPageClient';

export const runtime = 'edge';

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { product?: string };
}) {
  const groupId = params.id;
  const productId = searchParams.product;

  // 从数据库获取拼团数据
  let groupBuy = null;
  let product = null;
  let allGroupBuys = [];

  if (groupId !== 'new') {
    // 如果有指定团ID，获取该团
    groupBuy = await getGroupBuy(groupId);
    if (groupBuy) {
      product = groupBuy.product;
    }
  }

  // 如果没有拼团数据，尝试获取商品
  if (!product && productId) {
    product = await getProduct(productId);
  }

  // 如果都没有，返回404
  if (!product) {
    notFound();
  }

  // 如果没有指定团，智能获取或创建推荐拼团
  if (!groupBuy) {
    groupBuy = await getOrCreateGroupBuy(product.id);
  }

  // 获取该商品的所有进行中拼团
  allGroupBuys = await getProductGroupBuys(product.id);

  // 如果智能创建失败，创建临时数据
  const currentGroup = groupBuy || {
    id: 'new',
    product_id: product.id,
    current_people: 0,
    target_people: product.tiers[product.tiers.length - 1]?.min_people || 5,
    status: 'pending',
    expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  };

  return <GroupPageClient product={product} groupBuy={currentGroup} allGroupBuys={allGroupBuys} />;
}
