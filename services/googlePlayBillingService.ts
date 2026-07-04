import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';
import { api } from './api';

export interface PlayBillingSku {
  productId: string;
  basePlanId: string;
}

export interface PlayProductCatalog {
  products: Record<string, PlayBillingSku>;
}

const PLAN_TO_PLAY_KEY: Record<string, string> = {
  STRIPE_BASIC_MONTHLY: 'PLAY_BASIC_MONTHLY',
  STRIPE_BASIC_ANNUAL: 'PLAY_BASIC_ANNUAL',
  STRIPE_PLUS_MONTHLY: 'PLAY_PLUS_MONTHLY',
  STRIPE_PLUS_ANNUAL: 'PLAY_PLUS_ANNUAL',
  STRIPE_PREMIUM_MONTHLY: 'PLAY_PREMIUM_MONTHLY',
  STRIPE_PREMIUM_ANNUAL: 'PLAY_PREMIUM_ANNUAL',
  PLAY_BASIC_MONTHLY: 'PLAY_BASIC_MONTHLY',
  PLAY_BASIC_ANNUAL: 'PLAY_BASIC_ANNUAL',
  PLAY_PLUS_MONTHLY: 'PLAY_PLUS_MONTHLY',
  PLAY_PLUS_ANNUAL: 'PLAY_PLUS_ANNUAL',
  PLAY_PREMIUM_MONTHLY: 'PLAY_PREMIUM_MONTHLY',
  PLAY_PREMIUM_ANNUAL: 'PLAY_PREMIUM_ANNUAL',
};

let catalogCache: PlayProductCatalog | null = null;
let billingReady = false;

export const googlePlayBillingService = {
  isAndroidNative: () => Capacitor.getPlatform() === 'android',

  async initialize(): Promise<void> {
    if (!this.isAndroidNative() || billingReady) return;
    try {
      const { isBillingSupported } = await NativePurchases.isBillingSupported();
      billingReady = isBillingSupported;
    } catch (error) {
      console.error('Google Play Billing init failed:', error);
    }
  },

  async getCatalog(): Promise<PlayProductCatalog> {
    if (catalogCache) return catalogCache;
    catalogCache = await api.get<PlayProductCatalog>('/payment/google-play/products');
    return catalogCache;
  },

  resolvePlaySku(planType: string, catalog: PlayProductCatalog): PlayBillingSku {
    const playKey = PLAN_TO_PLAY_KEY[planType] ?? planType;
    const sku = catalog.products[playKey];
    if (!sku) {
      throw new Error(`Produto Google Play não configurado para ${planType}`);
    }
    return sku;
  },

  async verifyPurchase(productId: string, purchaseToken: string): Promise<void> {
    await api.post('/payment/google-play/verify-subscription', {
      productId,
      purchaseToken,
      packageName: 'br.com.finsavior',
    });
    await NativePurchases.acknowledgePurchase({ purchaseToken });
  },

  async restorePendingSubscription(preferredPlanType?: string): Promise<boolean> {
    if (!this.isAndroidNative()) return false;

    await this.initialize();
    const catalog = await this.getCatalog();
    const preferredSku = preferredPlanType
      ? this.resolvePlaySku(preferredPlanType, catalog)
      : null;

    const { purchases } = await NativePurchases.getPurchases({
      productType: PURCHASE_TYPE.SUBS,
    });

    const candidates = preferredSku
      ? (purchases ?? []).filter((purchase) => purchase.productIdentifier === preferredSku.productId)
      : (purchases ?? []);

    for (const purchase of candidates) {
      const purchaseToken = purchase.purchaseToken;
      const productId = purchase.productIdentifier;
      if (!purchaseToken || !productId) continue;

      try {
        await this.verifyPurchase(productId, purchaseToken);
        return true;
      } catch (error) {
        console.warn('Failed to restore Google Play purchase', error);
      }
    }

    return false;
  },

  async purchaseSubscription(planType: string): Promise<void> {
    await this.initialize();
    const catalog = await this.getCatalog();
    const sku = this.resolvePlaySku(planType, catalog);

    const purchase = await NativePurchases.purchaseProduct({
      productIdentifier: sku.productId,
      planIdentifier: sku.basePlanId,
      productType: PURCHASE_TYPE.SUBS,
      autoAcknowledgePurchases: false,
    });

    const purchaseToken = purchase.purchaseToken;
    if (!purchaseToken) {
      throw new Error('Token de compra não retornado pela Google Play');
    }

    await this.verifyPurchase(sku.productId, purchaseToken);
  },

  async openPlaySubscriptionManagement(): Promise<void> {
    if (this.isAndroidNative()) {
      await NativePurchases.manageSubscriptions();
      return;
    }
    window.open('https://play.google.com/store/account/subscriptions?package=br.com.finsavior', '_blank');
  },
};
