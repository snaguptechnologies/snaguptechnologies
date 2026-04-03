"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
    const { setTheme, theme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // When mounted on client, now safe to show the UI
    React.useEffect(() => setMounted(true), [])

    if (!mounted) return (
        <div className="h-9 w-9 bg-muted/50 rounded-lg border border-border flex items-center justify-center animate-pulse" />
    )

    const isDark = resolvedTheme === "dark"

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={cn(
                "relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground group"
            )}
            aria-label="Toggle theme"
        >
            {isDark ? (
                <Moon className="h-[1.2rem] w-[1.2rem] transition-all hover:scale-110 active:rotate-12" />
            ) : (
                <Sun className="h-[1.2rem] w-[1.2rem] transition-all hover:scale-110 active:rotate-12" />
            )}
            <span className="sr-only">Toggle theme</span>
        </button>
    )
}
