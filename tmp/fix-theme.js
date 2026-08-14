const fs = require("fs");
const file = "app/dashboard/student/workspace/[batchId]/page.tsx";
let content = fs.readFileSync(file, "utf8");

content = content.replace(/import \{([^\}]+)\} from "lucide-react";/, `import {$1} from "lucide-react";\nimport { ThemeToggle } from "@/components/ThemeToggle";`);

// Add ThemeToggle to navbar
const navRegex = /(<div className="flex items-center gap-3">\s*<span className="text-\[9px\][^>]+>Node ID<\/span>\s*<span className="text-\[9px\][^>]+>\{batchId\?\.[^\}]+\}<\/span>\s*)(<\/div>)/;
content = content.replace(navRegex, `$1<div className="w-px h-4 bg-border mx-2"></div><ThemeToggle />\n                $2`);

const replacements = {
    "bg-[#000000]": "bg-background",
    "bg-[#0a0a0a]": "bg-card glass-panel shadow-sm",
    "text-white/90": "text-foreground text-opacity-90",
    "text-white/70": "text-muted-foreground",
    "text-white/60": "text-muted-foreground",
    "text-white/50": "text-muted-foreground",
    "text-white/40": "text-muted-foreground",
    "text-white/30": "text-muted-foreground text-opacity-50",
    "text-white/20": "text-muted-foreground text-opacity-30",
    "text-white/10": "text-muted-foreground text-opacity-20",
    "text-white": "text-foreground",
    "text-black": "text-primary-foreground",
    "bg-white/5": "bg-muted/50",
    "bg-white/10": "bg-muted",
    "bg-white/\\[0\\.02\\]": "bg-muted/20",
    "bg-white": "bg-primary",
    "border-white/5": "border-border",
    "border-white/10": "border-border",
    "border-white/20": "border-border",
    "border-white/40": "border-border",
    "border-white": "border-border",
    "hover:text-white/40": "hover:text-muted-foreground",
    "hover:text-white": "hover:text-foreground",
    "hover:bg-neutral-200": "hover:opacity-90 hover:bg-primary",
    "hover:bg-white/5": "hover:bg-muted/80",
    "hover:bg-white/10": "hover:bg-muted",
    "hover:bg-white": "hover:bg-primary",
    "selection:bg-white": "selection:bg-primary",
    "selection:text-black": "selection:text-primary-foreground"
};

for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(key.replace(/\[/g, "\\[").replace(/\]/g, "\\]").replace(/\\/g, "\\\\"), "g");
    content = content.replace(regex, value);
}

// Special fix for the button text color that had style={{ color: "black" }}
content = content.replace(/style=\{\{ color: 'black' \}\}/g, "");
content = content.replace(/color="black"/g, `className="text-primary-foreground"`);

// Fix progress bar background
content = content.replace(/className="h-full bg-primary transition-all duration-1000"/g, `className="h-full bg-primary transition-all duration-1000"`);
// Actually it was bg-white originally, now it"s bg-primary
content = content.replace(/bg-foreground transition-all duration-1000/g, `bg-primary transition-all duration-1000`);

fs.writeFileSync(file, content);
console.log("Done");

