
'use client';

export { useTelegramGame } from '../context/GameContext';














// 'use client';

// import { useState, useEffect, useCallback } from 'react';
// import { PlayerService } from '../services/playerService';
// import { ShopItem } from '../types/store';

// // Helper function to safely extract user from raw initData string if initDataUnsafe is empty
// function parseUserFromInitData(initData: string) {
//   try {
//     const searchParams = new URLSearchParams(initData);
//     const userStr = searchParams.get('user');
//     if (userStr) {
//       return JSON.parse(decodeURIComponent(userStr));
//     }
//   } catch (e) {
//     console.error('Failed to parse initData user payload:', e);
//   }
//   return null;
// }

// export function useTelegramGame() {
//   const [telegramId, setTelegramId] = useState<string | null>(null);
//   const [balance, setBalance] = useState<number>(0);
//   const [status, setStatus] = useState<number>(0);
//   const [inventory, setInventory] = useState<string[]>([]);
//   const [lang, setLang] = useState<'en' | 'am'>('en');
//   const [loading, setLoading] = useState<boolean>(true);

//   useEffect(() => {
//     const initApp = async () => {
//       let rawUserId: string | null = null;
//       let userFirstName = '';
//       let userUsername = '';
//       let referrerId: string | undefined;

//       // Poll up to 15 times (3 seconds max) to allow Telegram SDK to hydrate
//       let retries = 0;
//       while (retries < 15) {
//         if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
//           const tg = window.Telegram.WebApp;
//           tg.ready();
//           tg.expand();

//           // 1. Primary check: Extract from initDataUnsafe
//           let user = tg.initDataUnsafe?.user;

//           // 2. Fallback check: Parse raw initData query string
//           if (!user?.id && tg.initData) {
//             user = parseUserFromInitData(tg.initData);
//           }

//           if (user?.id) {
//             rawUserId = String(user.id);
//             userFirstName = user.first_name || '';
//             userUsername = user.username || '';

//             // Referral check
//             let startParam = tg.initDataUnsafe?.start_param || '';
//             if (!startParam) {
//               const urlParams = new URLSearchParams(window.location.search);
//               startParam =
//                 urlParams.get('tgWebAppStartParam') ||
//                 urlParams.get('startapp') ||
//                 urlParams.get('start_param') ||
//                 '';
//             }

//             if (startParam.startsWith('ref_')) {
//               referrerId = startParam.replace('ref_', '').trim();
//             }
//             break; // User successfully detected
//           }
//         }
//         await new Promise((res) => setTimeout(res, 200));
//         retries++;
//       }

//       if (!rawUserId) {
//         console.warn('[useTelegramGame] No active Telegram session detected.');
//         setLoading(false);
//         return;
//       }

//       setTelegramId(rawUserId);

//       try {
//         const player = await PlayerService.getOrCreatePlayer(
//           {
//             id: rawUserId,
//             first_name: userFirstName,
//             username: userUsername,
//           },
//           referrerId
//         );

//         let currentBalance = Number(player?.balance || 0);
//         setStatus(Number(player?.status_points || 0));
//         setLang((player?.language as 'en' | 'am') || 'en');

//         // Referral processing
//         if (referrerId && !player?.referred_by) {
//           const refResult = await PlayerService.processReferralBonus(rawUserId, referrerId);
//           if (refResult?.success && refResult?.reward_amount) {
//             currentBalance += Number(refResult.reward_amount);
//           }
//         }

//         setBalance(currentBalance);

//         const ownedItemIds = await PlayerService.getPlayerInventory(rawUserId);
//         setInventory(ownedItemIds || []);
//       } catch (err: any) {
//         // Explicitly extract error properties so it doesn't log as an empty {}
//         console.error('Failed to sync player state:', {
//           message: err?.message || 'Unknown network error',
//           details: err?.details || err?.hint || err,
//         });
//       } finally {
//         setLoading(false);
//       }
//     };

//     initApp();
//   }, []);

//   const triggerHaptic = useCallback((style: 'light' | 'medium' | 'heavy' = 'medium') => {
//     if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
//       try {
//         window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
//       } catch (e) {
//         // Browser fallback
//       }
//     }
//   }, []);

//   const executePurchase = async (item: ShopItem) => {
//     if (!telegramId) return { success: false, error: 'NO_TELEGRAM_ID' };

//     try {
//       const result = await PlayerService.purchaseItem(telegramId, item);

//       if (result.success) {
//         setBalance((prev) => Math.max(0, prev - Number(item.price)));
//         setStatus((prev) => prev + Number(item.statusBoost));
//         setInventory((prev) => [...prev, item.id]);
//         triggerHaptic('heavy');
//       }

//       return result;
//     } catch (err: any) {
//       console.error('Purchase failed:', err?.message || err);
//       return { success: false, error: 'SERVER_ERROR' };
//     }
//   };

//   return {
//     telegramId,
//     balance,
//     status,
//     inventory,
//     lang,
//     setLang,
//     loading,
//     triggerHaptic,
//     executePurchase,
//   };
// }