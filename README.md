# 🤝 ຮ່ວມກັນ · Together (一起买)

老挝拼团购物平台 - 支持中文/老挝语双语

Laos Group Buy Platform

## 功能特性

- ✅ 商品拼团系统
- ✅ 阶梯价格（人越多价格越低）
- ✅ 定金+尾款支付模式
- ✅ QR码/银行转账支付
- ✅ 支付凭证上传+管理员审核
- ✅ 订单查询（通过电话号码）
- ✅ 管理员后台
- ✅ 中文/老挝语双语界面

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **存储**: Supabase Storage (支付凭证图片)
- **部署**: Vercel

## 本地开发

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
复制 `.env.local.example` 为 `.env.local`：
```bash
cp .env.local.example .env.local
```

编辑 `.env.local` 填入你的 Supabase 配置：
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 初始化数据库
在 Supabase SQL Editor 中运行 `database/migrations.sql`

### 4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

## 部署到 Vercel

### 方式一：通过 GitHub（推荐）

1. **推送代码到 GitHub**
   ```bash
   # 在 GitHub 创建新仓库后
   git remote add origin https://github.com/your-username/laos-group-buy.git
   git push -u origin main
   ```

2. **导入到 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "Add New Project"
   - 导入你的 GitHub 仓库
   - Vercel 会自动检测 Next.js 项目

3. **配置环境变量**
   在 Vercel 项目设置中添加：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **部署**
   - 点击 "Deploy" 按钮
   - 等待部署完成（约 2-3 分钟）
   - 获得部署 URL

### 方式二：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel
```

## 配置 Supabase Storage

创建存储桶用于支付凭证：

1. 在 Supabase Dashboard → Storage
2. 创建新桶: `payment-proofs`
3. 设置为 Public（允许读取）
4. RLS 策略：
   - 任何人可以上传
   - 任何人可以读取

## 管理员设置

在 Supabase SQL Editor 中添加管理员：

```sql
INSERT INTO gb_admins (email, name, role)
VALUES ('your-email@example.com', 'Admin Name', 'super_admin');
```

然后使用该邮箱在 `/admin/login` 登录。

## 项目结构

```
laos-group-buy/
├── src/
│   ├── app/              # Next.js App Router 页面
│   │   ├── admin/        # 管理员后台
│   │   ├── group/        # 拼团页面
│   │   ├── payment/      # 支付页面
│   │   ├── order/        # 订单详情
│   │   └── orders/       # 订单查询
│   ├── components/       # 可复用组件
│   ├── lib/             # 工具函数和配置
│   └── types/           # TypeScript 类型
├── public/
│   └── images/          # 静态资源（QR码等）
├── database/
│   └── migrations.sql   # 数据库迁移脚本
└── ...
```

## 环境变量说明

| 变量 | 说明 | 必需 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | ✅ |
| `NEXT_PUBLIC_APP_URL` | 应用 URL（用于回调） | ❌ |
| `NEXT_PUBLIC_DEPOSIT_PERCENTAGE` | 定金比例（默认 30%） | ❌ |

## 常见问题

### Q: 如何更换支付二维码？
A: 替换 `/public/images/qr-code.png`，然后在 Supabase 更新 `gb_payment_config` 表。

### Q: 如何修改定金比例？
A: 修改 `.env.local` 中的 `NEXT_PUBLIC_DEPOSIT_PERCENTAGE`。


### Q: 如何添加新管理员？
A: 在 Supabase SQL Editor 中运行：
```sql
INSERT INTO gb_admins (email, name, role)
VALUES ('new-admin@example.com', 'Admin Name', 'admin');
```

## License

MIT
