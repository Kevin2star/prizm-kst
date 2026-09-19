import { useCallback, useState } from 'react'

const STORAGE_KEY = 'prizm-theme'

function readStoredTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'light' || value === 'dark') return value
  } catch {
    /* ignore private mode / blocked storage */
  }
  return 'dark'
}

export function useTheme() {
  const [theme, setThemeState] = useState(readStoredTheme)

  const setTheme = useCallback((next) => {
    const value = next === 'light' ? 'light' : 'dark'
    setThemeState(value)
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      /* ignore */
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [setTheme, theme])

  return { theme, setTheme, toggleTheme }
}
