# 数据库表结构

## Supabase 项目信息
- Project Ref: `tibkojeqnpvcddevsqsm`
- URL: `https://tibkojeqnpvcddevsqsm.supabase.co`

## 建表SQL

```sql
-- 商品表
CREATE TABLE IF NOT EXISTS gb_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_lo TEXT,
  description TEXT,
  description_lo TEXT,
  images TEXT[] DEFAULT '{}',
  original_price DECIMAL(12,2) NOT NULL,
  tiers JSONB NOT NULL DEFAULT '[]',
  stock INTEGER DEFAULT 0,
  category TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 拼团表
CREATE TABLE IF NOT EXISTS gb_group_buys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES gb_products(id),
  current_people INTEGER DEFAULT 0,
  target_people INTEGER NOT NULL,
  current_tier INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 拼团成员表
CREATE TABLE IF NOT EXISTS gb_group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES gb_group_buys(id),
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  deposit_paid BOOLEAN DEFAULT FALSE,
  deposit_amount DECIMAL(12,2) DEFAULT 0,
  final_paid BOOLEAN DEFAULT FALSE,
  final_amount DECIMAL(12,2) DEFAULT 0,
  payment_method TEXT DEFAULT 'bcel',
  payment_reference TEXT,
  status TEXT DEFAULT 'joined',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 订单表
CREATE TABLE IF NOT EXISTS gb_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES gb_group_buys(id),
  member_id UUID REFERENCES gb_group_members(id),
  product_id UUID REFERENCES gb_products(id),
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  deposit_amount DECIMAL(12,2) NOT NULL,
  final_amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'pending_deposit',
  shipping_status TEXT,
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_gb_products_status ON gb_products(status);
CREATE INDEX IF NOT EXISTS idx_gb_group_buys_status ON gb_group_buys(status);
CREATE INDEX IF NOT EXISTS idx_gb_group_buys_expires ON gb_group_buys(expires_at);
CREATE INDEX IF NOT EXISTS idx_gb_orders_status ON gb_orders(status);
CREATE INDEX IF NOT EXISTS idx_gb_group_members_phone ON gb_group_members(phone);
```

## 表结构

### gb_products (商品表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | TEXT | 商品名称（中文） |
| name_lo | TEXT | 商品名称（老挝语） |
| description | TEXT | 商品描述（中文） |
| description_lo | TEXT | 商品描述（老挝语） |
| images | TEXT[] | 图片URL数组 |
| original_price | DECIMAL(12,2) | 原价（LAK） |
| tiers | JSONB | 阶梯价格，格式: [{"min_people": 1, "price": 180000}, ...] |
| stock | INTEGER | 库存 |
| category | TEXT | 分类 |
| status | TEXT | 状态: active/inactive |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### gb_group_buys (拼团表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| product_id | UUID | 关联商品ID |
| current_people | INTEGER | 当前参团人数 |
| target_people | INTEGER | 目标人数 |
| current_tier | INTEGER | 当前价格档位 |
| status | TEXT | 状态: pending/success/failed/expired |
| expires_at | TIMESTAMP | 过期时间 |
| created_at | TIMESTAMP | 创建时间 |

### gb_group_members (拼团成员表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| group_id | UUID | 关联拼团ID |
| phone | TEXT | 手机号 |
| name | TEXT | 姓名 |
| address | TEXT | 地址 |
| deposit_paid | BOOLEAN | 是否已付定金 |
| deposit_amount | DECIMAL | 定金金额 |
| final_paid | BOOLEAN | 是否已付尾款 |
| final_amount | DECIMAL | 尾款金额 |
| payment_method | TEXT | 支付方式: bcel/transfer/cod |
| payment_reference | TEXT | 支付参考号 |
| status | TEXT | 状态: joined/paid_deposit/paid_full/refunded/cancelled |
| created_at | TIMESTAMP | 创建时间 |

### gb_orders (订单表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| group_id | UUID | 关联拼团ID |
| member_id | UUID | 关联成员ID |
| product_id | UUID | 关联商品ID |
| quantity | INTEGER | 数量 |
| unit_price | DECIMAL | 单价 |
| total_price | DECIMAL | 总价 |
| deposit_amount | DECIMAL | 定金 |
| final_amount | DECIMAL | 尾款 |
| status | TEXT | 状态 |
| shipping_status | TEXT | 物流状态 |
| tracking_number | TEXT | 物流单号 |
| notes | TEXT | 备注 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

## 索引
- idx_gb_products_status
- idx_gb_group_buys_status
- idx_gb_group_buys_expires
- idx_gb_orders_status
- idx_gb_group_members_phone
