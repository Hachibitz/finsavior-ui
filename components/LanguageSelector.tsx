import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppLocale, SUPPORTED_LOCALES } from '../i18n/resources';
import { setAppLocale } from '../i18n';

interface LanguageSelectorProps {
  variant?: 'compact' | 'full';
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = 'full', className = '' }) => {
  const { t, i18n } = useTranslation();
  const current = (i18n.language as AppLocale) || 'pt-BR';

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    await setAppLocale(e.target.value as AppLocale, true);
  };

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <select
          value={current}
          onChange={handleChange}
          className="w-full appearance-none bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-9 pr-8 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label={t('language.select')}
        >
          {SUPPORTED_LOCALES.map((locale) => (
            <option key={locale.code} value={locale.code}>
              {locale.nativeLabel}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
        {t('language.title')}
      </label>
      <div className="relative">
        <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <select
          value={current}
          onChange={handleChange}
          className="w-full appearance-none bg-slate-900/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          aria-label={t('language.select')}
        >
          {SUPPORTED_LOCALES.map((locale) => (
            <option key={locale.code} value={locale.code}>
              {locale.nativeLabel}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default LanguageSelector;
