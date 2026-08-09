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
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-slate-950 text-white min-h-screen" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}