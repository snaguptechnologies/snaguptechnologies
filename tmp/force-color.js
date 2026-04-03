const fs = require("fs");

// File 1: My Courses
const file1 = "app/dashboard/student/page.tsx";
let c1 = fs.readFileSync(file1, "utf8");
c1 = c1.replace(
  `<p className="text-base font-black text-slate-900 dark:text-slate-50 leading-relaxed">"{enr.broadcast_message}"</p>`,
  `<p className="text-base font-black leading-relaxed" style={{ color: "var(--foreground)" }}>"{enr.broadcast_message}"</p>`
);
fs.writeFileSync(file1, c1);
console.log("Updated file1");

// File 2: Workspace
const file2 = "app/dashboard/student/workspace/[batchId]/page.tsx";
let c2 = fs.readFileSync(file2, "utf8");
c2 = c2.replace(
  `<p className="text-sm font-black text-slate-900 dark:text-slate-50 leading-relaxed italic">`,
  `<p className="text-sm font-black leading-relaxed italic" style={{ color: "var(--foreground)" }}>`
);
fs.writeFileSync(file2, c2);
console.log("Updated file2");

