import type { Metadata } from 'next';
import '../lib/suppressThreeWarnings'; //
import { GameProvider } from '../context/GameContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Capital Tycoon',
  description: 'Telegram Mini App Game',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className="bg-blueblack-950 text-white antialiased"
        suppressHydrationWarning
      >
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}