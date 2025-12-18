import { Product, GroupBuy } from '@/types';

// 模拟商品数据（用于开发测试）
export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'TWS蓝牙耳机 无线降噪',
    name_lo: 'ຫູຟັງບລູທູດ TWS',
    description: '蓝牙5.3，续航6小时，支持快充，IPX5防水',
    description_lo: 'Bluetooth 5.3, ໃຊ້ໄດ້ 6 ຊົ່ວໂມງ',
    images: [], // 暂时使用占位图，后续上传真实图片到 Supabase Storage
    original_price: 180000, // 180,000 LAK ≈ ¥72
    tiers: [
      { min_people: 1, price: 180000 },
      { min_people: 3, price: 150000 },
      { min_people: 5, price: 120000 },
    ],
    stock: 100,
    category: '3C数码',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: '20000mAh快充充电宝 PD20W',
    name_lo: 'ແບັດສຳຮອງ 20000mAh',
    description: '支持PD20W快充，双向快充，LED电量显示',
    description_lo: 'ສາກໄວ PD20W, ສະແດງແບັດ LED',
    images: [],
    original_price: 280000,
    tiers: [
      { min_people: 1, price: 280000 },
      { min_people: 3, price: 240000 },
      { min_people: 5, price: 200000 },
    ],
    stock: 50,
    category: '3C数码',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'LED化妆镜 三档调光',
    name_lo: 'ແວ່ນແຕ່ງໜ້າ LED',
    description: '72颗LED灯，三档亮度，180°旋转，USB充电',
    description_lo: '72 LED, 3 ລະດັບແສງ, ໝຸນໄດ້ 180°',
    images: [],
    original_price: 120000,
    tiers: [
      { min_people: 1, price: 120000 },
      { min_people: 3, price: 100000 },
      { min_people: 5, price: 80000 },
    ],
    stock: 80,
    category: '美妆工具',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: '迷你挂脖风扇 USB充电',
    name_lo: 'ພັດລົມຄໍ mini',
    description: '三档风速，2000mAh电池，静音设计，可折叠',
    description_lo: '3 ລະດັບລົມ, ແບັດ 2000mAh, ງຽບ',
    images: [],
    original_price: 100000,
    tiers: [
      { min_people: 1, price: 100000 },
      { min_people: 3, price: 85000 },
      { min_people: 5, price: 70000 },
    ],
    stock: 120,
    category: '生活电器',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Type-C快充数据线 1.5米',
    name_lo: 'ສາຍສາກ Type-C 1.5ແມັດ',
    description: '66W快充，尼龙编织，耐弯折10000次',
    description_lo: 'ສາກໄວ 66W, ສາຍຖັກ, ທົນທານ',
    images: [],
    original_price: 50000,
    tiers: [
      { min_people: 1, price: 50000 },
      { min_people: 3, price: 40000 },
      { min_people: 5, price: 30000 },
    ],
    stock: 200,
    category: '3C数码',
    status: 'active',
    created_at: new Date().toISOString(),
  },
];

// 模拟正在进行的拼团
export const mockGroupBuys: GroupBuy[] = [
  {
    id: 'g1',
    product_id: '1',
    product: mockProducts[0],
    current_people: 3,
    target_people: 5,
    current_tier: 1,
    status: 'pending',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24小时后
    created_at: new Date().toISOString(),
  },
  {
    id: 'g2',
    product_id: '2',
    product: mockProducts[1],
    current_people: 2,
    target_people: 5,
    current_tier: 0,
    status: 'pending',
    expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12小时后
    created_at: new Date().toISOString(),
  },
  {
    id: 'g3',
    product_id: '4',
    product: mockProducts[3],
    current_people: 4,
    target_people: 5,
    current_tier: 1,
    status: 'pending',
    expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2小时后（紧急）
    created_at: new Date().toISOString(),
  },
];
