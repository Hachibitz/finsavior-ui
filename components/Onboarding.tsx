import React, { useState } from 'react';
import { ArrowRight, Wallet, ShieldCheck } from 'lucide-react';
import { SaviIcon } from './Logo';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Controle Total",
      description: "Gerencie seus débitos, cartões e ativos em um único lugar.",
      icon: <Wallet size={64} className="text-primary" />,
      color: "from-primary/20 to-indigo-600/20"
    },
    {
      title: "Inteligência Artificial",
      description: "Receba análises financeiras personalizadas com o poder da Savi AI.",
      icon: <SaviIcon className="w-32 h-32" />,
      color: "from-emerald-500/20 to-teal-600/20"
    },
    {
      title: "Segurança & Planos",
      description: "Seus dados protegidos e planos que cabem no seu bolso.",
      icon: <ShieldCheck size={64} className="text-amber-400" />,
      color: "from-amber-500/20 to-orange-600/20"
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
      <div className={`w-full max-w-md bg-surface border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col items-center text-center`}>
        {/* Background Glow */}
        <div className={`absolute inset-0 bg-gradient-to-br ${steps[step].color} opacity-30 transition-colors duration-500`} />
        
        <div className="relative z-10 mb-8 animate-slide-up">
           <div className="w-24 h-24 rounded-full bg-surface border border-slate-600/50 flex items-center justify-center shadow-lg mb-6 mx-auto">
             {steps[step].icon}
           </div>
           <h2 className="text-3xl font-bold text-white mb-4">{steps[step].title}</h2>
           <p className="text-slate-400 text-lg leading-relaxed">{steps[step].description}</p>
        </div>

        <div className="flex gap-2 mb-8 relative z-10">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-white' : 'w-2 bg-slate-600'}`} 
            />
          ))}
        </div>

        <button 
          onClick={handleNext}
          className="relative z-10 w-full py-4 bg-white text-slate-900 rounded-xl font-bold text-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 active:scale-95 duration-200"
        >
          {step === steps.length - 1 ? "Começar Agora" : "Próximo"}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Onboarding;