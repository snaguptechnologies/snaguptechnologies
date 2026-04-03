"use client";

/**
 * useAuthGuard — Prevents accessing protected pages via browser
 * back/forward buttons after logout.
 *
 * Handles two cases:
 *   1. popstate — SPA navigation via browser history
 *   2. pageshow (persisted) — browser back-forward cache (bfcache) restores
 *      a full page snapshot without re-running React lifecycle hooks
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuthGuard(requiredRole?: string) {
    const router = useRouter();

    useEffect(() => {
        function checkAuth() {
            const token = localStorage.getItem("snagup_token");
            const userStr = localStorage.getItem("snagup_user");

            if (!token || !userStr) {
                router.replace("/login");
                return;
            }

            if (requiredRole) {
                try {
                    const user = JSON.parse(userStr);
                    if (user.role !== requiredRole) {
                        router.replace("/login");
                    }
                } catch {
                    router.replace("/login");
                }
            }
        }

        // Run immediately on mount
        checkAuth();

        // Re-run on SPA back/forward navigation
        window.addEventListener("popstate", checkAuth);

        // Re-run if bfcache restores this page (the persisted flag is true)
        const handlePageShow = (e: PageTransitionEvent) => {
            if (e.persisted) {
                checkAuth();
            }
        };
        window.addEventListener("pageshow", handlePageShow);

        return () => {
            window.removeEventListener("popstate", checkAuth);
            window.removeEventListener("pageshow", handlePageShow);
        };
    }, [router, requiredRole]);
}
