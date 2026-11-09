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
for (const relativePath of ["assets/auth.js", "assets/classes.js", "assets/assignments.js", "assets/content-studio.js", "assets/class-calendar.js", "assets/class-attendance.js"]) {
  try {
    new vm.Script(read(relativePath), { filename: relativePath });
    report(`JavaScript syntax: ${relativePath}`);
  } catch (error) {
    fail(`JavaScript syntax: ${relativePath}`, error.message);
  }
}

for (const relativePath of ["auth.html", "classes.html", "assignments.html", "class-calendar.html", "class-attendance.html"]) {
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

// Validate Phase 14 attendance tables, client syntax and row-level security.
try {
  const attendanceClient = read("assets/class-attendance.js");
  new vm.Script(attendanceClient, { filename: "assets/class-attendance.js" });
  for (const required of ['migrations 1–14','attendance_sessions','attendance_records','student_id===user.id']) {
    if (!attendanceClient.includes(required)) fail("class attendance client feature", `missing ${required}`);
  }
  report("class attendance client syntax and privacy markers");
} catch (error) {
  fail("class attendance client", error.message);
}
try {
  const attendanceSql = read("supabase/migrations/202611090001_class_attendance.sql").toLowerCase();
  for (const required of [
    "create table if not exists public.attendance_sessions",
    "create table if not exists public.attendance_records",
    "enable row level security",
    "teachers manage attendance sessions",
    "enrolled students read attendance sessions",
    "teachers manage enrolled learner attendance",
    "students read their own attendance",
    "public.is_class_teacher(class_id)",
    "public.is_class_student(class_id)"
  ]) {
    if (!attendanceSql.includes(required)) fail("class attendance migration security feature", `missing ${required}`);
  }
  report("class attendance migration security markers");
} catch (error) {
  fail("class attendance migration existence", error.message);
}

// Validate Phase 13 class calendar structure, client syntax and row-level security.
try {
  const calendarClient = read("assets/class-calendar.js");
  if (!calendarClient.includes('.eq("status","published")')) {
    fail("class calendar deadline visibility", "assignment deadlines must be limited to published assignments");
  } else {
    report("class calendar shows only published assignment deadlines");
  }
} catch (error) {
  fail("class calendar deadline visibility", error.message);
}

try {
  const calendarSql = read("supabase/migrations/202611070005_class_calendar.sql").toLowerCase();
  for (const required of [
    "create table if not exists public.class_events",
    "enable row level security",
    "teachers manage events in their classes",
    "enrolled students read class events",
    "public.is_class_teacher(class_id)",
    "public.is_class_student(class_id)",
    "grant insert (class_id,teacher_id,title,description,event_type,starts_at,ends_at,all_day)",
    "grant update (title,description,event_type,starts_at,ends_at,all_day)"
  ]) {
    if (!calendarSql.includes(required)) fail("class calendar migration security feature", `missing ${required}`);
  }
  report("class calendar migration security markers");
} catch (error) {
  fail("class calendar migration existence", error.message);
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

// Validate Phase 7 teacher content management and class-scoped access controls.
try {
  new vm.Script(read("assets/content-studio.js"), { filename: "assets/content-studio.js" });
  const contentSql = read("supabase/migrations/202611060003_teacher_content.sql").toLowerCase();
  for (const required of [
    "create table if not exists public.teacher_content_items",
    "enable row level security",
    "teachers manage content in their classes",
    "students read published learning content",
    "public.is_class_teacher(class_id)",
    "public.is_class_student(class_id)",
    "content_type in ('lesson','practical','resource','question')",
    "revoke all on public.teacher_content_items from anon, authenticated"
  ]) {
    if (!contentSql.includes(required)) fail("content migration security feature", "missing " + required);
  }
  const contentHtml = read("content-studio.html");
  for (const required of ['id="content-form"','id="content-class"','id="content-type"','id="content-list"','src="assets/content-studio.js"']) {
    if (!contentHtml.includes(required)) fail("content studio integration", "missing " + required);
  }
  read("docs/PHASE-7-CONTENT-MANAGEMENT.md");
  report("Phase 7 content studio syntax, migration security and page integration");
} catch (error) {
  fail("Phase 7 content management validation", error.message);
}

// Validate Phase 8 student learning experience and progress access controls.
try {
  new vm.Script(read("assets/student-learning.js"), { filename: "assets/student-learning.js" });
  const learningSql = read("supabase/migrations/202611060004_student_learning_progress.sql").toLowerCase();
  for (const required of [
    "create table if not exists public.student_content_progress",
    "enable row level security",
    "students manage own published content progress",
    "teachers read progress in their classes",
    "public.is_class_student(class_id)",
    "public.is_class_teacher(class_id)",
    "student_content_progress_student_item_unique",
    "revoke all on public.student_content_progress from anon, authenticated"
  ]) {
    if (!learningSql.includes(required)) fail("student learning migration security feature", "missing " + required);
  }
  const learningHtml = read("student-learning.html");
  for (const required of ['id="learning-workspace"','id="learning-list"','id="learning-detail"','id="learning-complete"','src="assets/student-learning.js"']) {
    if (!learningHtml.includes(required)) fail("student learning workspace integration", "missing " + required);
  }
  read("docs/PHASE-8-STUDENT-LEARNING.md");
  report("Phase 8 student learning syntax, migration security and workspace integration");
} catch (error) {
  fail("Phase 8 student learning validation", error.message);
}

// Validate Phase 9 teacher-built class quizzes and server-side marking.
try {
  new vm.Script(read("assets/class-quizzes.js"), { filename: "assets/class-quizzes.js" });
  const quizSql = read("supabase/migrations/202611060005_class_quiz_builder.sql").toLowerCase();
  for (const required of [
    "create table if not exists public.class_quizzes",
    "create table if not exists public.class_quiz_questions",
    "create table if not exists public.class_quiz_answer_keys",
    "create table if not exists public.class_quiz_attempts",
    "students read published class quizzes",
    "teachers manage quiz answer keys",
    "create or replace function public.submit_class_quiz",
    "validate_class_quiz_publish",
    "public.class_quiz_attempts",
    "security definer",
    "public.is_class_student(v_class)",
    "revoke all on function public.submit_class_quiz(uuid,jsonb) from public,anon"
  ]) {
    if (!quizSql.includes(required)) fail("class quiz security feature", "missing " + required);
  }
  const quizHtml = read("class-quizzes.html");
  for (const required of ['id="cq-form"','id="cq-bank"','id="cq-take-form"','id="cq-submit"','src="assets/class-quizzes.js"']) {
    if (!quizHtml.includes(required)) fail("class quiz builder integration", "missing " + required);
  }
  if (!read("assets/progress.js").includes("class_quiz_attempts")) fail("class quiz analytics integration", "progress dashboard does not read secure class quiz attempts");
  read("docs/PHASE-9-CLASS-QUIZZES.md");
  report("Phase 9 quiz builder syntax, server marking and RLS integration");
} catch (error) {
  fail("Phase 9 class quiz validation", error.message);
}

// Validate Phase 10 class announcements and student read receipts.
try {
  new vm.Script(read("assets/class-announcements.js"), { filename: "assets/class-announcements.js" });
  const announcementSql = read("supabase/migrations/202611070002_class_announcements.sql").toLowerCase();
  for (const required of [
    "create table if not exists public.class_announcements",
    "create table if not exists public.class_announcement_reads",
    "enable row level security",
    "teachers manage their class announcements",
    "students read published class announcements",
    "students manage own announcement read receipts",
    "class teachers read announcement receipts",
    "public.is_class_teacher(class_id)",
    "public.is_class_student(class_id)",
    "revoke all on public.class_announcements, public.class_announcement_reads from anon, authenticated"
  ]) {
    if (!announcementSql.includes(required)) fail("class announcements security feature", "missing " + required);
  }
  const announcementHtml = read("class-announcements.html");
  for (const required of ['id="announce-form"','id="announce-class"','id="announce-list"','id="announce-summary"','src="assets/class-announcements.js"']) {
    if (!announcementHtml.includes(required)) fail("class announcements page integration", "missing " + required);
  }
  read("docs/PHASE-10-CLASS-ANNOUNCEMENTS.md");
  report("Phase 10 announcements syntax, RLS and page integration");
} catch (error) {
  fail("Phase 10 class announcements validation", error.message);
}


// Validate Phase 11 in-app notification inbox and recipient-only read state.
try {
  new vm.Script(read("assets/notifications.js"), { filename: "assets/notifications.js" });
  const notificationSql = read("supabase/migrations/202611070003_notifications.sql").toLowerCase();
  for (const required of [
    "create table if not exists public.notifications",
    "enable row level security",
    "users read their own notifications",
    "users mark their own notifications read",
    "recipient_id = auth.uid()",
    "notify_students_of_announcement",
    "after insert or update of status",
    "on conflict (recipient_id, source_type, source_id) do nothing",
    "revoke all on public.notifications from anon, authenticated",
    "grant update (read_at) on public.notifications to authenticated"
  ]) {
    if (!notificationSql.includes(required)) fail("notifications security feature", "missing " + required);
  }
  const notificationHtml = read("notifications.html");
  for (const required of ['id="notice-workspace"','id="notice-list"','id="notice-read-all"','src="assets/notifications.js"']) {
    if (!notificationHtml.includes(required)) fail("notifications page integration", "missing " + required);
  }
  read("docs/PHASE-11-IN-APP-NOTIFICATIONS.md");
  report("Phase 11 notification syntax, recipient RLS and inbox integration");
} catch (error) {
  fail("Phase 11 notifications validation", error.message);
}


// Validate Phase 12 assessment notifications and restricted trigger paths.
try {
  const assessmentSql = read("supabase/migrations/202611070004_assessment_notifications.sql").toLowerCase();
  for (const required of [
    "assignment_graded",
    "lab_report_assessed",
    "notify_student_of_assignment_grade",
    "notify_student_of_lab_assessment",
    "after update of score, teacher_feedback, graded_at",
    "after insert or update of scores, feedback, assessed_at",
    "on conflict (recipient_id, source_type, source_id) do update",
    "read_at = null"
  ]) {
    if (!assessmentSql.includes(required)) fail("assessment notification feature", "missing " + required);
  }
  read("docs/PHASE-12-ASSESSMENT-NOTIFICATIONS.md");
  report("Phase 12 assignment and lab assessment notification triggers");
} catch (error) {
  fail("Phase 12 assessment notifications validation", error.message);
}

// Validate Phase 15 student learning goals, append-only teacher feedback and RLS.
try {
  new vm.Script(read("assets/learning-goals.js"), { filename: "assets/learning-goals.js" });
  const goalsSql = read("supabase/migrations/202611090002_learning_goals.sql").toLowerCase();
  for (const required of [
    "create table if not exists public.learning_goals",
    "create table if not exists public.learning_goal_reviews",
    "enable row level security",
    "students manage their own class learning goals",
    "teachers read goals in their classes",
    "teachers write reviews for goals in their classes",
    "students read reviews on their own goals",
    "public.is_class_student(class_id)",
    "public.is_class_teacher(class_id)",
    "revoke all on public.learning_goals, public.learning_goal_reviews from anon, authenticated"
  ]) {
    if (!goalsSql.includes(required)) fail("learning goals security feature", "missing " + required);
  }
  const goalsHtml = read("learning-goals.html");
  for (const required of ['id="goals-workspace"','id="goals-create-form"','id="goals-list"','src="assets/learning-goals.js"']) {
    if (!goalsHtml.includes(required)) fail("learning goals page integration", "missing " + required);
  }
  read("docs/PHASE-15-LEARNING-GOALS.md");
  report("Phase 15 learning goals syntax, RLS and page integration");
} catch (error) {
  fail("Phase 15 learning goals validation", error.message);
}

// Validate Phase 16 student portfolio, teacher reviews and certificates.
try {
  new vm.Script(read("assets/student-portfolio.js"), { filename: "assets/student-portfolio.js" });
  const portfolioSql = read("supabase/migrations/202611090003_student_portfolios.sql").toLowerCase();
  for (const required of [
    "create table if not exists public.student_portfolio_entries",
    "create table if not exists public.student_portfolio_reviews",
    "create table if not exists public.achievement_certificates",
    "enable row level security",
    "students manage their own class portfolio entries",
    "teachers read portfolio entries in their classes",
    "teachers write portfolio reviews in their classes",
    "students read reviews on their own portfolio entries",
    "students read their own achievement certificates",
    "teachers issue certificates in their classes",
    "public.is_class_teacher(class_id)",
    "public.is_class_student(class_id)",
    "e.student_id = achievement_certificates.student_id",
    "revoke all on public.student_portfolio_entries, public.student_portfolio_reviews, public.achievement_certificates from anon, authenticated"
  ]) {
    if (!portfolioSql.includes(required)) fail("student portfolio security feature", "missing " + required);
  }
  const portfolioHtml = read("student-portfolio.html");
  for (const required of ['id="portfolio-workspace"','id="portfolio-form"','id="portfolio-list"','id="certificate-list"','src="assets/student-portfolio.js"']) {
    if (!portfolioHtml.includes(required)) fail("student portfolio integration", "missing " + required);
  }
  read("docs/PHASE-16-STUDENT-PORTFOLIO.md");
  for (const relativePath of ["index.html","teacher-dashboard.html","student-learning.html","learning-goals.html"]) {
    if (!read(relativePath).includes("student-portfolio.html")) fail("student portfolio navigation", relativePath);
  }
  report("Phase 16 portfolio syntax, RLS, certificate and navigation integration");
} catch (error) {
  fail("Phase 16 student portfolio validation", error.message);
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
