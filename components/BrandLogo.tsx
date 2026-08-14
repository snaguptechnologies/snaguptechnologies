"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

interface BrandLogoProps {
    className?: string;
    size?: number;
    priority?: boolean;
}

export default function BrandLogo({ className, size = 44, priority = false }: BrandLogoProps) {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    const isLight = mounted && (theme === "light" || resolvedTheme === "light");

    return (
        <div
            className={cn("flex items-center justify-center overflow-hidden transition-all duration-300", className)}
            style={{ width: size, height: size }}
        >
            <Image
                src="/brand-logo-v2.png"
                alt="Snagup Technologies Logo"
                width={size}
                height={size}
                className={cn(
                    "object-contain w-full h-full transition-all duration-300",
                    isLight
                        ? "opacity-100"
                        : "brightness-110 contrast-125"
                )}
                priority={priority}
            />
        </div>
    );
}
