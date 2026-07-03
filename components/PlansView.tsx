import React, { useState, useEffect, useMemo } from 'react';
import { Check, Zap, ArrowLeft, Loader2 } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { loadStripe } from '@stripe/stripe-js';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { paymentService } from '../services/paymentService';
import { googlePlayBillingService } from '../services/googlePlayBillingService';
import { translateApiError } from '../utils/apiError';
import { formatCurrency } from '../i18n/localeFormat';
import { UserProfile } from '../types';

const planFamily = (planType?: string) => {
  if (!planType || planType === 'FREE') return 'FREE';
  return planType.replace(/^(STRIPE_|PLAY_)/, '').replace(/_MONTHLY|_ANNUAL$/, '');
};

const STRIPE_PUBLIC_KEY = import.meta.env.PROD 
  ? 'pk_live_51RAXKGP48Sfjk7zmg09SbDC5o0ZEThNvRfXQ0CcxbLaM9Y89n3rzPDeKr8uy2FQxvJfLPfRciM9FwvxlvXVDBQ8p00Ikf069O6' 
  : 'pk_test_51RAXKQP3WXaQ8eNCSd62SrLxgo6vXm9v0iPZHLkZY7nKKlJcALGyybHh7JynrX4icimDQlRAxtktx9qAcQV4VAgz00ATgXomAT';

type PlanTier = 'FREE' | 'BASIC' | 'PLUS' | 'PREMIUM';

interface PlanDefinition {
  tier: PlanTier;
  billing: 'MONTHLY' | 'ANNUAL' | null;
  priceMonthly: number;
  priceYearly: number | null;
  trial?: boolean;
  type: string;
}

const PLAN_DEFINITIONS: PlanDefinition[] = [
  { tier: 'FREE', billing: null, priceMonthly: 0, priceYearly: null, type: 'FREE' },
  { tier: 'BASIC', billing: 'MONTHLY', priceMonthly: 5.90, priceYearly: 59.90, trial: true, type: 'STRIPE_BASIC_MONTHLY' },
  { tier: 'PLUS', billing: 'MONTHLY', priceMonthly: 12.90, priceYearly: 129.90, trial: true, type: 'STRIPE_PLUS_MONTHLY' },
  { tier: 'PREMIUM', billing: 'MONTHLY', priceMonthly: 25.90, priceYearly: 200.00, trial: true, type: 'STRIPE_PREMIUM_MONTHLY' },
  { tier: 'BASIC', billing: 'ANNUAL', priceMonthly: 5.90, priceYearly: 59.90, trial: true, type: 'STRIPE_BASIC_ANNUAL' },
  { tier: 'PLUS', billing: 'ANNUAL', priceMonthly: 12.90, priceYearly: 129.90, trial: true, type: 'STRIPE_PLUS_ANNUAL' },
  { tier: 'PREMIUM', billing: 'ANNUAL', priceMonthly: 25.90, priceYearly: 200.00, trial: true, type: 'STRIPE_PREMIUM_ANNUAL' },
];

const FEATURE_KEY_BY_TIER: Record<PlanTier, 'free' | 'basic' | 'plus' | 'premium'> = {
  FREE: 'free',
  BASIC: 'basic',
  PLUS: 'plus',
  PREMIUM: 'premium',
};

function buildPlans(t: TFunction) {
  return PLAN_DEFINITIONS.map((def) => ({
    tier: def.tier,
    billing: def.billing,
    priceMonthly: formatCurrency(def.priceMonthly),
    priceYearly: def.priceYearly != null ? formatCurrency(def.priceYearly) : null,
    features: t(`plans.features.${FEATURE_KEY_BY_TIER[def.tier]}`, { returnObjects: true }) as string[],
    trial: def.trial,
    type: def.type,
  }));
}

interface PlansViewProps {
  profile?: UserProfile;
}

const PlansView: React.FC<PlansViewProps> = ({ profile }) => {
  const { t, i18n } = useTranslation();
  const usePlayBilling = googlePlayBillingService.isAndroidNative();
  const [loading, setLoading] = useState(false);
  const [checkoutActive, setCheckoutActive] = useState(false);
  const [stripeInstance, setStripeInstance] = useState<any>(null);
  const [embeddedCheckout, setEmbeddedCheckout] = useState<any>(null);
  const [selectedPlanGroup, setSelectedPlanGroup] = useState<any>(null);
  const [showChoiceModal, setShowChoiceModal] = useState(false);

  const currentPlanDs = profile?.plan?.planDs || 'FREE';

  const plans = useMemo(() => buildPlans(t), [t, i18n.language]);

  const groupedPlans = useMemo(() => {
    const grouped: Record<string, { name: PlanTier; monthly: ReturnType<typeof buildPlans>[number] | null; yearly: ReturnType<typeof buildPlans>[number] | null }> = {};
    plans.forEach((plan) => {
      if (!grouped[plan.tier]) {
        grouped[plan.tier] = {
          name: plan.tier,
          monthly: null,
          yearly: null,
        };
      }

      if (plan.billing === 'MONTHLY') {
        grouped[plan.tier].monthly = plan;
      } else if (plan.billing === 'ANNUAL') {
        grouped[plan.tier].yearly = plan;
      } else {
        grouped[plan.tier].monthly = plan;
      }
    });
    return Object.values(grouped);
  }, [plans]);

  const handlePlanClick = (planGroup: typeof groupedPlans[number]) => {
    if (planGroup.name === 'FREE') return;
    
    const isCurrent =
      planFamily(planGroup.monthly?.type) === planFamily(currentPlanDs) ||
      planFamily(planGroup.yearly?.type) === planFamily(currentPlanDs);
    if (isCurrent) return;

    setSelectedPlanGroup(planGroup);
    setShowChoiceModal(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      alert(t('plans.checkoutSuccess'));
      params.delete('session_id');
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
      window.location.reload();
    }
  }, [t]);

  useEffect(() => {
    if (checkoutActive && embeddedCheckout) {
      const timer = setTimeout(() => {
        const container = document.getElementById('checkout-container');
        if (container) {
          try {
            embeddedCheckout.mount('#checkout-container');
          } catch (err) {
            console.error('Mount error:', err);
          }
        } else {
          console.error('#checkout-container not found in DOM');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [checkoutActive, embeddedCheckout]);

  const startCheckout = async (planType: string) => {
    setShowChoiceModal(false);
    setLoading(true);
    try {
      if (usePlayBilling) {
        await googlePlayBillingService.purchaseSubscription(planType);
        alert(t('plans.checkoutSuccess'));
        window.location.reload();
        return;
      }

      const userEmail = profile?.email || localStorage.getItem('user_email') || '';
      const shouldUseHostedCheckout = Capacitor.isNativePlatform();

      const session = await paymentService.createCheckoutSession(planType, userEmail, shouldUseHostedCheckout);

      const isTrustedCheckoutUrl = (url: string) =>
        /^https:\/\/([a-z0-9-]+\.)?stripe\.com\//i.test(url);

      if (shouldUseHostedCheckout && session.url) {
        if (!isTrustedCheckoutUrl(session.url)) throw new Error(t('plans.checkoutInvalidUrl'));
        await Browser.open({
          url: session.url,
          presentationStyle: 'fullscreen',
        });
      } else if (session.clientSecret) {
        const stripe = await loadStripe(STRIPE_PUBLIC_KEY);
        if (!stripe) throw new Error(t('plans.stripeLoadFailed'));
        setStripeInstance(stripe);
        setCheckoutActive(true);

        const checkout = await stripe.initEmbeddedCheckout({
          clientSecret: session.clientSecret,
        });

        setEmbeddedCheckout(checkout);
      } else if (session.url) {
        if (!isTrustedCheckoutUrl(session.url)) throw new Error(t('plans.checkoutInvalidUrl'));
        window.location.href = session.url;
      } else {
        throw new Error(t('plans.checkoutNoSession'));
      }
    } catch (error: any) {
      console.error('Checkout error detail:', error);
      alert(translateApiError(error, t('plans.checkoutError')));
    } finally {
      setLoading(false);
    }
  };

  const closeCheckout = () => {
    if (embeddedCheckout) {
      embeddedCheckout.destroy();
      setEmbeddedCheckout(null);
    }
    setCheckoutActive(false);
  };

  if (checkoutActive) {
    return (
      <div className="animate-fade-in space-y-6 pb-20">
        <button 
          onClick={closeCheckout}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>{t('plans.backToPlans')}</span>
        </button>
        <div id="checkout-container" className="bg-white rounded-3xl overflow-hidden min-h-[600px]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-2">{t('plans.title')}</h1>
        <p className="text-slate-400">{t('plans.subtitle')}</p>
        {usePlayBilling && (
          <p className="text-xs text-emerald-400 mt-2">{t('plans.playBilling')}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {groupedPlans.map((group) => {
          const isCurrent =
            planFamily(group.monthly?.type) === planFamily(currentPlanDs) ||
            planFamily(group.yearly?.type) === planFamily(currentPlanDs);
          const isPro = group.name !== 'FREE';
          const displayPlan = group.monthly || group.yearly;
          
          return (
            <div 
              key={group.name}
              className={`glass-card p-6 rounded-3xl border transition-all relative overflow-hidden ${
                isCurrent ? 'border-primary shadow-lg shadow-primary/10' : 'border-slate-700/50'
              }`}
            >
              {group.name === 'PLUS' && !isCurrent && (
                <div className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                  {t('plans.popular')}
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{t(`plans.planNames.${group.name}`)}</h2>
                  {group.monthly?.trial && (
                    <div className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mb-1">
                      {t('plans.trial')}
                    </div>
                  )}
                  <p className="text-2xl font-bold text-slate-200">
                    {group.monthly?.priceMonthly || group.yearly?.priceYearly}
                    <span className="text-sm font-normal text-slate-500">
                      {group.monthly ? t('plans.perMonth') : t('plans.perYear')}
                    </span>
                  </p>
                  {group.yearly && (
                    <p className="text-xs text-emerald-400 font-medium mt-1">
                      {t('plans.orYearly', { price: group.yearly.priceYearly })}
                    </p>
                  )}
                </div>
                {isPro && (
                   <div className="bg-primary/10 p-2 rounded-xl text-primary">
                     <Zap size={24} />
                   </div>
                )}
              </div>

              <ul className="space-y-2 mb-6 text-slate-300 text-sm">
                {(displayPlan?.features || []).map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handlePlanClick(group)}
                disabled={isCurrent || loading}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                  isCurrent 
                    ? 'bg-primary/10 text-primary border border-primary/20 cursor-default' 
                    : isPro
                      ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/20 hover:shadow-primary/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-default'
                }`}
              >
                {loading && selectedPlanGroup?.name === group.name ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : isCurrent ? (
                  t('plans.current')
                ) : isPro ? (
                  t('plans.upgrade')
                ) : (
                  t('plans.free')
                )}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-500 mt-8">
        {t('plans.trialNote')}
      </p>

      {showChoiceModal && selectedPlanGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-sm rounded-3xl border border-white/10 p-8 animate-scale-in">
            <h3 className="text-xl font-bold text-white mb-2 text-center">{t('plans.chooseCycle')}</h3>
            <p className="text-slate-400 text-sm text-center mb-8">
              {t('plans.chooseCycleDesc', { plan: t(`plans.planNames.${selectedPlanGroup.name}`) })}
            </p>
            
            <div className="space-y-4">
              <button 
                onClick={() => startCheckout(selectedPlanGroup.monthly!.type)}
                className="w-full p-4 rounded-2xl border border-slate-700 hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white group-hover:text-primary transition-colors">{t('plans.monthly')}</span>
                  <span className="text-slate-200 font-bold">{selectedPlanGroup.monthly!.priceMonthly}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{t('plans.monthlyDesc')}</p>
              </button>

              {selectedPlanGroup.yearly && (
                <button 
                  onClick={() => startCheckout(selectedPlanGroup.yearly!.type)}
                  className="w-full p-4 rounded-2xl border border-primary bg-primary/5 hover:bg-primary/10 transition-all text-left relative"
                >
                  <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                    {t('plans.bestValue')}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-primary">{t('plans.annual')}</span>
                    <span className="text-white font-bold">{selectedPlanGroup.yearly.priceYearly}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{t('plans.annualDesc')}</p>
                </button>
              )}

              <button 
                onClick={() => setShowChoiceModal(false)}
                className="w-full py-3 text-slate-500 text-sm font-medium hover:text-white transition-colors mt-4"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansView;
