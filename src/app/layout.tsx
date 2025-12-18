import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ຮ້ານຄ້າລາວ - Laos Group Buy",
  description: "ຊື້ເປັນກຸ່ມ ລາຄາຖືກກວ່າ | 拼团购物，价格更优惠",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lo">
      <body className="min-h-screen bg-gray-50">
        {/* 顶部导航 */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="text-2xl">🛒</span>
              <span className="font-bold text-lg text-gray-800">ຮ້ານຄ້າລາວ</span>
            </a>
            <a href="/orders" className="text-gray-600 hover:text-primary-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </a>
          </div>
        </header>

        {/* 主内容 */}
        <main className="max-w-lg mx-auto">
          {children}
        </main>

        {/* 底部 */}
        <footer className="max-w-lg mx-auto px-4 py-6 text-center text-gray-400 text-sm">
          <p>Laos Group Buy</p>
          <p className="mt-1">WhatsApp: +856 20 9606 0666</p>
        </footer>
      </body>
    </html>
  );
}
