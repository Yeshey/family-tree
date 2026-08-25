export type Lang = 'en' | 'pt'

export const translations: Record<Lang, Record<string, string>> = {
  en: {
    born: 'Born',
    died: 'Died',
    job: 'Job',
    notes: 'Notes',
    themeToggle: 'Dark / Light',
    langToggle: 'PT',
  },
  pt: {
    born: 'Nascimento',
    died: 'Falecimento',
    job: 'Profissão',
    notes: 'Notas',
    themeToggle: 'Escuro / Claro',
    langToggle: 'EN',
  },
}

export function getLang(): Lang {
  return (localStorage.getItem('lang') as Lang) || 'pt'
}

export function setLang(lang: Lang) {
  localStorage.setItem('lang', lang)
}

export function t(key: string, lang: Lang): string {
  return translations[lang][key] || key
}