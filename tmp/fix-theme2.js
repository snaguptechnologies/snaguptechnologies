const fs = require("fs");
const file = "app/dashboard/student/workspace/[batchId]/page.tsx";
let content = fs.readFileSync(file, "utf8");

content = content.split("bg-[#000000]").join("bg-background");
content = content.split("bg-[#0a0a0a]").join("bg-card");

fs.writeFileSync(file, content);
console.log("Fixed colors");

