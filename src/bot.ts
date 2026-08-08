import { Telegraf, Markup } from 'telegraf';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const MINI_APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
const REQUIRED_CHANNEL = '@getjob_assistant'; // Channel handle

const bot = new Telegraf(BOT_TOKEN);

/**
 * Helper function to verify if user is subscribed to the channel
 */
async function checkChannelSubscription(ctx: any, userId: number): Promise<boolean> {
  try {
    const member = await ctx.telegram.getChatMember(REQUIRED_CHANNEL, userId);
    const validStatuses = ['creator', 'administrator', 'member'];
    return validStatuses.includes(member.status);
  } catch (error) {
    console.error(`[Channel Check Error] Failed to verify user ${userId}:`, error);
    // Return false if bot is not admin or channel username is invalid
    return false;
  }
}

/**
 * Handle /start command
 */
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const startPayload = ctx.startPayload || ''; // E.g., ref_1234567

  const isSubscribed = await checkChannelSubscription(ctx, userId);

  if (isSubscribed) {
    // User joined -> Build Launch App URL with start parameter if present
    const appUrl = startPayload
      ? `${MINI_APP_URL}?tgWebAppStartParam=${startPayload}`
      : MINI_APP_URL;

    return ctx.reply(
      `Welcome to Capital Tycoon, ${ctx.from.first_name || 'Tycoon'}! 🚀\n\nBuild your business empire, buy luxury assets, and earn status!`,
      Markup.inlineKeyboard([
        [Markup.button.webApp('🎮 Launch Capital Tycoon', appUrl)],
      ])
    );
  }

  // User has NOT joined -> Block access and present Join + Verify buttons
  const checkCallbackData = startPayload ? `check_join:${startPayload}` : 'check_join';

  return ctx.reply(
    `⚠️ **Channel Join Required!**\n\nTo access Capital Tycoon, you must join our official updates channel first:\n👉 https://t.me/getjob_assistant\n\nAfter joining, click **"✅ Verify & Continue"** below!`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.url('📢 Join Channel', '@getjob_assistant')],
        [Markup.button.callback('✅ Verify & Continue', checkCallbackData)],
      ]),
    }
  );
});

/**
 * Handle "Verify & Continue" button callback
 */
bot.action(/^check_join(?::(.+))?$/, async (ctx) => {
  const userId = ctx.from.id;
  const startPayload = ctx.match[1] || ''; // Retrieve original referral parameter if present

  const isSubscribed = await checkChannelSubscription(ctx, userId);

  if (isSubscribed) {
    await ctx.answerCbQuery('✅ Channel membership verified!');

    const appUrl = startPayload
      ? `${MINI_APP_URL}?tgWebAppStartParam=${startPayload}`
      : MINI_APP_URL;

    // Replace the message with the launch button
    return ctx.editMessageText(
      `🎉 **Verification Successful!**\n\nWelcome aboard, ${ctx.from.first_name || 'Tycoon'}! Click below to start building your empire.`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.webApp('🎮 Play Capital Tycoon', appUrl)],
        ]),
      }
    );
  } else {
    // Answer query popup alert inside Telegram
    return ctx.answerCbQuery(
      '❌ You have not joined the channel yet. Please join @getjob_assistant and try again!',
      { show_alert: true }
    );
  }
});

bot.launch().then(() => {
  console.log('Telegram Bot is running with channel verification!');
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));