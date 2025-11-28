
export type LanguageCode = 'en' | 'vi' | 'ko' | 'zh' | 'ja' | 'ru' | 'es' | 'de' | 'fr' | 'tl' | 'th' | 'id';

export interface TranslationResource {
  [key: string]: {
    [lang in LanguageCode]: string;
  };
}
