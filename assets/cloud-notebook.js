(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const STORAGE_KEY = 'osdmaverick.lab-notebook.v1';
  const status = $('notebook-status');
  const config = window.SUPABASE_CONFIG;
  let client = null;
  let user = null;
  let profile = null;
  let reports = [];
  let editingId = null;
  let cloudReports = new Map();

  const setStatus = (message, error = false) => {
    status.textContent = message;
    status.dataset.state = error ? 'error' : 'success';
  };
  const makeId = () => window.crypto?.randomUUID?.() ||
    'report-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  const validPayload = payload => {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
    const fields = ['title','question','method','evidence','conclusion'];
    if (Object.keys(payload).length !== fields.length || fields.some(key => typeof payload[key] !== 'string')) return false;
    return payload.title.trim().length > 0 && payload.title.length <= 160 &&
      payload.question.length <= 4000 && payload.method.length <= 6000 &&
      payload.evidence.length <= 8000 && payload.conclusion.length <= 4000;
  };
  const validReport = item => item && typeof item === 'object' && !Array.isArray(item) &&
    typeof item.id === 'string' && item.id.length > 0 && item.id.length <= 160 &&
    validPayload(item.payload);
  const readLocal = () => {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(value)) return [];
      const seen = new Set();
      return value.filter(item => {
        if (!validReport(item) || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    } catch { return []; }
  };
  const writeLocal = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(reports)); return true; }
    catch { setStatus('Could not save on this device. Check available browser storage.', true); return false; }
  };
  const safeText = (value, fallback = '') => typeof value === 'string' ? value : fallback;
  const currentPayload = () => ({
    title: $('report-title').value.trim(),
    question: $('report-question').value.trim(),
    method: $('report-method').value.trim(),
    evidence: $('report-evidence').value.trim(),
    conclusion: $('report-conclusion').value.trim()
  });
  const fillEditor = report => {
    $('report-title').value = report.payload.title || '';
    $('report-question').value = report.payload.question || '';
    $('report-method').value = report.payload.method || '';
    $('report-evidence').value = report.payload.evidence || '';
    $('report-conclusion').value = report.payload.conclusion || '';
    $('report-class').value = report.classId || '';
    editingId = report.id;
    $('editor-heading').textContent = 'Edit investigation report';
    $('save-report').textContent = 'Save changes on this device';
    $('cancel-edit').hidden = false;
    $('editor-panel').scrollIntoView({behavior:'smooth',block:'start'});
  };
  const resetEditor = () => {
    $('report-form').reset();
    editingId = null;
    $('editor-heading').textContent = 'Create an investigation report';
    $('save-report').textContent = 'Save report on this device';
    $('cancel-edit').hidden = true;
  };
  const makeButton = (label, action, className = 'secondary') => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = className; button.textContent = label;
    button.addEventListener('click', action);
    return button;
  };
  function renderReports() {
    const list = $('report-list');
    list.replaceChildren();
    if (!reports.length) {
      const empty = document.createElement('p'); empty.textContent = 'No reports saved yet. Start an investigation above.';
      list.append(empty); return;
    }
    reports.sort((a,b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    for (const report of reports) {
      const card = document.createElement('article'); card.className = 'report-card';
      const heading = document.createElement('h3'); heading.textContent = safeText(report.payload.title,'Untitled investigation');
      const question = document.createElement('p'); question.textContent = safeText(report.payload.question,'No question recorded.');
      const meta = document.createElement('p'); meta.className = 'report-meta';
      meta.textContent = 'Saved ' + new Date(report.updatedAt || Date.now()).toLocaleString() +
        ' · ' + (report.syncState === 'synced' ? 'Cloud backed up' : 'Device only');
      const actions = document.createElement('div'); actions.className = 'notebook-actions';
      actions.append(
        makeButton('Edit', () => fillEditor(report)),
        makeButton('Sync', () => syncOne(report)),
        makeButton('Delete', () => {
          if (!window.confirm('Delete this report from this device? A cloud copy, if any, is not deleted.')) return;
          reports = reports.filter(item => item.id !== report.id); writeLocal(); renderReports(); setStatus('Local report deleted. Cloud backups are unchanged.');
        }, 'danger')
      );
      card.append(heading,question,meta,actions);
      const assessment = report.assessment;
      if (assessment) {
        const feedback = document.createElement('p');
        feedback.textContent = 'Teacher feedback: ' + safeText(assessment.feedback,'No written feedback.');
        card.append(feedback);
        const scores = document.createElement('p'); scores.className = 'report-meta';
        scores.textContent = 'Rubric · Question ' + assessment.scores.question + '/4 · Method ' + assessment.scores.method + '/4 · Evidence ' + assessment.scores.evidence + '/4 · Conclusion ' + assessment.scores.conclusion + '/4';
        card.append(scores);
      }
      list.append(card);
    }
  }

  $('report-form').addEventListener('submit', event => {
    event.preventDefault();
    const payload = currentPayload();
    if (!payload.title || !payload.question) return setStatus('Add an investigation title and scientific question.', true);
    const existing = reports.find(item => item.id === editingId);
    const record = {
      id: editingId || makeId(),
      classId: $('report-class').value || existing?.classId || null,
      payload,
      revision: existing?.revision || 0,
      syncState: existing?.syncState || 'local',
      updatedAt: new Date().toISOString(),
      assessment: existing?.assessment || null
    };
    if (existing) reports = reports.map(item => item.id === editingId ? record : item);
    else reports.push(record);
    if (!writeLocal()) return;
    resetEditor(); renderReports(); setStatus('Your report is saved on this device. Sync it when you are signed in and connected.');
  });
  $('cancel-edit').addEventListener('click', resetEditor);

  $('export-all').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({format:'osdmaverick-lab-notebook',version:1,reports},null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'osdmaverick-lab-notebook-backup.json'; anchor.click();
    URL.revokeObjectURL(url); setStatus('Notebook backup exported.');
  });
  $('import-backup').addEventListener('change', async event => {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      if (file.size > 2000000) throw new Error('Backup file is larger than 2 MB.');
      const parsed = JSON.parse(await file.text());
      const incoming = Array.isArray(parsed) ? parsed : parsed?.reports;
      if (!Array.isArray(incoming) || incoming.length > 500) throw new Error('This is not a supported notebook backup.');
      const merged = new Map(reports.map(item => [item.id,item]));
      let skipped = 0;
      for (const item of incoming) {
        if (!validReport(item)) { skipped++; continue; }
        if (!merged.has(item.id)) merged.set(item.id,{
          id:item.id,classId:typeof item.classId === 'string' ? item.classId : null,
          payload:{...item.payload},revision:Number.isInteger(item.revision) && item.revision >= 0 ? item.revision : 0,
          syncState:'local',updatedAt:typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
          assessment:null
        });
      }
      reports = [...merged.values()];
      if (!writeLocal()) return;
      renderReports(); setStatus('Backup imported. Existing reports and duplicate IDs were preserved; '+skipped+' invalid report(s) were skipped.');
    } catch(error) { setStatus(error.message || 'Could not import this backup.',true); }
    finally { event.target.value = ''; }
  });

  async function loadClasses() {
    if (!client || !user) return;
    const {data,error} = await client.from('classes').select('id,name,teacher_id').order('name');
    if (error) { setStatus('Could not load your classes: '+error.message,true); return; }
    const select = $('report-class'); select.replaceChildren();
    const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = 'Choose a class for cloud backup'; select.append(placeholder);
    (data || []).forEach(item => { const option=document.createElement('option'); option.value=item.id; option.textContent=item.name; select.append(option); });
    if (profile?.role === 'teacher') $('teacher-panel').hidden = false;
    if (profile?.role === 'teacher') renderTeacherReports(data || []);
  }

  async function syncOne(report) {
    if (!client || !user || profile?.role !== 'student') return setStatus('Sign in with a student account and configure Supabase before syncing.',true);
    const classId = report.classId || $('report-class').value;
    if (!classId) return setStatus('Choose an enrolled class before syncing this report.',true);
    setStatus('Synchronising report…');
    const {data,error} = await client.rpc('sync_lab_report',{
      p_class_id:classId,p_client_report_id:report.id,p_payload:report.payload,
      p_expected_revision:report.revision || 0,p_client_updated_at:report.updatedAt
    });
    if (error) return setStatus('Sync failed. Your device copy is safe. '+error.message,true);
    const result = Array.isArray(data) ? data[0] : data;
    if (result?.conflict) {
      report.classId = classId; report.syncState = 'conflict'; writeLocal(); renderReports();
      const {data:cloud,error:readError} = await client.from('lab_reports')
        .select('id,client_report_id,payload,revision,updated_at,class_id')
        .eq('class_id',classId).eq('client_report_id',report.id).maybeSingle();
      if (readError) return setStatus('A newer cloud version exists, but could not be loaded. Your local copy is safe.',true);
      if (cloud && window.confirm('A newer cloud version exists. Replace your local copy with that cloud version? Choose Cancel to keep your local work and resolve the conflict manually.')) {
        report.payload = cloud.payload; report.revision = cloud.revision; report.updatedAt = cloud.updated_at; report.syncState='synced';
        writeLocal(); renderReports(); setStatus('Local report updated from the cloud. Review it before editing.');
      } else setStatus('Sync conflict detected. Your local copy was kept; no version was overwritten.',true);
      return;
    }
    report.classId = classId; report.revision = result?.revision || report.revision || 1;
    report.syncState = 'synced'; report.cloudUpdatedAt = result?.updated_at || new Date().toISOString();
    writeLocal(); renderReports(); setStatus('Report backed up to the selected class.');
  }

  async function restoreCloud() {
    if (!client || !user || profile?.role !== 'student') return setStatus('Sign in with a student account to restore cloud reports.',true);
    setStatus('Loading your cloud reports…');
    const {data,error} = await client.from('lab_reports')
      .select('id,class_id,client_report_id,payload,revision,updated_at,lab_report_assessments(scores,feedback,assessed_at)')
      .order('updated_at',{ascending:false});
    if (error) return setStatus('Could not restore reports: '+error.message,true);
    let added=0, refreshed=0, preserved=0;
    for (const cloud of data || []) {
      const local = reports.find(item => item.id === cloud.client_report_id && item.classId === cloud.class_id);
      const assessment = Array.isArray(cloud.lab_report_assessments) ? cloud.lab_report_assessments[0] : cloud.lab_report_assessments;
      if (local) {
        if (local.revision < cloud.revision) {
          const replace = window.confirm('A newer cloud version of "' + safeText(cloud.payload.title,'this report') + '" exists. Replace the copy on this device? Choose Cancel to keep your local work.');
          if (replace) {
            local.payload=cloud.payload; local.revision=cloud.revision; local.updatedAt=cloud.updated_at; local.syncState='synced';
            refreshed++;
          } else preserved++;
        }
        if (assessment) local.assessment={scores:assessment.scores,feedback:assessment.feedback};
      } else {
        reports.push({id:cloud.client_report_id,classId:cloud.class_id,payload:cloud.payload,revision:cloud.revision,updatedAt:cloud.updated_at,syncState:'synced',assessment:assessment?{scores:assessment.scores,feedback:assessment.feedback}:null});
        added++;
      }
    }
    writeLocal(); renderReports(); setStatus('Cloud restore complete: '+added+' added, '+refreshed+' updated, '+preserved+' newer cloud versions left untouched on this device.');
  }
  $('restore-cloud').addEventListener('click',restoreCloud);

  async function renderTeacherReports(classes) {
    const list=$('teacher-report-list'); list.replaceChildren();
    const own=classes.filter(item=>item.teacher_id===user.id);
    if (!own.length) { const p=document.createElement('p');p.textContent='No classes are available for review.';list.append(p);return; }
    for (const klass of own) {
      const {data,error}=await client.from('lab_reports')
        .select('id,client_report_id,student_id,payload,updated_at,lab_report_assessments(scores,feedback)')
        .eq('class_id',klass.id).order('updated_at',{ascending:false});
      if(error){const p=document.createElement('p');p.textContent='Could not load '+klass.name+': '+error.message;list.append(p);continue;}
      const heading=document.createElement('h3');heading.textContent=klass.name;list.append(heading);
      for(const report of data||[]){
        const card=document.createElement('article');card.className='report-card';
        const title=document.createElement('h3');title.textContent=safeText(report.payload.title,'Untitled report');
        const question=document.createElement('p');question.textContent='Question: '+safeText(report.payload.question);
        const evidence=document.createElement('p');evidence.textContent='Evidence: '+safeText(report.payload.evidence,'Not provided');
        const feedbackLabel=document.createElement('label');feedbackLabel.textContent='Teacher feedback';feedbackLabel.htmlFor='feedback-'+report.id;
        const feedback=document.createElement('textarea');feedback.id='feedback-'+report.id;feedback.maxLength=3000;feedback.value=report.lab_report_assessments?.[0]?.feedback||'';
        const rubric=document.createElement('div');rubric.className='rubric';
        const scores={};
        for(const key of ['question','method','evidence','conclusion']){
          const wrap=document.createElement('label');wrap.textContent=key[0].toUpperCase()+key.slice(1);
          const select=document.createElement('select');select.setAttribute('aria-label',key+' rubric score');
          for(let n=0;n<=4;n++){const option=document.createElement('option');option.value=String(n);option.textContent=n+' / 4';select.append(option);}
          const prior=report.lab_report_assessments?.[0]?.scores?.[key];if(prior!==undefined)select.value=String(prior);
          scores[key]=select;wrap.append(select);rubric.append(wrap);
        }
        const save=makeButton('Save rubric assessment',async()=>{
          save.disabled=true;
          const payload=Object.fromEntries(Object.entries(scores).map(([key,select])=>[key,Number(select.value)]));
          const {error:saveError}=await client.rpc('save_lab_report_assessment',{p_lab_report_id:report.id,p_scores:payload,p_feedback:feedback.value});
          save.disabled=false;
          if(saveError)return setStatus('Assessment could not be saved: '+saveError.message,true);
          setStatus('Assessment saved for '+safeText(report.payload.title,'this report')+'.');
        });
        card.append(title,question,evidence,feedbackLabel,feedback,rubric,save);list.append(card);
      }
    }
    if(!list.children.length){const p=document.createElement('p');p.textContent='No cloud reports have been submitted to your classes yet.';list.append(p);}
  }

  async function initialise() {
    reports=readLocal();renderReports();
    if(!config?.url||!config?.publishableKey||config.url.includes('YOUR-PROJECT-REF')||config.publishableKey.includes('YOUR_KEY')||!window.supabase?.createClient){
      $('notebook-account').textContent='Not signed in · device-only notebook';
      $('notebook-cloud-state').textContent='Cloud status: not configured';
      $('notebook-setup').hidden=false;setStatus('Your notebook is ready for local use. Cloud backup will become available after administrator setup.');return;
    }
    client=window.supabase.createClient(config.url,config.publishableKey);
    const {data,error}=await client.auth.getSession();
    if(error){setStatus(error.message,true);return;}
    user=data.session?.user||null;
    if(!user){$('notebook-account').textContent='Not signed in · device-only notebook';$('notebook-cloud-state').textContent='Cloud status: sign in required';$('notebook-setup').hidden=false;setStatus('You can continue using this notebook locally. Sign in to enable cloud backup.');return;}
    const {data:person,error:profileError}=await client.from('profiles').select('full_name,role').eq('id',user.id).maybeSingle();
    if(profileError||!person){$('notebook-account').textContent=user.email||'Signed in';$('notebook-cloud-state').textContent='Cloud status: profile unavailable';return setStatus('Your account profile is unavailable. Check the identity database setup.',true);}
    profile=person;$('notebook-account').textContent=(person.full_name||user.email)+' · '+person.role;
    $('notebook-cloud-state').textContent='Cloud status: connected';
    await loadClasses();
    setStatus('Signed in. Local reports are preserved; cloud backup is available.');
    client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'){user=null;$('notebook-cloud-state').textContent='Cloud status: sign in required';setStatus('Signed out. Your device reports remain available.');}});
  }
  initialise();
})();