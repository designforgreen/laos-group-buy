-- ==================== 拼团系统数据库迁移记录 ====================
-- 项目：Laos Group Buy Platform
-- 数据库前缀：gb_ (group buy)

-- ==================== 1. 商品表 ====================
CREATE TABLE IF NOT EXISTS gb_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_lo TEXT, -- 老挝语名称
  description TEXT,
  description_lo TEXT, -- 老挝语描述
  images TEXT[] DEFAULT '{}', -- 图片URL数组
  original_price DECIMAL(10, 2) NOT NULL, -- 原价（LAK）
  tiers JSONB DEFAULT '[]', -- 阶梯价格 [{"min_people": 5, "price": 80000}, ...]
  stock INT DEFAULT 0,
  category TEXT,
  status TEXT DEFAULT 'active', -- active/inactive
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_status ON gb_products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON gb_products(category);

COMMENT ON TABLE gb_products IS '商品表';
COMMENT ON COLUMN gb_products.tiers IS '阶梯价格JSON: [{"min_people": 5, "price": 80000}]';


-- ==================== 2. 拼团表 ====================
CREATE TABLE IF NOT EXISTS gb_group_buys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES gb_products(id) ON DELETE CASCADE,
  current_people INT DEFAULT 0,
  target_people INT NOT NULL,
  current_tier INT DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending/success/failed/expired
  expires_at TIMESTAMPTZ NOT NULL,
  is_official BOOLEAN DEFAULT FALSE, -- 是否官方团
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_buys_product_id ON gb_group_buys(product_id);
CREATE INDEX IF NOT EXISTS idx_group_buys_status ON gb_group_buys(status);
CREATE INDEX IF NOT EXISTS idx_group_buys_expires_at ON gb_group_buys(expires_at);

COMMENT ON TABLE gb_group_buys IS '拼团表';
COMMENT ON COLUMN gb_group_buys.is_official IS '官方发起的团';


-- ==================== 3. 拼团成员表 ====================
CREATE TABLE IF NOT EXISTS gb_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES gb_group_buys(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  deposit_paid BOOLEAN DEFAULT FALSE,
  deposit_amount DECIMAL(10, 2) NOT NULL,
  final_paid BOOLEAN DEFAULT FALSE,
  final_amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT, -- bcel/transfer/cod
  payment_reference TEXT,
  status TEXT DEFAULT 'joined', -- joined/paid_deposit/paid_full/refunded/cancelled
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON gb_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_phone ON gb_group_members(phone);
CREATE INDEX IF NOT EXISTS idx_group_members_status ON gb_group_members(status);

COMMENT ON TABLE gb_group_members IS '拼团成员表';


-- ==================== 4. 订单表 ====================
CREATE TABLE IF NOT EXISTS gb_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES gb_group_buys(id),
  member_id UUID NOT NULL REFERENCES gb_group_members(id),
  product_id UUID NOT NULL REFERENCES gb_products(id),
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  deposit_amount DECIMAL(10, 2) NOT NULL,
  final_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending_deposit', -- pending_deposit/deposit_paid/pending_final/paid/shipped/delivered/refunded/cancelled
  payment_status TEXT DEFAULT 'pending', -- pending/pending_verify/verified/rejected
  payment_proof_url TEXT, -- 支付凭证截图URL
  shipping_status TEXT, -- pending/shipped/in_transit/delivered
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_group_id ON gb_orders(group_id);
CREATE INDEX IF NOT EXISTS idx_orders_member_id ON gb_orders(member_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON gb_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON gb_orders(payment_status);

COMMENT ON TABLE gb_orders IS '订单表';


-- ==================== 5. 支付配置表 ====================
CREATE TABLE IF NOT EXISTS gb_payment_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_type TEXT NOT NULL, -- 'qrcode' 或 'bank_transfer'
  title TEXT NOT NULL, -- 支付方式标题
  title_lo TEXT, -- 老挝语标题
  qr_code_url TEXT, -- 收款码图片URL
  bank_name TEXT, -- 银行名称
  account_number TEXT, -- 账号
  account_name TEXT, -- 户名
  instructions TEXT, -- 说明
  instructions_lo TEXT, -- 老挝语说明
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入默认配置
INSERT INTO gb_payment_config (payment_type, title, title_lo, instructions, instructions_lo, display_order, qr_code_url)
VALUES
  ('qrcode', 'BCEL OnePay 扫码支付', 'ສະແກນ QR ຈ່າຍເງິນ', '请扫描二维码完成支付，支付时请备注订单号', 'ກະລຸນາສະແກນ QR code ແລະ ໃສ່ເລກອໍເດີໃນໝາຍເຫດ', 1, '/images/qr-code.png'),
  ('bank_transfer', '银行转账', 'ໂອນເງິນຜ່ານທະນາຄານ', '请转账到以下账户，并在备注中填写订单号', 'ກະລຸນາໂອນເງິນໄປບັນຊີດ້ານລຸ່ມ ແລະ ໃສ່ເລກອໍເດີໃນໝາຍເຫດ', 2, NULL)
ON CONFLICT DO NOTHING;

-- 更新银行转账账户信息
UPDATE gb_payment_config
SET
  bank_name = 'BCEL Bank',
  account_number = '1234567890',
  account_name = 'Your Company Name'
WHERE payment_type = 'bank_transfer';

COMMENT ON TABLE gb_payment_config IS '支付配置表';


-- ==================== 6. 支付凭证表 ====================
CREATE TABLE IF NOT EXISTS gb_payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES gb_orders(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES gb_group_members(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL, -- 'qrcode' 或 'bank_transfer'
  proof_image_url TEXT NOT NULL, -- 截图URL
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending/verified/rejected
  admin_note TEXT, -- 管理员备注
  verified_by TEXT, -- 审核人邮箱
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_proofs_order_id ON gb_payment_proofs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_status ON gb_payment_proofs(status);

COMMENT ON TABLE gb_payment_proofs IS '支付凭证表';


-- ==================== 7. 管理员白名单表 ====================
CREATE TABLE IF NOT EXISTS gb_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin', -- admin, super_admin
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_gb_admins_email ON gb_admins(email);

-- 插入第一个管理员（请替换为您的邮箱）
INSERT INTO gb_admins (email, name, role)
VALUES ('admin@example.com', 'Admin', 'super_admin')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE gb_admins IS '拼团系统管理员白名单';


-- ==================== 说明 ====================
-- 1. 所有表都使用 gb_ 前缀，避免与其他项目冲突
-- 2. 价格单位：LAK（老挝基普）
-- 3. 时区：所有时间戳使用 TIMESTAMPTZ
-- 4. 软删除：商品使用 status='inactive'
-- 5. 支付流程：
--    - 用户下单 → 创建订单（status=pending_deposit）
--    - 上传凭证 → payment_status=pending_verify
--    - 管理员审核 → payment_status=verified, status=deposit_paid
-- 6. 拼团流程：
--    - 创建拼团 → status=pending
--    - 人数达标 → status=success
--    - 超时未满 → status=expired
