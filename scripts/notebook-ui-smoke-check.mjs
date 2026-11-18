import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('student-lab-notebook.html','utf8');
const js=fs.readFileSync('assets/cloud-notebook.js','utf8');
const migration=fs.readFileSync('supabase/migrations/202611180001_lab_notebook_sync.sql','utf8');
const tests=fs.readFileSync('supabase/tests/database/lab_notebook_sync.test.sql','utf8');

for(const id of ['notebook-status','report-form','report-title','report-class','report-question','report-method','report-evidence','report-conclusion','report-list','export-all','import-backup','restore-cloud','teacher-panel','teacher-report-list']) {
  assert.match(html,new RegExp('id="'+id+'"'),'notebook page contains '+id);
}
for(const id of ['report-title','report-class','report-question','report-method','report-evidence','report-conclusion']) {
  assert.match(html,new RegExp('label for="'+id+'"'),'notebook control '+id+' has an explicit label');
}
assert.match(html,/assets\/cloud-notebook\.js/);
assert.match(js,/sync_lab_report/);
assert.match(js,/save_lab_report_assessment/);
assert.match(js,/localStorage/);
assert.match(js,/createObjectURL/);
assert.match(js,/conflict detected/i);
assert.match(js,/textContent/);
assert.doesNotMatch(js,/\.innerHTML\s*=/,'user data is not inserted with innerHTML');
assert.match(migration,/enable row level security/);
assert.match(migration,/security definer/);
assert.match(migration,/p_expected_revision/);
assert.match(migration,/pg_column_size\(p_payload\) > 100000/);
assert.match(migration,/is_class_student/);
assert.match(migration,/is_class_teacher/);
assert.match(migration,/revoke all on function public\.sync_lab_report/);
assert.match(tests,/select plan\(23\)/);
assert.doesNotMatch(migration,/sb_secret_|service_role/i);
console.log('Notebook UI and migration smoke checks passed.');
