import React from 'react';
import finSaviorLogo from '../assets/logos/logo.png';
import saviIcon from '../assets/logos/Savi-logo-new-cut-no-bg.png';

export const FinSaviorLogo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src={finSaviorLogo}
        alt="FinSavior Logo" 
        className="w-full h-full object-contain"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export const SaviIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src={saviIcon} 
        alt="Savi AI" 
        className="w-full h-full object-contain"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
