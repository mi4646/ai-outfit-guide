import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'

export function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light')
    } catch {
      // Storage can be unavailable in private windows; the theme still works.
    }
  }, [dark])

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-11 w-11 rounded-full p-0"
      onClick={() => setDark((value) => !value)}
      aria-label={dark ? '切换到浅色主题' : '切换到深色主题'}
      title={dark ? '切换到浅色主题' : '切换到深色主题'}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
