import {
  AdMob,
  AdOptions,
  RewardAdPluginEvents,
  AdMobRewardItem,
  RewardAdOptions,
  AdmobConsentDebugGeography,
  AdmobConsentStatus,
  RewardInterstitialAdOptions
} from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { userService } from './userService';

export const ADMOB_CONFIG = {
  isTesting: false, // Mude para false em produção
  rewardUnitId: 'ca-app-pub-8908695655155734/3818568263',
  rewardUnitIdTesting: 'ca-app-pub-3940256099942544/5224354917',
  rewardInterstitialId: 'ca-app-pub-8908695655155734/9208595934',
  interstitialUnitId: 'ca-app-pub-8908695655155734/8402231989',
};

export const admobService = {
  isWeb: Capacitor.getPlatform() === 'web',

  getRewardId: () => ADMOB_CONFIG.isTesting ? ADMOB_CONFIG.rewardUnitIdTesting : ADMOB_CONFIG.rewardUnitId,

  checkUserPlan: async (): Promise<boolean> => {
    try {
      const profile = await userService.getProfileData();
      // Se o plano não for FREE, retorna true (pago)
      return profile?.plan?.planId !== 'FREE';
    } catch (error) {
      console.error('Error checking user plan:', error);
      return false;
    }
  },

  initialize: async () => {
    if (Capacitor.getPlatform() === 'web') {
      return;
    }

    try {
      await AdMob.initialize();

      // Solicita consentimento apenas se necessário (GDPR/LGPD)
      const consentInfo = await AdMob.requestConsentInfo({
        debugGeography: AdmobConsentDebugGeography.NOT_EEA,
      });

      if (
        consentInfo.isConsentFormAvailable &&
        consentInfo.status === AdmobConsentStatus.REQUIRED
      ) {
        await AdMob.showConsentForm();
      }
    } catch (error) {
      console.error('Error initializing AdMob:', error);
    }
  },

  showRewardedAd: async (): Promise<AdMobRewardItem | null> => {
    if (Capacitor.getPlatform() === 'web') {
      return null;
    }

    return new Promise(async (resolve, reject) => {
      const handles: any[] = [];

      const cleanup = async () => {
        for (const handle of handles) {
          if (handle && typeof handle.remove === 'function') {
            await handle.remove();
          }
        }
      };

      try {
        handles.push(await AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
          console.log('Rewarded ad loaded');
        }));

        handles.push(await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (err) => {
          console.warn('Rewarded failed to load', err);
          cleanup();
          reject(err);
        }));

        handles.push(await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
          console.log('User rewarded', reward);
          cleanup();
          resolve(reward);
        }));

        handles.push(await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
          console.log('Rewarded ad dismissed');
          cleanup();
          resolve(null);
        }));

        const options: RewardAdOptions = {
          adId: admobService.getRewardId(),
          isTesting: ADMOB_CONFIG.isTesting
        };

        await AdMob.prepareRewardVideoAd(options);
        await AdMob.showRewardVideoAd();
      } catch (err) {
        console.error('Error showing rewarded ad:', err);
        cleanup();
        reject(err);
      }
    });
  },

  showRewardedInterstitial: async (): Promise<AdMobRewardItem | null> => {
    if (Capacitor.getPlatform() === 'web') {
      return null;
    }

    return new Promise(async (resolve, reject) => {
      const handles: any[] = [];

      const cleanup = async () => {
        for (const handle of handles) {
          if (handle && typeof handle.remove === 'function') {
            await handle.remove();
          }
        }
      };

      try {
        handles.push(await AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
          console.log('Rewarded interstitial ad loaded');
        }));

        handles.push(await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (err) => {
          console.warn('Rewarded interstitial ad failed to load', err);
          cleanup();
          reject(err);
        }));

        handles.push(await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
          console.log('User rewarded (interstitial)', reward);
          cleanup();
          resolve(reward);
        }));

        handles.push(await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
          console.log('Rewarded interstitial ad dismissed');
          cleanup();
          resolve(null);
        }));

        const options: RewardInterstitialAdOptions = {
          adId: ADMOB_CONFIG.rewardInterstitialId,
          isTesting: ADMOB_CONFIG.isTesting
        };

        await AdMob.prepareRewardInterstitialAd(options);
        await AdMob.showRewardInterstitialAd();
      } catch (err) {
        console.error('Error showing rewarded interstitial:', err);
        cleanup();
        reject(err);
      }
    });
  },

  showSimpleInterstitial: async (): Promise<void> => {
    if (Capacitor.getPlatform() === 'web') {
      return;
    }

    if (await admobService.checkUserPlan()) {
      console.log('Usuário com plano pago, não exibindo anúncio');
      return;
    }

    try {
      const options: AdOptions = {
        adId: ADMOB_CONFIG.interstitialUnitId,
        isTesting: ADMOB_CONFIG.isTesting
      };

      await AdMob.prepareInterstitial(options);
      await AdMob.showInterstitial();
    } catch (err) {
      console.error('Error showing simple interstitial:', err);
    }
  }
};
