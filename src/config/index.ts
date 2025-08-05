import charactersConfig from '../../config/characters.json';
import enTranslations from '../../config/i18n/en.json';
import frTranslations from '../../config/i18n/fr.json';
import ptTranslations from '../../config/i18n/pt.json';

export interface CharacterDescription {
  name: string;
  character: string;
  identity: string;
  plan: string;
}

export interface Config {
  language: string;
  characters: CharacterDescription[];
  translations: any;
}

const translations = {
  en: enTranslations,
  fr: frTranslations,
  pt: ptTranslations,
};

export function getConfig(): Config {
  const language = process.env.VITE_LANGUAGE || 'en';
  const supportedLanguages = ['en', 'fr', 'pt'];
  const selectedLanguage = supportedLanguages.includes(language) ? language : 'en';
  
  return {
    language: selectedLanguage,
    characters: charactersConfig.characters[selectedLanguage as keyof typeof charactersConfig.characters] || charactersConfig.characters.en,
    translations: translations[selectedLanguage as keyof typeof translations] || translations.en,
  };
}

export function useTranslation() {
  const config = getConfig();
  
  const t = (key: string): string => {
    const keys = key.split('.');
    let value = config.translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  };
  
  return { t, language: config.language };
}