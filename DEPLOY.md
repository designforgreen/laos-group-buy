# 部署指南 (Deployment Guide)

## 快速开始 (Quick Start)

### 步骤 1: 准备 GitHub 仓库

```bash
# 1. 在 GitHub 上创建新仓库
# 访问 https://github.com/new
# 仓库名: laos-group-buy
# 可见性: Private (推荐) 或 Public

# 2. 推送代码到 GitHub
git remote add origin https://github.com/YOUR_USERNAME/laos-group-buy.git
git push -u origin main
```

### 步骤 2: 部署到 Vercel

#### 选项 A: 网页部署（推荐，最简单）

1. **访问 Vercel**
   - 打开 https://vercel.com
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 选择你的 GitHub 仓库 `laos-group-buy`
   - 点击 "Import"

3. **配置项目**
   - Framework Preset: Next.js (自动检测)
   - Root Directory: `./` (保持默认)
   - Build Command: `npm run build` (保持默认)
   - Output Directory: `.next` (保持默认)

4. **添加环境变量**
   点击 "Environment Variables"，添加：

   ```
   NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...your-key
   ```

   ⚠️ 从 Supabase Dashboard → Settings → API 复制这些值

5. **部署**
   - 点击 "Deploy" 按钮
   - 等待 2-3 分钟
   - 完成后会显示部署 URL，例如：`https://laos-group-buy.vercel.app`

#### 选项 B: CLI 部署

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel

# 4. 添加环境变量（首次部署后）
vercel env add NEXT_PUBLIC_SUPABASE_URL
# 输入值后按回车

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# 输入值后按回车

# 5. 重新部署以应用环境变量
vercel --prod
```

### 步骤 3: 配置 Supabase

#### 3.1 创建 Storage 桶

1. 访问 Supabase Dashboard → Storage
2. 点击 "New bucket"
3. 配置：
   - Name: `payment-proofs`
   - Public: ✅ (勾选)
   - File size limit: 5 MB
   - Allowed MIME types: `image/jpeg, image/png, image/jpg`
4. 点击 "Create bucket"

#### 3.2 设置 Storage RLS 策略

在 SQL Editor 中运行：

```sql
-- 允许所有人上传到 payment-proofs 桶
CREATE POLICY "Anyone can upload payment proofs"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'payment-proofs');

-- 允许所有人读取 payment-proofs 桶的文件
CREATE POLICY "Anyone can read payment proofs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment-proofs');
```

#### 3.3 添加管理员账号

在 SQL Editor 中运行：

```sql
-- 添加你的管理员账号
INSERT INTO gb_admins (email, name, role)
VALUES ('your-email@example.com', 'Your Name', 'super_admin');
```

#### 3.4 更新支付配置

1. 上传你的 QR 码到 `/public/images/qr-code.png`
2. 在 SQL Editor 更新支付信息：

```sql
-- 更新银行账号信息
UPDATE gb_payment_config
SET
  bank_name = 'BCEL Bank',
  account_number = '你的账号',
  account_name = '你的户名'
WHERE payment_type = 'bank_transfer';
```

### 步骤 4: 测试部署

1. **访问你的网站**
   - 打开 Vercel 提供的 URL
   - 例如：`https://laos-group-buy.vercel.app`

2. **测试管理员登录**
   - 访问 `your-url/admin/login`
   - 使用你添加的管理员邮箱登录

3. **测试完整流程**
   - 浏览商品
   - 加入拼团
   - 上传支付凭证
   - 管理员审核支付

## 自定义域名（可选）

### 在 Vercel 中添加域名

1. 进入 Vercel 项目 → Settings → Domains
2. 输入你的域名，例如：`shop.yourdomain.com`
3. 按照提示配置 DNS：
   - Type: `CNAME`
   - Name: `shop` (或 `@` 用于根域名)
   - Value: `cname.vercel-dns.com`

4. 等待 DNS 生效（通常 5-30 分钟）

## 持续部署

配置完成后，每次 `git push` 到 GitHub：
- Vercel 自动检测并部署
- 约 2-3 分钟完成
- 自动更新到生产环境

## 监控和日志

### Vercel Dashboard
- 访问: https://vercel.com/dashboard
- 查看：
  - 部署历史
  - 构建日志
  - 错误日志
  - 访问统计

### Supabase Dashboard
- 访问: https://supabase.com/dashboard
- 查看：
  - 数据库查询
  - API 使用统计
  - Storage 使用情况

## 故障排除

### 构建失败

```bash
# 本地测试构建
npm run build

# 查看错误信息
# 修复后重新部署
git add .
git commit -m "Fix build error"
git push
```

### 环境变量未生效

1. 检查 Vercel Dashboard → Settings → Environment Variables
2. 确保变量名正确（注意大小写）
3. 重新部署：Deployments → 最新部署 → Redeploy

### 数据库连接失败

1. 检查 Supabase URL 是否正确
2. 检查 Anon Key 是否正确
3. 确认 Supabase 项目状态正常

### 图片无法加载

1. 检查 `/public/images/qr-code.png` 是否存在
2. 清除浏览器缓存
3. 检查 Vercel 部署日志

## 性能优化建议

### 图片优化
- 使用 WebP 格式
- 压缩图片大小 < 500KB
- 使用 Next.js Image 组件

### 数据库优化
- 添加常用查询的索引
- 定期清理过期数据
- 使用 Supabase 的 Connection Pooling

### CDN 加速
- Vercel 自动使用全球 CDN
- 静态资源自动缓存
- 推荐使用新加坡节点（离老挝最近）

## 成本估算

| 服务 | 免费额度 | 付费 |
|------|---------|------|
| **Vercel** | 100GB 带宽/月<br/>100 次构建/天 | $20/月起 |
| **Supabase** | 500MB 数据库<br/>1GB 存储<br/>2GB 带宽 | $25/月起 |
| **总计** | **完全免费**（适合前期） | $45/月起 |

前期用户量少时，完全免费额度足够使用！

## 下一步

- [ ] 配置自定义域名
- [ ] 设置备份策略
- [ ] 添加监控告警
- [ ] 优化 SEO
- [ ] 添加 Google Analytics

## 支持

有问题？
- 查看 README.md
- 检查 Vercel 文档: https://vercel.com/docs
- 检查 Supabase 文档: https://supabase.com/docs
