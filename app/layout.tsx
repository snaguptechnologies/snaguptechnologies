import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Snagup Technologies | Professional LMS",
  description: "Advanced batch-based learning management system for enterprise training",
  icons: {
    icon: "/brand-logo-v2.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const attributesToRemove = ['bis_skin_checked', 'fdprocessedid'];
                const removeAttributes = (node) => {
                  if (node.nodeType === 1) {
                    attributesToRemove.forEach(attr => node.removeAttribute(attr));
                  }
                  if (node.childNodes) {
                    node.childNodes.forEach(removeAttributes);
                  }
                };
                
                // Initial sweep
                removeAttributes(document.documentElement);
                
                // Observer for dynamic changes
                const observer = new MutationObserver((mutations) => {
                  mutations.forEach(mutation => {
                    if (mutation.type === 'attributes' && attributesToRemove.includes(mutation.attributeName)) {
                      mutation.target.removeAttribute(mutation.attributeName);
                    }
                    if (mutation.type === 'childList') {
                      mutation.addedNodes.forEach(removeAttributes);
                    }
                  });
                });
                
                observer.observe(document.documentElement, {
                  attributes: true,
                  childList: true,
                  subtree: true,
                  attributeFilter: attributesToRemove
                });
              })();
            `
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col antialiased bg-background selection:bg-primary/30 text-foreground transition-colors duration-300`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <main className="flex-1 w-full bg-background relative overflow-hidden" suppressHydrationWarning>
            {/* Subtle background glow effects */}
            <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-primary/10 rounded-full blur-[120px] pointer-events-none opacity-50" suppressHydrationWarning />
            <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-[120px] pointer-events-none opacity-50" suppressHydrationWarning />
            <div className="relative z-10" suppressHydrationWarning>{children}</div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
