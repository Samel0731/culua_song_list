'use client';

import React, { createContext, useContext, useSyncExternalStore, useEffect } from 'react';
import { translations, Language } from '@/utils/translations';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof translations['zh'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const storageKey = 'app-language';
const languageChangeEvent = 'culua-language-change';
let sessionLanguage: Language | undefined;

function getLanguage(): Language {
  if (sessionLanguage) return sessionLanguage;
  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved === 'zh' || saved === 'ja' || saved === 'en' ? saved : 'zh';
  } catch {
    return 'zh';
  }
}

function subscribeLanguage(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) {
      sessionLanguage = undefined;
      onChange();
    }
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(languageChangeEvent, onChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(languageChangeEvent, onChange);
  };
}

function setLanguage(newLang: Language) {
  sessionLanguage = newLang;
  try {
    window.localStorage.setItem(storageKey, newLang);
  } catch {
    // Language switching remains available when browser storage is blocked.
  }
  window.dispatchEvent(new window.Event(languageChangeEvent));
}

const getServerLanguage = (): Language => 'zh';

// 修改重點：請使用 "export function" (沒有 default)
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribeLanguage, getLanguage, getServerLanguage);

  useEffect(() => { document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : lang; }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang: setLanguage, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
