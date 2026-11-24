import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, js, ignore, config] = await Promise.all([
  readFile('auth.html', 'utf8'),
  readFile('assets/auth.js', 'utf8'),
  readFile('.gitignore', 'utf8'),
  readFile('assets/supabase-config.example.js', 'utf8')
]);

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(ids.length, new Set(ids).size, 'auth page element IDs must be unique');

for (const id of [
  'signin-form', 'signup-form', 'reset-form', 'password-update-form',
  'signin-email', 'signin-password', 'signup-name', 'signup-email',
  'signup-password', 'reset-email', 'new-password', 'auth-status',
  'signed-in-panel', 'signout-button'
]) {
  assert.ok(ids.includes(id), 'auth page is missing #' + id);
}

for (const behavior of [
  'signInWithPassword', 'signUp', 'resetPasswordForEmail',
  'updateUser', 'PASSWORD_RECOVERY', 'onAuthStateChange',
  'publishableKey'
]) {
  assert.ok(js.includes(behavior), 'auth client is missing ' + behavior);
}

assert.ok(!/role\s*:\s*['"]teacher['"]/.test(js), 'browser signup must not assign teacher role');
assert.ok(!/sb_secret_[A-Za-z0-9]+|service_role\s*[:=]/i.test(js + html + config), 'secret keys must never appear in browser assets');
assert.ok(ignore.split(/\r?\n/).includes('assets/supabase-config.js'), 'real browser config must be git-ignored');
assert.ok(config.includes('publishableKey'), 'example config must use a publishable key');
console.log('Auth UI smoke checks passed.');
