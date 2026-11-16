(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const status = $('assignments-status');
  const setStatus = (message, error = false) => {
    status.textContent = message;
    status.dataset.state = error ? 'error' : 'success';
  };
  const config = window.SUPABASE_CONFIG;
  if (!config?.url || !config?.publishableKey ||
      config.url.includes('YOUR-PROJECT-REF') ||
      config.publishableKey.includes('YOUR-SUPABASE')) {
    $('assignments-content').hidden = true;
    setStatus('Assignments are not connected yet. Complete the Supabase setup and apply the Phase 1–3 migrations.', true);
    return;
  }
  if (!window.supabase?.createClient) {
    setStatus('The account service could not load. Check your connection and reload.', true);
    return;
  }

  const client = window.supabase.createClient(config.url, config.publishableKey);
  let currentUser = null;
  let currentRole = 'student';
  const element = (tag, className, content) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  };
  const button = (label, action, className = 'secondary') => {
    const node = element('button', className, label);
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
  };

  async function loadTeacherAssignments() {
    const list = $('assignment-list');
    list.replaceChildren();
    const { data: assignments, error } = await client.from('assignments')
      .select('id,class_id,title,instructions,due_at,points_possible,status,created_at')
      .order('created_at', { ascending: false });
    if (error) return setStatus('Could not load assignments: ' + error.message, true);
    if (!assignments?.length) {
      list.append(element('p', 'assignment-empty', 'No assignments yet. Create your first class assignment above.'));
      return;
    }
    const { data: classes } = await client.from('classes').select('id,name');
    const classNames = new Map((classes || []).map(item => [item.id, item.name]));
    for (const assignment of assignments) {
      const card = element('article', 'assignment-card');
      card.append(element('h3', '', assignment.title));
      card.append(element('p', 'assignment-meta', (classNames.get(assignment.class_id) || 'Class') + ' · ' + assignment.points_possible + ' points'));
      const state = element('span', 'assignment-status', assignment.status);
      state.dataset.status = assignment.status;
      card.append(state);
      if (assignment.due_at) card.append(element('p', 'assignment-meta', 'Due: ' + new Date(assignment.due_at).toLocaleString()));
      if (assignment.instructions) card.append(element('p', '', assignment.instructions));
      if (assignment.status === 'draft') card.append(button('Publish', () => changeStatus(assignment.id, 'published')));
      if (assignment.status === 'published') card.append(button('Archive', () => changeStatus(assignment.id, 'archived')));
      if (assignment.status === 'archived') card.append(button('Republish', () => changeStatus(assignment.id, 'published')));
      card.append(button('Delete', () => deleteAssignment(assignment.id), 'danger'));
      const { data: submissions, error: submissionError } = await client.from('assignment_submissions')
        .select('id,student_id,response,status,submitted_at,score,feedback,profiles(full_name)')
        .eq('assignment_id', assignment.id).order('submitted_at', { ascending: true });
      const heading = element('h4', '', 'Student submissions');
      card.append(heading);
      if (submissionError) {
        card.append(element('p', 'assignment-meta', 'Submissions unavailable: ' + submissionError.message));
      } else if (!submissions?.length) {
        card.append(element('p', 'assignment-meta', 'No submissions yet.'));
      } else {
        for (const submission of submissions) {
          const panel = element('div', 'submission');
          panel.append(element('strong', '', submission.profiles?.full_name || 'Student'));
          panel.append(element('p', 'assignment-meta', submission.status + (submission.submitted_at ? ' · ' + new Date(submission.submitted_at).toLocaleString() : '')));
          panel.append(element('p', '', submission.response || 'No response provided.'));
          if (submission.score !== null) panel.append(element('p', '', 'Score: ' + submission.score + ' / ' + assignment.points_possible));
          const gradeForm = element('form', '');
          const scoreLabel = element('label', '', 'Score');
          const score = element('input');
          score.type = 'number'; score.min = '0'; score.max = String(assignment.points_possible);
          score.required = true; score.value = submission.score === null ? '' : String(submission.score);
          const feedbackLabel = element('label', '', 'Feedback');
          const feedback = element('textarea');
          feedback.maxLength = 10000; feedback.rows = 2; feedback.value = submission.feedback || '';
          const submit = element('button', '', 'Save grade and feedback'); submit.type = 'submit';
          gradeForm.append(scoreLabel, score, feedbackLabel, feedback, submit);
          gradeForm.addEventListener('submit', async event => {
            event.preventDefault(); submit.disabled = true;
            const { error } = await client.rpc('grade_assignment_submission', {
              p_submission_id: submission.id,
              p_score: Number(score.value),
              p_feedback: feedback.value.trim()
            });
            submit.disabled = false;
            if (error) return setStatus('Grade could not be saved: ' + error.message, true);
            setStatus('Grade and feedback saved.');
            await loadTeacherAssignments();
          });
          panel.append(gradeForm);
          card.append(panel);
        }
      }
      list.append(card);
    }
  }

  async function loadStudentAssignments() {
    const list = $('assignment-list');
    list.replaceChildren();
    const { data: assignments, error } = await client.from('assignments')
      .select('id,class_id,title,instructions,due_at,points_possible,status,classes(name)')
      .eq('status', 'published').order('due_at', { ascending: true, nullsFirst: false });
    if (error) return setStatus('Could not load assignments: ' + error.message, true);
    if (!assignments?.length) {
      list.append(element('p', 'assignment-empty', 'There are no published assignments in your classes yet.'));
      return;
    }
    for (const assignment of assignments) {
      const card = element('article', 'assignment-card');
      card.append(element('h3', '', assignment.title));
      card.append(element('p', 'assignment-meta', (assignment.classes?.name || 'Your class') + ' · ' + assignment.points_possible + ' points'));
      if (assignment.due_at) card.append(element('p', 'assignment-meta', 'Due: ' + new Date(assignment.due_at).toLocaleString()));
      card.append(element('p', '', assignment.instructions || 'No additional instructions.'));
      const { data: existing, error: submissionError } = await client.from('assignment_submissions')
        .select('id,response,status,submitted_at,score,feedback,graded_at')
        .eq('assignment_id', assignment.id).eq('student_id', currentUser.id).maybeSingle();
      if (submissionError) {
        card.append(element('p', 'assignment-meta', 'Your submission could not be loaded.'));
      } else if (existing?.score !== null && existing?.score !== undefined) {
        card.append(element('p', 'assignment-status', 'Graded · ' + existing.score + ' / ' + assignment.points_possible));
        card.append(element('p', '', existing.feedback || 'No written feedback was provided.'));
        card.append(element('p', 'assignment-meta', 'This submission is locked after grading.'));
      } else {
        const form = element('form', 'submission');
        const label = element('label', '', 'Your response');
        const response = element('textarea');
        response.maxLength = 50000; response.rows = 5; response.required = true;
        response.value = existing?.response || '';
        const submit = element('button', '', existing ? 'Update and submit work' : 'Submit work');
        submit.type = 'submit';
        form.append(label, response, submit);
        form.addEventListener('submit', async event => {
          event.preventDefault(); submit.disabled = true;
          let result;
          if (existing) {
            result = await client.from('assignment_submissions')
              .update({ response: response.value.trim(), status: 'submitted' })
              .eq('id', existing.id);
          } else {
            result = await client.from('assignment_submissions').insert({
              assignment_id: assignment.id,
              student_id: currentUser.id,
              response: response.value.trim(),
              status: 'submitted'
            });
          }
          submit.disabled = false;
          if (result.error) return setStatus('Your work could not be submitted: ' + result.error.message, true);
          setStatus('Your work has been submitted.');
          await loadStudentAssignments();
        });
        card.append(form);
        if (existing?.status === 'submitted') card.append(element('p', 'assignment-meta', 'Submitted. You may update your work until it is graded.'));
      }
      list.append(card);
    }
  }

  async function changeStatus(id, nextStatus) {
    const { error } = await client.from('assignments').update({ status: nextStatus }).eq('id', id);
    if (error) return setStatus('Assignment could not be updated: ' + error.message, true);
    setStatus('Assignment status updated.');
    await loadTeacherAssignments();
  }
  async function deleteAssignment(id) {
    if (!window.confirm('Delete this assignment and its submissions? This cannot be undone.')) return;
    const { error } = await client.from('assignments').delete().eq('id', id);
    if (error) return setStatus('Assignment could not be deleted: ' + error.message, true);
    setStatus('Assignment deleted.');
    await loadTeacherAssignments();
  }

  async function initialise() {
    const { data, error } = await client.auth.getSession();
    if (error) return setStatus(error.message, true);
    currentUser = data.session?.user || null;
    if (!currentUser) {
      $('assignments-login-prompt').hidden = false;
      $('assignments-content').hidden = true;
      return setStatus('Sign in to access your assignments.');
    }
    const { data: profile, error: profileError } = await client.from('profiles')
      .select('full_name,role').eq('id', currentUser.id).maybeSingle();
    if (profileError || !profile) return setStatus('Your account profile is unavailable. Apply the Phase 1 migration and sign in again.', true);
    currentRole = profile.role;
    $('assignments-account').textContent = (profile.full_name || currentUser.email) + ' · ' + (currentRole === 'teacher' ? 'Teacher' : 'Student');
    $('assignments-login-prompt').hidden = true;
    $('assignments-content').hidden = false;
    $('teacher-assignment-panel').hidden = currentRole !== 'teacher';
    $('assignment-list-heading').textContent = currentRole === 'teacher' ? 'Assignments in your classes' : 'Published class assignments';
    if (currentRole === 'teacher') {
      const select = $('assignment-class');
      select.replaceChildren(element('option', '', 'Choose a class'));
      select.options[0].value = '';
      const { data: classes, error: classError } = await client.from('classes').select('id,name').order('name');
      if (classError) return setStatus('Could not load your classes: ' + classError.message, true);
      for (const item of classes || []) {
        const option = element('option', '', item.name); option.value = item.id; select.append(option);
      }
      await loadTeacherAssignments();
    } else {
      await loadStudentAssignments();
    }
    setStatus('Your assignment list is up to date.');
  }

  $('create-assignment-form').addEventListener('submit', async event => {
    event.preventDefault();
    const submit = $('save-assignment-button'); submit.disabled = true;
    const dueValue = $('assignment-due').value;
    const { error } = await client.from('assignments').insert({
      class_id: $('assignment-class').value,
      title: $('assignment-title').value.trim(),
      instructions: $('assignment-instructions').value.trim(),
      due_at: dueValue ? new Date(dueValue).toISOString() : null,
      points_possible: Number($('assignment-points').value),
      status: 'draft'
    });
    submit.disabled = false;
    if (error) return setStatus('Assignment could not be saved: ' + error.message, true);
    $('create-assignment-form').reset();
    $('assignment-points').value = '100';
    setStatus('Assignment saved as a draft.');
    await loadTeacherAssignments();
  });

  $('assignments-signout').addEventListener('click', async () => {
    const { error } = await client.auth.signOut();
    if (error) return setStatus(error.message, true);
    window.location.href = 'auth.html';
  });
  initialise();
})();
