import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 数据库表结构 SQL（用于在 Supabase 中创建表）
export const DATABASE_SCHEMA = `
-- 商品表
CREATE TABLE IF NOT EXISTS products (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 拼团表
CREATE TABLE IF NOT EXISTS group_buys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  current_people INTEGER DEFAULT 0,
  target_people INTEGER NOT NULL,
  current_tier INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 拼团成员表
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES group_buys(id),
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
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES group_buys(id),
  member_id UUID REFERENCES group_members(id),
  product_id UUID REFERENCES products(id),
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
CREATE INDEX IF NOT EXISTS idx_group_buys_status ON group_buys(status);
CREATE INDEX IF NOT EXISTS idx_group_buys_expires ON group_buys(expires_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_group_members_phone ON group_members(phone);
`;
