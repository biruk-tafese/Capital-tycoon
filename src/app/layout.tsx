import type { Metadata } from 'next';
import Script from 'next/script';
import Providers from '../components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Capital Tycoon',
  description: 'Build your business empire',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* CRITICAL: Load Telegram WebApp SDK before Next.js initializes */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-slate-950 text-white min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}