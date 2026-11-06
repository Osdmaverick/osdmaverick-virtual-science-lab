#!/usr/bin/env node
/**
 * Dependency-free smoke checks for the linked Grade 4–12 Virtual Science Lab pages.
 * Run from the repository root with: node scripts/qa-smoke-check.mjs
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expectedLabPages = 283;
const failures = [];
const report = (label, detail = "") => {
  console.log(`${failures.length ? "" : ""}[${detail ? "INFO" : "CHECK"}] ${label}${detail ? `: ${detail}` : ""}`);
};
const fail = (label, detail) => failures.push({ label, detail });
const read = (relativePath) => {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) throw new Error(`Missing file: ${relativePath}`);
  return fs.readFileSync(absolutePath, "utf8");
};

let directory;
let css;
let sharedJs;
try {
  directory = read("grade-levels.html");
  css = read("assets/styles.css");
  sharedJs = read("assets/main.js");
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const labLinks = [...directory.matchAll(/href=["']([^"'#?]+\.html)["']/gi)]
  .map((match) => match[1])
  .filter((href) => /^grade\d+[-\w]*\.html$/i.test(href));
const uniqueLinks = [...new Set(labLinks)];

if (uniqueLinks.length !== expectedLabPages) {
  fail("directory lab count", `expected ${expectedLabPages}, found ${uniqueLinks.length}`);
} else {
  report("directory lab count", `${uniqueLinks.length} unique links`);
}
if (labLinks.length !== uniqueLinks.length) {
  fail("directory duplicate links", `${labLinks.length - uniqueLinks.length} duplicate href(s)`);
}

try {
  new vm.Script(sharedJs, { filename: "assets/main.js" });
  report("shared JavaScript syntax");
} catch (error) {
  fail("shared JavaScript syntax", error.message);
}

const strippedCss = css.replace(/\/\*[\s\S]*?\*\//g, "");
const openBraces = (strippedCss.match(/{/g) || []).length;
const closeBraces = (strippedCss.match(/}/g) || []).length;
if (openBraces !== closeBraces) {
  fail("shared CSS brace balance", `${openBraces} opening vs ${closeBraces} closing braces`);
} else {
  report("shared CSS brace balance", `${openBraces} balanced rule blocks`);
}
if (!/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i.test(css)) {
  fail("reduced-motion CSS", "missing prefers-reduced-motion rule");
}
if (!/\.motion-toggle:focus-visible/.test(css)) {
  fail("keyboard focus styling", "missing visible focus rule for animation control");
}
if (!/@media\s*\(\s*max-width\s*:/i.test(css)) {
  fail("responsive stylesheet", "no mobile breakpoint found");
}
if (!/matchMedia\s*\(\s*['"]\(prefers-reduced-motion:\s*reduce\)['"]\s*\)/.test(sharedJs)) {
  fail("reduced-motion JavaScript", "shared script does not observe the user preference");
}

for (const href of uniqueLinks) {
  const relativePath = path.normalize(href);
  if (relativePath !== href || relativePath.startsWith("..") || relativePath.includes(path.sep)) {
    fail("safe lab link path", href);
    continue;
  }
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail("directory link target", `${href} does not exist`);
    continue;
  }

  const html = fs.readFileSync(absolutePath, "utf8");
  const mainClass = html.match(/<main\b[^>]*class=["']([^"']+)["']/i)?.[1]?.split(/\s+/) ?? [];
  if (!mainClass.includes("lab")) {
    fail("lab main landmark", `${href} must include the exact "lab" class token on main`);
  }
  if (!/name=["']viewport["']/i.test(html)) {
    fail("viewport metadata", `${href} has no viewport meta tag`);
  }
  if (!/href=["']assets\/styles\.css["']/i.test(html)) {
    fail("shared stylesheet reference", `${href} does not load assets/styles.css`);
  }
  if (!/<script\b[^>]*src=["']assets\/main\.js["']/i.test(html)) {
    fail("shared JavaScript reference", `${href} does not load assets/main.js`);
  }

  const ids = [...html.matchAll(/\sid=["']([^"']+)["']/gi)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) {
    fail("duplicate HTML IDs", `${href}: ${[...new Set(duplicateIds)].join(", ")}`);
  }

  const inlineScripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter((match) => !/\bsrc\s*=/.test(match[1]))
    .map((match) => match[2])
    .filter((source) => source.trim());
  inlineScripts.forEach((source, index) => {
    try {
      new vm.Script(source, { filename: `${href} inline script ${index + 1}` });
    } catch (error) {
      fail("inline JavaScript syntax", `${href} script ${index + 1}: ${error.message}`);
    }
  });
}

// Validate the new authentication and class-management entry points without
// requiring live Supabase credentials or a remote project.
for (const relativePath of ["assets/auth.js", "assets/classes.js", "assets/assignments.js"]) {
  try {
    new vm.Script(read(relativePath), { filename: relativePath });
    report(`JavaScript syntax: ${relativePath}`);
  } catch (error) {
    fail(`JavaScript syntax: ${relativePath}`, error.message);
  }
}

for (const relativePath of ["auth.html", "classes.html", "assignments.html"]) {
  try {
    const html = read(relativePath);
    if (!/name=["']viewport["']/i.test(html)) fail("viewport metadata", relativePath);
    if (!/href=["']assets\/styles\.css["']/i.test(html)) fail("shared stylesheet reference", relativePath);
    const ids = [...html.matchAll(/\sid=["']([^"']+)["']/gi)].map(match => match[1]);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length) fail("duplicate HTML IDs", `${relativePath}: ${[...new Set(duplicates)].join(", ")}`);
    report(`account/class page structure: ${relativePath}`);
  } catch (error) {
    fail("account/class page existence", error.message);
  }
}

try {
  const classSql = read("supabase/migrations/202611050002_classes.sql");
  for (const required of [
    "enable row level security",
    "current_user_is_teacher",
    "join_class",
    "class_invite_codes",
    "grant execute on function public.join_class(text) to authenticated"
  ]) {
    if (!classSql.toLowerCase().includes(required)) fail("class migration security feature", `missing ${required}`);
  }
  report("class migration security markers");
} catch (error) {
  fail("class migration existence", error.message);
}

try {
  const assignmentSql = read("supabase/migrations/202611050003_assignments.sql");
  for (const required of [
    "enable row level security",
    "create table if not exists public.assignments",
    "create table if not exists public.assignment_submissions",
    "enrolled students read published assignments",
    "students update ungraded work",
    "class teachers grade submissions",
    "grant update (score, teacher_feedback, graded_at, graded_by)",
    "grant update (response, status)"
  ]) {
    if (!assignmentSql.toLowerCase().includes(required)) {
      fail("assignment migration security feature", `missing ${required}`);
    }
  }
  for (const required of ["assignments.html", "assets/assignments.js"]) read(required);
  report("assignment migration security markers and workspace files");
} catch (error) {
  fail("assignment migration existence", error.message);
}

// Validate Phase 4 cloud sync client and database access controls.
try {
  new vm.Script(read("assets/cloud-sync.js"), { filename: "assets/cloud-sync.js" });
  const syncSql = read("supabase/migrations/202611060001_lab_notebook_sync.sql").toLowerCase();
  for (const required of [
    "create table if not exists public.lab_reports",
    "create table if not exists public.lab_report_assessments",
    "enable row level security",
    "students manage own class reports",
    "class teachers read student reports",
    "class teachers manage report assessments",
    "students read own report assessments",
    "public.is_class_student(class_id)",
    "public.is_class_teacher(r.class_id)"
  ]) {
    if (!syncSql.includes(required)) fail("cloud sync migration security feature", `missing ${required}`);
  }
  for (const relativePath of ["student-lab-notebook.html", "teacher-dashboard.html"]) {
    const html = read(relativePath);
    if (!html.includes('src="assets/cloud-sync.js"')) fail("cloud sync page integration", relativePath);
    if (!html.includes('src="assets/supabase-config.js"')) fail("cloud sync config integration", relativePath);
  }
  read("docs/PHASE-4-CLOUD-SYNC.md");
  report("Phase 4 cloud sync syntax, migration security and page integration");
} catch (error) {
  fail("Phase 4 cloud sync validation", error.message);
}


try {
  new vm.Script(read("assets/quizzes.js"), { filename: "assets/quizzes.js" });
  const quizSql = read("supabase/migrations/202611060002_quiz_attempts.sql").toLowerCase();
  for (const required of ["create table if not exists public.quiz_attempts","enable row level security","students submit and read own quiz attempts","class teachers read quiz attempts","public.is_class_student(class_id)","public.is_class_teacher(class_id)"]) {
    if (!quizSql.includes(required)) fail("quiz migration security feature", "missing " + required);
  }
  const quizHtml = read("quizzes.html");
  for (const required of ['id="quiz-options"','id="question-list"','id="submit-quiz"','id="attempt-history"','src="assets/quizzes.js"']) {
    if (!quizHtml.includes(required)) fail("quiz workspace integration", "missing " + required);
  }
  read("docs/PHASE-5-QUIZZES.md");
  report("Phase 5 quiz syntax, migration security and workspace integration");
} catch (error) {
  fail("Phase 5 quiz validation", error.message);
}


try {
  new vm.Script(read("assets/progress.js"), { filename: "assets/progress.js" });
  const progressHtml = read("progress.html");
  for (const required of ['id="progress-content"','id="progress-metrics"','id="class-filter"','id="activity-list"','src="assets/progress.js"']) {
    if (!progressHtml.includes(required)) fail("progress analytics workspace", "missing " + required);
  }
  read("docs/PHASE-6-PROGRESS-ANALYTICS.md");
  report("Phase 6 progress analytics syntax and workspace integration");
} catch (error) {
  fail("Phase 6 progress analytics validation", error.message);
}

const checkedCount = uniqueLinks.filter((href) => fs.existsSync(path.join(root, href))).length;
report("lab-page existence and structure", `${checkedCount}/${uniqueLinks.length} pages`);
report("inline JavaScript syntax", `${uniqueLinks.length} linked pages scanned`);

if (failures.length) {
  console.error(`\nQA failed with ${failures.length} issue(s):`);
  for (const item of failures) console.error(`- ${item.label}: ${item.detail}`);
  process.exitCode = 1;
} else {
  console.log("\nQA passed: all directory-linked lab pages passed the static smoke checks.");
}
