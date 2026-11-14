import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, js] = await Promise.all([
  readFile('classes.html', 'utf8'),
  readFile('assets/classes.js', 'utf8')
]);
const ids = [...html.matchAll(/\\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(ids.length, new Set(ids).size, 'class page element IDs must be unique');
for (const id of [
  'classes-account', 'classes-status', 'classes-login-prompt', 'classes-content',
  'teacher-create-panel', 'student-join-panel', 'create-class-form',
  'class-name', 'class-description', 'join-class-form', 'join-code',
  'class-list', 'classes-signout'
]) assert.ok(ids.includes(id), 'class page is missing #' + id);
for (const behavior of [
  'createClient', "from('classes')", "from('class_invite_codes')",
  "from('enrollments')", "rpc('join_class'", "auth.getSession",
  "from('profiles')", 'teacher_id === user.id'
]) assert.ok(js.includes(behavior), 'class client is missing ' + behavior);
assert.ok(!/sb_secret_[A-Za-z0-9]+|service_role\\s*[:=]/i.test(js + html),
  'secret keys must never appear in browser assets');
assert.ok(!/innerHTML\\s*=\\s*[^'"`]/.test(js),
  'untrusted class data must not be written through innerHTML');
console.log('Class management UI smoke checks passed.');
