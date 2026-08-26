export type Lang = 'en' | 'pt'

export const translations: Record<Lang, Record<string, string>> = {
  en: {
    born: 'Born',
    died: 'Died',
    job: 'Job',
    notes: 'Notes',
  },
  pt: {
    born: 'Nascimento',
    died: 'Falecimento',
    job: 'Profissão',
    notes: 'Notas',
  },
}

export function getLang(): Lang {
  return (localStorage.getItem('lang') as Lang) || 'pt'
}

export function t(key: string, lang: Lang): string {
  return translations[lang][key] || key
}