import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync('assignments.html', 'utf8');
const js = fs.readFileSync('assets/assignments.js', 'utf8');
const migration = fs.readFileSync('supabase/migrations/202611150001_assignments.sql', 'utf8');

for (const id of [
  'assignments-status', 'assignments-login-prompt', 'assignments-account-toolbar', 'assignments-content',
  'teacher-assignment-panel', 'create-assignment-form', 'assignment-class',
  'assignment-title', 'assignment-instructions', 'assignment-points', 'cancel-assignment-edit',
  'assignment-list', 'assignments-signout'
]) assert.match(html, new RegExp('id="' + id + '"'), 'page contains ' + id);

assert.match(html, /assets\/assignments\.js/);
assert.match(js, /grade_assignment_submission/);
assert.match(js, /function beginEdit/);
assert.match(js, /Save changes/);
assert.match(js, /cancel-assignment-edit/);
assert.match(js, /\.textContent/);
assert.match(js, /createElement/);
assert.doesNotMatch(js, /\.innerHTML\s*=/, 'user-facing data is not injected with innerHTML');
assert.match(migration, /enable row level security/i);
assert.match(migration, /grade_assignment_submission/);
assert.match(migration, /revoke all on function public\.grade_assignment_submission/i);
assert.match(migration, /grant execute on function public\.grade_assignment_submission[^;]+to authenticated/i);
assert.doesNotMatch(migration, /sb_secret_|service_role/i);

console.log('Assignments UI smoke checks passed.');
