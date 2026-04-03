const fs = require("fs");
const file = "app/dashboard/student/workspace/[batchId]/page.tsx";
let content = fs.readFileSync(file, "utf8");

// Fix container and borders
content = content.replace("bg-amber-500/5 rounded-2xl border border-amber-500/20", "bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-200 dark:border-amber-500/20");
content = content.replace("bg-amber-500/10 rounded-bl-full", "bg-amber-100 dark:bg-amber-500/10 rounded-bl-full");
content = content.replace("bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-sm shadow-amber-500/5", "bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-300 dark:border-amber-500/20 shadow-sm shadow-amber-500/5");

// Fix text colors
content = content.replace("text-amber-500/70 border-b border-amber-500/20", "text-amber-800 dark:text-amber-500/70 border-b border-amber-300 dark:border-amber-500/20");
content = content.replace("text-amber-500/30 uppercase", "text-amber-600 dark:text-amber-500/30 uppercase");
content = content.replace("text-amber-500/40 uppercase", "text-amber-700 dark:text-amber-500/40 uppercase");

// Ensure the message text is fixed properly.
content = content.replace("text-amber-900 dark:text-amber-100/90 leading-relaxed italic", "text-amber-900 dark:text-amber-100/90 leading-relaxed italic");

// Also fix the yellow dot
content = content.replace("bg-amber-500/40", "bg-amber-600 dark:bg-amber-500/40");

fs.writeFileSync(file, content);
console.log("Fixed amber colors in broadcast section");

