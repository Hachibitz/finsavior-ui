import React, { useState, useEffect, useMemo } from 'react';
import { Check, Zap, ArrowLeft, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { paymentService } from '../services/paymentService';
import { UserProfile } from '../types';

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51QZ8bFAn2p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p';

export const PLANS = [
    {
        name: 'FREE',
        priceMonthly: 'R$ 0,00',
        priceYearly: null,
        features: [
            '1 análise para teste',
            '2 mensagens com a Savi por mês (assistente financeira de IA)',
            'Até 4.000 tokens de IA por mês'
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
    
    const isCurrent = planGroup.monthly?.type === currentPlanDs || planGroup.yearly?.type === currentPlanDs;
    if (isCurrent) return;

    setSelectedPlanGroup(planGroup);
    setShowChoiceModal(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      // Simple confirmation flow: notify user and clean URL
      alert('Assinatura concluída! Seu plano ficará disponível em instantes.');
      params.delete('session_id');
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
      // Optionally, trigger a profile refresh in parent by reloading
      // or integrate with a user context — here we keep it simple
      window.location.reload();
    }
  }, []);

  const startCheckout = async (planType: string) => {
    setShowChoiceModal(false);
    setLoading(true);
    try {
      const session = await paymentService.createCheckoutSession(planType, profile?.email || '');
      
      if (session.clientSecret) {
        const stripe = await loadStripe(STRIPE_PUBLIC_KEY);
        if (!stripe) throw new Error('Stripe failed to load');
        setStripeInstance(stripe);
        setCheckoutActive(true);

        const checkout = await stripe.initEmbeddedCheckout({
          clientSecret: session.clientSecret,
        });

        setEmbeddedCheckout(checkout);
        checkout.mount('#checkout-container');
      } else if (session.url) {
        window.location.href = session.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Erro ao iniciar checkout. Tente novamente.');
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
          <span>Voltar para planos</span>
        </button>
        <div id="checkout-container" className="bg-white rounded-3xl overflow-hidden min-h-[600px]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-2">Planos FinSavior</h1>
        <p className="text-slate-400">Escolha o plano ideal para sua jornada financeira.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {groupedPlans.map((group: any) => {
          const isCurrent = group.monthly?.type === currentPlanDs || group.yearly?.type === currentPlanDs;
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
                  'PLANO ATUAL'
                ) : isPro ? (
                  'MUDAR PARA ESTE PLANO'
                ) : (
                  'PLANO BÁSICO'
                )}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-500 mt-8">
        * O período de teste gratuito é concedido apenas para a primeira assinatura.
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
