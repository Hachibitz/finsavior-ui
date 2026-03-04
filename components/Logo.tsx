import React, { useState } from 'react';
import finSaviorLogoUrl from '../assets/logos/logo.png';
import saviIconUrl from '../assets/logos/Savi-logo-new-cut-no-bg.png';

export const FinSaviorLogo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => {
  const [imgSrc, setImgSrc] = useState(finSaviorLogoUrl);
  const [retryCount, setRetryCount] = useState(0);

  const handleError = () => {
    if (retryCount === 0) {
      setRetryCount(1);
      setImgSrc('/logo.png');
    } else if (retryCount === 1) {
      setRetryCount(2);
      setImgSrc('/assets/logos/logo.png');
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src={imgSrc}
        alt="FinSavior Logo" 
        className="w-full h-full object-contain"
        onError={handleError}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export const SaviIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => {
  const [imgSrc, setImgSrc] = useState(saviIconUrl);
  const [retryCount, setRetryCount] = useState(0);

  const handleError = () => {
    if (retryCount === 0) {
      setRetryCount(1);
      setImgSrc('/savi-icon.png');
    } else if (retryCount === 1) {
      setRetryCount(2);
      setImgSrc('/assets/logos/Savi-logo-new-cut-no-bg.png');
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src={imgSrc} 
        alt="Savi AI" 
        className="w-full h-full object-contain"
        onError={handleError}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
