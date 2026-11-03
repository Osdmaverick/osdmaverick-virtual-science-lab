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
const expectedLabPages = 274;
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
  if (!/<main\b[^>]*class=["'][^"']*\blab\b/i.test(html)) {
    fail("lab main landmark", `${href} has no main.lab landmark`);
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
