const fs = require("fs");
const file = "app/dashboard/student/workspace/[batchId]/page.tsx";
let content = fs.readFileSync(file, "utf8");

content = content.replace("bg-amber-500/10 text-amber-500 border border-amber-500/20", "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 border border-amber-300 dark:border-amber-500/20");
content = content.replace("text-amber-500\"", "text-amber-600 dark:text-amber-500\"");

fs.writeFileSync(file, content);
console.log("Fixed more amber colors");

