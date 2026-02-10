import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'ja', label: 'JA' },
  { code: 'en', label: 'EN' },
  { code: 'ko', label: 'KO' }
] as const

export function LanguageSelector() {
  const { i18n } = useTranslation()
  const currentLang = i18n.language?.substring(0, 2) ?? 'en'

  const handleChange = useCallback(
    (lang: string) => {
      i18n.changeLanguage(lang)
    },
    [i18n]
  )

  return (
    <div style={styles.container}>
      {LANGUAGES.map((lang) => {
        const isActive = currentLang === lang.code
        return (
          <button
            key={lang.code}
            style={{
              ...styles.button,
              ...(isActive ? styles.active : styles.inactive)
            }}
            onClick={() => handleChange(lang.code)}
          >
            {lang.label}
          </button>
        )
      })}
    </div>
  )
}

const colors = {
  accent: '#8B7355',
  textMuted: '#9B9B9B',
  white: '#FFFFFF',
  border: '#E0DDD8'
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    gap: '2px',
    backgroundColor: colors.border,
    borderRadius: '6px',
    padding: '2px',
    // @ts-expect-error: WebKit specific property
    WebkitAppRegion: 'no-drag'
  },
  button: {
    padding: '3px 8px',
    fontSize: '10px',
    fontWeight: 600,
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    lineHeight: 1.2
  },
  active: {
    backgroundColor: colors.accent,
    color: colors.white
  },
  inactive: {
    backgroundColor: 'transparent',
    color: colors.textMuted
  }
}
