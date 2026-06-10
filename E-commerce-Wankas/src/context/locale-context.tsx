'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { en, type Translations } from '@/locales/en';
import { es } from '@/locales/es';

type Locale = 'en' | 'es';

interface LocaleContextType {
  locale: Locale;
  translations: Translations;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const allTranslations: Record<Locale, Translations> = { en, es };

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>('es');
  const [translations, setTranslations] = useState<Translations>(allTranslations.es);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedLocale = localStorage.getItem('wankas-locale') as Locale | null;
    let initialLocale: Locale = 'es';

    if (storedLocale && (storedLocale === 'en' || storedLocale === 'es')) {
      initialLocale = storedLocale;
    } else {
      const browserLang = typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'es';
      if (browserLang === 'en') {
        initialLocale = 'en';
      }
    }
    setLocaleState(initialLocale);
    setTranslations(allTranslations[initialLocale]);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setTranslations(allTranslations[newLocale]);
    localStorage.setItem('wankas-locale', newLocale);
  }, []);
  
  useEffect(() => {
    if (isMounted && typeof document !== 'undefined') {
        document.documentElement.lang = locale;
        document.title = translations.SITE_TITLE;
    }
  }, [locale, translations, isMounted]);


  if (!isMounted) {
    return null; 
  }

  return (
    <LocaleContext.Provider value={{ locale, translations, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = (): LocaleContextType => {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};
