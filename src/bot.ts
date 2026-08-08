import { Telegraf, Markup } from 'telegraf';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const MINI_APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  // Extract start payload (e.g. ref_123456789 from /start ref_123456789)
  const startPayload = ctx.startPayload;
  
  // Append referral parameter if available
  const appUrl = startPayload 
    ? `${MINI_APP_URL}?tgWebAppStartParam=${startPayload}`
    : MINI_APP_URL;

  console.log(`Sending WebApp URL to user ${ctx.from.id}:`, appUrl);

  return ctx.reply(
    `Welcome to Capital Tycoon, ${ctx.from.first_name || 'Tycoon'}! 🚀\n\nBuild your business empire, buy luxury assets, and earn status!`,
    Markup.inlineKeyboard([
      [
        Markup.button.webApp('🎮 Play Tycoon', appUrl),
      ],
    ])
  );
});

bot.launch().then(() => console.log('Telegram Bot is running with updated Vercel URL!'));

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));