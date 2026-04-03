const fs = require("fs");
const file = "app/dashboard/student/workspace/[batchId]/page.tsx";
let content = fs.readFileSync(file, "utf8");

content = content.replace("text-sm font-bold text-black dark:text-amber-100/90 leading-relaxed italic", "text-sm font-black text-slate-900 dark:text-slate-50 leading-relaxed italic");

fs.writeFileSync(file, content);
console.log("Updated workspace color");

