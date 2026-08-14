const fs = require("fs");
const file = "app/dashboard/student/workspace/[batchId]/page.tsx";
let content = fs.readFileSync(file, "utf8");

content = content.replace("text-sm font-bold text-amber-900 dark:text-amber-100/90 leading-relaxed italic", "text-sm font-bold text-black dark:text-amber-100/90 leading-relaxed italic");
content = content.replace("text-[10px] font-black uppercase tracking-[0.2em] text-amber-800 dark:text-amber-500/70", "text-[10px] font-black uppercase tracking-[0.2em] text-black dark:text-amber-500/70");
content = content.replace("text-[9px] font-bold text-amber-600 dark:text-amber-500/30 uppercase tracking-widest", "text-[9px] font-bold text-neutral-500 dark:text-amber-500/30 uppercase tracking-widest");
content = content.replace("text-[9px] font-bold text-amber-700 dark:text-amber-500/40 uppercase tracking-widest", "text-[9px] font-bold text-neutral-600 dark:text-amber-500/40 uppercase tracking-widest");
content = content.replace("text-amber-700 dark:text-amber-500 border border-amber-300 dark:border-amber-500/20", "text-black dark:text-amber-500 border border-amber-400 dark:border-amber-500/20");


fs.writeFileSync(file, content);
console.log("Updated to black text for light mode");

