import React, { useState, useEffect, useMemo } from 'react';
import { Check, Zap, ArrowLeft, Loader2 } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { loadStripe } from '@stripe/stripe-js';
import { useTranslation } from 'react-i18next';
import { paymentService } from '../services/paymentService';
import { googlePlayBillingService } from '../services/googlePlayBillingService';
import { translateApiError } from '../utils/apiError';
import { UserProfile } from '../types';

const planFamily = (planType?: string) => {
  if (!planType || planType === 'FREE') return 'FREE';
  return planType.replace(/^(STRIPE_|PLAY_)/, '').replace(/_MONTHLY|_ANNUAL$/, '');
};

const STRIPE_PUBLIC_KEY = import.meta.env.PROD 
  ? 'pk_live_51RAXKGP48Sfjk7zmg09SbDC5o0ZEThNvRfXQ0CcxbLaM9Y89n3rzPDeKr8uy2FQxvJfLPfRciM9FwvxlvXVDBQ8p00Ikf069O6' 
  : 'pk_test_51RAXKQP3WXaQ8eNCSd62SrLxgo6vXm9v0iPZHLkZY7nKKlJcALGyybHh7JynrX4icimDQlRAxtktx9qAcQV4VAgz00ATgXomAT';

export const PLANS = [
    {
        name: 'FREE',
        priceMonthly: 'R$ 0,00',
        priceYearly: null,
        features: [
            '1 análise para teste',
            '2 mensagens com a Savi por mês (assistente financeira de IA)',
            'Até 4.000 tokens de IA por mês',
            'Inserção básica por voz'
        ],
        type: 'FREE',
    },
    {
        name: 'BASIC MENSAL',
        priceMonthly: 'R$ 5,90',
        priceYearly: 'R$ 59,90',
        features: [
            '3 análises mensais, 1 trimestral',
            '15 mensagens com a Savi por mês (assistente financeira de IA)',
            'Até 30.000 tokens de IA por mês',
            'Controle do nível de criatividade/precisão',
            'Inserção por voz e WhatsApp',
            'Sem anúncios forçados'
        ],
        trial: true,
        type: 'STRIPE_BASIC_MONTHLY',
    },
    {
        name: 'PLUS MENSAL',
        priceMonthly: 'R$ 12,90',
        priceYearly: 'R$ 129,90',
        features: [
            '12 análises mensais, 3 trimestrais, 1 anual',
            '50 mensagens com a Savi por mês (assistente financeira de IA)',
            'Até 100.000 tokens de IA por mês',
            'Suporte prioritário',
            'Controle do nível de criatividade/precisão',
            'Inserção por voz e WhatsApp ilimitados',
            'Sem anúncios forçados'
        ],
        type: 'STRIPE_PLUS_MONTHLY',
        trial: true,
    },
    {
        name: 'PREMIUM MENSAL',
        priceMonthly: 'R$ 25,90',
        priceYearly: 'R$ 200,00',
        features: [
            'Análises ilimitadas',
            'Mensagens ilimitadas com a Savi (assistente financeira de IA)',
            'Tokens ilimitados de IA por mês',
            'Suporte personalizado e prioritário',
            'Controle do nível de criatividade/precisão',
            'Inserção por voz e WhatsApp ilimitados',
            'Maior desconto no anual!',
            'Sem anúncios forçados'
        ],
        trial: true,
        type: 'STRIPE_PREMIUM_MONTHLY',
    },
    {
        name: 'BASIC ANUAL',
        priceMonthly: 'R$ 5,90',
        priceYearly: 'R$ 59,90',
        features: [
            '3 análises mensais, 1 trimestral',
            '15 mensagens com a Savi por mês (assistente financeira de IA)',
            'Até 30.000 tokens de IA por mês',
            'Controle do nível de criatividade/precisão',
            'Inserção por voz e WhatsApp',
            'Sem anúncios forçados'
        ],
        trial: true,
        type: 'STRIPE_BASIC_ANNUAL',
    },
    {
        name: 'PLUS ANUAL',
        priceMonthly: 'R$ 12,90',
        priceYearly: 'R$ 129,90',
        features: [
            '12 análises mensais, 3 trimestrais, 1 anual',
            '50 mensagens com a Savi por mês (assistente financeira de IA)',
            'Até 100.000 tokens de IA por mês',
            'Suporte prioritário',
            'Controle do nível de criatividade/precisão',
            'Inserção por voz e WhatsApp ilimitados',
            'Sem anúncios forçados'
        ],
        type: 'STRIPE_PLUS_ANNUAL',
        trial: true,
    },
    {
        name: 'PREMIUM ANUAL',
        priceMonthly: 'R$ 25,90',
        priceYearly: 'R$ 200,00',
        features: [
            'Análises ilimitadas',
            'Mensagens ilimitadas com a Savi (assistente financeira de IA)',
            'Tokens ilimitados de IA por mês',
            'Suporte personalizado e prioritário',
            'Controle do nível de criatividade/precisão',
            'Inserção por voz e WhatsApp ilimitados',
            'Maior desconto no anual!',
            'Sem anúncios forçados'
        ],
        trial: true,
        type: 'STRIPE_PREMIUM_ANNUAL',
    },
];

interface PlansViewProps {
  profile?: UserProfile;
}

const PlansView: React.FC<PlansViewProps> = ({ profile }) => {
  const { t } = useTranslation();
  const usePlayBilling = googlePlayBillingService.isAndroidNative();
  const [loading, setLoading] = useState(false);
  const [checkoutActive, setCheckoutActive] = useState(false);
  const [stripeInstance, setStripeInstance] = useState<any>(null);
  const [embeddedCheckout, setEmbeddedCheckout] = useState<any>(null);
  const [selectedPlanGroup, setSelectedPlanGroup] = useState<any>(null);
  const [showChoiceModal, setShowChoiceModal] = useState(false);

  const currentPlanDs = profile?.plan?.planDs || 'FREE';

  const groupedPlans = useMemo(() => {
    const grouped: any = {};
    PLANS.forEach((plan) => {
      const baseName = plan.name.replace(' MENSAL', '').replace(' ANUAL', '');
      if (!grouped[baseName]) {
        grouped[baseName] = {
          name: baseName,
          monthly: null,
          yearly: null,
        };
      }

      if (plan.type.includes('MONTHLY')) {
        grouped[baseName].monthly = plan;
      } else if (plan.type.includes('ANNUAL')) {
        grouped[baseName].yearly = plan;
      } else {
        grouped[baseName].monthly = plan;
      }
    });
    return Object.values(grouped);
  }, []);

  const handlePlanClick = (planGroup: any) => {
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
      // Simple confirmation flow: notify user and clean URL
      alert(t('plans.checkoutSuccess'));
      params.delete('session_id');
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
      // Optionally, trigger a profile refresh in parent by reloading
      // or integrate with a user context — here we keep it simple
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    if (checkoutActive && embeddedCheckout) {
      const timer = setTimeout(() => {
        const container = document.getElementById('checkout-container');
        if (container) {
          try {
            console.log('Mounting checkout to #checkout-container');
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

      console.log('Starting checkout for plan:', planType);
      const userEmail = profile?.email || localStorage.getItem('user_email') || '';
      const shouldUseHostedCheckout = Capacitor.isNativePlatform();

      const session = await paymentService.createCheckoutSession(planType, userEmail, shouldUseHostedCheckout);

      // Only ever redirect to Stripe-owned domains — protects against a
      // compromised/misbehaving backend response turning into an open redirect.
      const isTrustedCheckoutUrl = (url: string) =>
        /^https:\/\/([a-z0-9-]+\.)?stripe\.com\//i.test(url);

      if (shouldUseHostedCheckout && session.url) {
        if (!isTrustedCheckoutUrl(session.url)) throw new Error('URL de checkout inválida');
        await Browser.open({
          url: session.url,
          presentationStyle: 'fullscreen',
        });
      } else if (session.clientSecret) {
        const stripe = await loadStripe(STRIPE_PUBLIC_KEY);
        if (!stripe) throw new Error('Falha ao carregar o Stripe');
        setStripeInstance(stripe);
        
        // Ativa a visualização do checkout para renderizar o container
        setCheckoutActive(true);

        console.log('Initializing embedded checkout with clientSecret');
        const checkout = await stripe.initEmbeddedCheckout({
          clientSecret: session.clientSecret,
        });
        console.log('Embedded checkout initialized successfully');

        setEmbeddedCheckout(checkout);
      } else if (session.url) {
        if (!isTrustedCheckoutUrl(session.url)) throw new Error('URL de checkout inválida');
        window.location.href = session.url;
      } else {
        throw new Error('Resposta do servidor não contém clientSecret ou URL');
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
        {groupedPlans.map((group: any) => {
          const isCurrent =
            planFamily(group.monthly?.type) === planFamily(currentPlanDs) ||
            planFamily(group.yearly?.type) === planFamily(currentPlanDs);
          const isPro = group.name !== 'FREE';
          
          return (
            <div 
              key={group.name}
              className={`glass-card p-6 rounded-3xl border transition-all relative overflow-hidden ${
                isCurrent ? 'border-primary shadow-lg shadow-primary/10' : 'border-slate-700/50'
              }`}
            >
              {group.name === 'PLUS' && !isCurrent && (
                <div className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                  Popular
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{group.name}</h2>
                  {group.monthly?.trial && (
                    <div className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mb-1">
                      7 Dias Grátis
                    </div>
                  )}
                  <p className="text-2xl font-bold text-slate-200">
                    {group.monthly?.priceMonthly || group.yearly?.priceYearly}
                    <span className="text-sm font-normal text-slate-500">
                      {group.monthly ? '/mês' : '/ano'}
                    </span>
                  </p>
                  {group.yearly && (
                    <p className="text-xs text-emerald-400 font-medium mt-1">
                      ou {group.yearly.priceYearly}/ano (Economize!)
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
                {(group.monthly?.features || group.yearly?.features).map((feature: string, idx: number) => (
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

      {/* Choice Modal */}
      {showChoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-sm rounded-3xl border border-white/10 p-8 animate-scale-in">
            <h3 className="text-xl font-bold text-white mb-2 text-center">Escolha o ciclo</h3>
            <p className="text-slate-400 text-sm text-center mb-8">Selecione como deseja ser cobrado pelo plano {selectedPlanGroup?.name}.</p>
            
            <div className="space-y-4">
              <button 
                onClick={() => startCheckout(selectedPlanGroup.monthly.type)}
                className="w-full p-4 rounded-2xl border border-slate-700 hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white group-hover:text-primary transition-colors">Mensal</span>
                  <span className="text-slate-200 font-bold">{selectedPlanGroup.monthly.priceMonthly}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Cobre mensalmente, cancele quando quiser.</p>
              </button>

              {selectedPlanGroup.yearly && (
                <button 
                  onClick={() => startCheckout(selectedPlanGroup.yearly.type)}
                  className="w-full p-4 rounded-2xl border border-primary bg-primary/5 hover:bg-primary/10 transition-all text-left relative"
                >
                  <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                    Melhor Valor
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-primary">Anual</span>
                    <span className="text-white font-bold">{selectedPlanGroup.yearly.priceYearly}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Pagamento único anual. Economia garantida.</p>
                </button>
              )}

              <button 
                onClick={() => setShowChoiceModal(false)}
                className="w-full py-3 text-slate-500 text-sm font-medium hover:text-white transition-colors mt-4"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansView;
