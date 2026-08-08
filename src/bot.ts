import { Telegraf, Markup } from 'telegraf';

// Replace with your Telegram Bot Token from @BotFather
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const MINI_APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  return ctx.reply(
    `Welcome to Capital Tycoon! 🚀\n\nBuild your business empire, buy luxury assets, and earn TON crypto!`,
    Markup.inlineKeyboard([
      [
        // This webApp button opens your Next.js Mini App inside Telegram
        Markup.button.webApp('🎮 Launch Capital Tycoon', MINI_APP_URL),
      ],
    ])
  );
});

bot.launch().then(() => console.log('Telegram Bot is running!'));