import React, { useState } from 'react';
import { ArrowRight, Wallet, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SaviIcon } from './Logo';
import LanguageSelector from './LanguageSelector';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: t('onboarding.step1Title'),
      description: t('onboarding.step1Desc'),
      icon: <Wallet size={64} className="text-primary" />,
      color: 'from-primary/20 to-indigo-600/20'
    },
    {
      title: t('onboarding.step2Title'),
      description: t('onboarding.step2Desc'),
      icon: <SaviIcon className="w-32 h-32" />,
      color: 'from-emerald-500/20 to-teal-600/20'
    },
    {
      title: t('onboarding.step3Title'),
      description: t('onboarding.step3Desc'),
      icon: <ShieldCheck size={64} className="text-amber-400" />,
      color: 'from-amber-500/20 to-orange-600/20'
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-md mb-4">
        <LanguageSelector variant="compact" />
      </div>
      <div className={`w-full max-w-md bg-surface border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col items-center text-center`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${steps[step].color} opacity-30 transition-colors duration-500`} />
        
        <div className="relative z-10 mb-8 animate-slide-up">
           <div className="w-24 h-24 rounded-full bg-surface border border-slate-600/50 flex items-center justify-center shadow-lg mb-6 mx-auto">
             {steps[step].icon}
           </div>
           <h2 className="text-2xl font-bold text-white mb-3">{steps[step].title}</h2>
           <p className="text-slate-400 leading-relaxed">{steps[step].description}</p>
        </div>

        <button 
          onClick={handleNext}
          className="relative z-10 w-full bg-gradient-to-r from-primary to-accent text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
        >
          {step < steps.length - 1 ? t('onboarding.next') : t('onboarding.start')}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
