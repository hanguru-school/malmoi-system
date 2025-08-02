import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import ProductionOnly from '@/components/ProductionOnly';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MalMoi 한국어 교실',
  description: '스마트한 한국어 학습을 시작하세요',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Providers>
          <ProductionOnly>
            {children}
          </ProductionOnly>
        </Providers>
      </body>
    </html>
  );
}
