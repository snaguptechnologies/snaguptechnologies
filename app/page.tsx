"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Root() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("snagup_user");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        if (parsed?.role) {
          router.replace(`/dashboard/${parsed.role}`);
          return;
        }
      } catch (e) {
        // Fall back to home if user data is corrupt
      }
    }
    router.replace("/home");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
    </div>
  );
}
