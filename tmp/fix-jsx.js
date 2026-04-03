const fs = require("fs");
const file = "app/dashboard/student/workspace/[batchId]/page.tsx";
let content = fs.readFileSync(file, "utf8");

content = content.replace(/className="w-4 h-4" className="text-primary-foreground"/g, `className="w-4 h-4 text-primary-foreground"`);

fs.writeFileSync(file, content);
console.log("Fixed JSX syntax error");

