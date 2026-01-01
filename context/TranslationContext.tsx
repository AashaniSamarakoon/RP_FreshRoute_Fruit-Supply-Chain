import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppLocale, getCurrentLocale, setI18nLocale, translate } from '../i18n/config';

interface TranslationContextType {
  t: (key: string, params?: Record<string, unknown>) => string;
  locale: AppLocale;
  setLocale: (locale: AppLocale) => Promise<void>;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const STORAGE_KEY = 'app_locale';

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(getCurrentLocale());

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        console.log('[TranslationProvider] Loaded saved locale from storage:', saved);
        if (saved === 'en' || saved === 'si') {
          setI18nLocale(saved);
          setLocaleState(saved);
          console.log('[TranslationProvider] Initialized with saved locale:', saved);
        } else {
          const current = getCurrentLocale();
          console.log('[TranslationProvider] No saved locale, using current:', current);
        }
      } catch (err) {
        console.warn('[TranslationProvider] Failed to load locale', err);
      }
    };
    load();
  }, []);

  const setLocale = useCallback(async (nextLocale: AppLocale) => {
    console.log('[TranslationProvider] setLocale called with:', nextLocale);
    console.log('[TranslationProvider] Type of nextLocale:', typeof nextLocale);
    console.log('[TranslationProvider] Current state locale:', locale);
    
    // Update i18n
    setI18nLocale(nextLocale);
    console.log('[TranslationProvider] Updated i18n.locale to:', nextLocale);
    
    // Update React state
    setLocaleState(nextLocale);
    console.log('[TranslationProvider] Scheduled state update to:', nextLocale);
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextLocale);
      console.log('[TranslationProvider] Persisted locale to AsyncStorage:', nextLocale);
    } catch (err) {
      console.warn('[TranslationProvider] Failed to persist locale', err);
    }
  }, []);

  // Create a wrapper for translate that always uses the current locale
  const t = useCallback((key: string, params?: Record<string, unknown>) => {
    return translate(key, params);
  }, [locale]);

  const value: TranslationContextType = useMemo(() => ({
    t,
    locale,
    setLocale,
  }), [locale, t, setLocale]);

  console.log('[TranslationProvider] Providing context with locale:', locale);

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslationContext() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslationContext must be used within TranslationProvider');
  }
  console.log('[useTranslationContext] Current locale:', context.locale);
  return context;
}
