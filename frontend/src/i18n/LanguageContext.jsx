import React, { createContext, useContext, useState, useEffect } from "react";
import en from "./en.json";
import hi from "./hi.json";

const translations = { en, hi };

const LanguageContext = createContext({
  lang: "en",
  setLang: () => {},
  t: (key) => key
});

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("pashuaahar_lang") || "en";
  });

  useEffect(() => {
    localStorage.setItem("pashuaahar_lang", lang);
  }, [lang]);

  const t = (key) => {
    return translations[lang]?.[key] || translations["en"]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}