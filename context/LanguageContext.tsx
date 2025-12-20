'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '@/utils/translations';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof translations['zh'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // 預設語言：繁體中文 ('zh')
  const [lang, setLang] = useState<Language>('zh');

  // 初始化時讀取 LocalStorage (記住使用者上次的選擇)
  useEffect(() => {
    // 只有在客戶端才執行
    if (typeof window !== 'undefined') {
        const savedLang = localStorage.getItem('app-language') as Language;
        if (savedLang && ['zh', 'ja', 'en'].includes(savedLang)) {
          setLang(savedLang);
        }
    }
  }, []);

  // 當語言改變時，存入 LocalStorage
  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('app-language', newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t: translations[lang] }}>
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