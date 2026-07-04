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

export const PLAY_BILLING_UNAVAILABLE = 'PLAY_BILLING_UNAVAILABLE';

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
let billingSupported: boolean | null = null;

function billingUnavailableError(): Error & { errorCode: string } {
  const error = new Error(PLAY_BILLING_UNAVAILABLE) as Error & { errorCode: string };
  error.errorCode = PLAY_BILLING_UNAVAILABLE;
  return error;
}

export function isPlayBillingUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { errorCode?: string; message?: string; code?: string };
  if (candidate.errorCode === PLAY_BILLING_UNAVAILABLE) return true;
  const text = `${candidate.message ?? ''} ${candidate.code ?? ''}`;
  return (
    text.includes('BILLING_SETUP_FAILED') ||
    text.includes('Billing is not available') ||
    text.includes('Billing service unavailable')
  );
}

function matchesPlayProductId(purchaseProductId: string, expectedProductId: string): boolean {
  if (purchaseProductId === expectedProductId) return true;
  const purchaseBase = purchaseProductId.split(':')[0];
  const expectedBase = expectedProductId.split(':')[0];
  return purchaseBase === expectedBase;
}

async function verifyPurchaseWithBackend(productId: string, purchaseToken: string): Promise<void> {
  await api.post('/payment/google-play/verify-subscription', {
    productId,
    purchaseToken,
    packageName: 'br.com.finsavior',
  });
  await NativePurchases.acknowledgePurchase({ purchaseToken });
}

async function tryVerifyPurchases(
  purchases: Array<{ productIdentifier?: string; purchaseToken?: string }>,
  preferredProductId?: string
): Promise<boolean> {
  const sorted = [...purchases].sort((a, b) => {
    if (!preferredProductId) return 0;
    const aMatch = a.productIdentifier && matchesPlayProductId(a.productIdentifier, preferredProductId) ? 0 : 1;
    const bMatch = b.productIdentifier && matchesPlayProductId(b.productIdentifier, preferredProductId) ? 0 : 1;
    return aMatch - bMatch;
  });

  for (const purchase of sorted) {
    const purchaseToken = purchase.purchaseToken;
    const productId = purchase.productIdentifier;
    if (!purchaseToken || !productId) continue;

    try {
      await verifyPurchaseWithBackend(productId, purchaseToken);
      return true;
    } catch (error) {
      console.warn('Failed to restore Google Play purchase', { productId, error });
    }
  }

  return false;
}

export const googlePlayBillingService = {
  isAndroidNative: () => Capacitor.getPlatform() === 'android',

  async checkBillingSupported(force = false): Promise<boolean> {
    if (!this.isAndroidNative()) return false;
    if (!force && billingSupported !== null) return billingSupported;

    try {
      const { isBillingSupported } = await NativePurchases.isBillingSupported();
      billingSupported = isBillingSupported;
      return isBillingSupported;
    } catch (error) {
      console.error('Google Play Billing availability check failed:', error);
      billingSupported = false;
      return false;
    }
  },

  async initialize(): Promise<void> {
    await this.checkBillingSupported();
  },

  async ensureBillingAvailable(): Promise<void> {
    if (!this.isAndroidNative()) return;
    const supported = await this.checkBillingSupported(true);
    if (!supported) {
      throw billingUnavailableError();
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
    await verifyPurchaseWithBackend(productId, purchaseToken);
  },

  async restorePendingSubscription(preferredPlanType?: string): Promise<boolean> {
    if (!this.isAndroidNative()) return false;

    await this.ensureBillingAvailable();
    const catalog = await this.getCatalog();
    const preferredSku = preferredPlanType
      ? this.resolvePlaySku(preferredPlanType, catalog)
      : null;

    const { purchases } = await NativePurchases.getPurchases({
      productType: PURCHASE_TYPE.SUBS,
    });
    const allPurchases = purchases ?? [];
    if (allPurchases.length === 0) return false;

    const preferredMatches = preferredSku
      ? allPurchases.filter((purchase) =>
          purchase.productIdentifier &&
          matchesPlayProductId(purchase.productIdentifier, preferredSku.productId)
        )
      : allPurchases;

    if (await tryVerifyPurchases(preferredMatches, preferredSku?.productId)) {
      return true;
    }

    if (preferredSku && preferredMatches.length !== allPurchases.length) {
      return tryVerifyPurchases(allPurchases, preferredSku.productId);
    }

    return false;
  },

  async purchaseSubscription(planType: string): Promise<void> {
    await this.ensureBillingAvailable();
    const catalog = await this.getCatalog();
    const sku = this.resolvePlaySku(planType, catalog);

    let purchaseToken: string | undefined;
    try {
      const purchase = await NativePurchases.purchaseProduct({
        productIdentifier: sku.productId,
        planIdentifier: sku.basePlanId,
        productType: PURCHASE_TYPE.SUBS,
        autoAcknowledgePurchases: false,
      });
      purchaseToken = purchase.purchaseToken;
    } catch (error) {
      if (isPlayBillingUnavailableError(error)) throw error;
      const restored = await this.restorePendingSubscription(planType);
      if (restored) return;
      throw error;
    }

    if (!purchaseToken) {
      throw new Error('Token de compra não retornado pela Google Play');
    }

    await verifyPurchaseWithBackend(sku.productId, purchaseToken);
  },

  async openPlaySubscriptionManagement(): Promise<void> {
    if (this.isAndroidNative()) {
      await this.ensureBillingAvailable();
      await NativePurchases.manageSubscriptions();
      return;
    }
    window.open('https://play.google.com/store/account/subscriptions?package=br.com.finsavior', '_blank');
  },
};
