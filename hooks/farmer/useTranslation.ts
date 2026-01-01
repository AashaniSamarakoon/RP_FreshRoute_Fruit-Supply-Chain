import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

import {
  AppLocale,
  getCurrentLocale,
  setI18nLocale,
  translate,
} from "../../i18n/config";

const STORAGE_KEY = "app_locale";

export const useTranslation = () => {
  const [locale, setLocaleState] = useState<AppLocale>(getCurrentLocale());

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === "en" || saved === "si") {
          setI18nLocale(saved);
          setLocaleState(saved);
        }
      } catch (err) {
        console.warn("Failed to load locale", err);
      }
    };
    load();
  }, []);

  const setLocale = useCallback(async (nextLocale: AppLocale) => {
    setI18nLocale(nextLocale);
    setLocaleState(nextLocale);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextLocale);
    } catch (err) {
      console.warn("Failed to persist locale", err);
    }
  }, []);

  return {
    t: translate,
    locale,
    setLocale,
  };
};

export type { AppLocale };

