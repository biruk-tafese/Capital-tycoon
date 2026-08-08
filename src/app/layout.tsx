import type { Metadata } from 'next';
import Script from 'next/script';
import { Providers } from '../components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Capital Tycoon',
  description: 'Gamified 3D Telegram Mini App',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}