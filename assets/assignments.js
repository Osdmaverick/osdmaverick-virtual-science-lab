(() => {
  const $ = id => document.getElementById(id);
  const status = $('assignment-status');
  const setStatus = (message, error = false) => {
    status.textContent = message;
    status.dataset.state = error ? 'error' : 'success';
  };
  const config = window.SUPABASE_CONFIG;
  if (!config?.url || !config?.publishableKey ||
      config.url.includes('YOUR-PROJECT-REF') ||
      config.publishableKey.includes('YOUR-SUPABASE')) {
    $('assignment-content').hidden = true;
    setStatus('Assignments are not connected yet. Complete the Supabase setup and apply all three database migrations.', true);
    return;
  }
  if (!window.supabase?.createClient) {
    setStatus('The authentication library could not load. Check your connection and reload.', true);
    return;
  }

  const client = window.supabase.createClient(config.url, config.publishableKey);
  let currentUser = null;
  let currentRole = null;
  let editingAssignmentId = null;
  let classMap = new Map();
  const show = (id, visible) => { $(id).hidden = !visible; };
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const addButton = (parent, label, className, action) => {
    const button = make('button', className, label);
    button.type = 'button';
    button.addEventListener('click', action);
    parent.append(button);
    return button;
  };
  const dateLabel = value => value ? new Date(value).toLocaleString() : 'No due date';

  async function loadClasses() {
    const query = client.from('classes').select('id,name,description').order('created_at', {ascending:false});
    const {data, error} = currentRole === 'teacher'
      ? await query.eq('teacher_id', currentUser.id)
      : await query;
    if (error) throw error;
    classMap = new Map((data || []).map(item => [item.id, item]));
    const select = $('assignment-class');
    select.replaceChildren(new Option('Choose a class', ''));
    for (const item of classMap.values()) select.add(new Option(item.name, item.id));
    return [...classMap.values()];
  }

  async function loadTeacherSubmissions(assignment, target) {
    const {data, error} = await client.from('assignment_submissions')
      .select('id,student_id,response,status,submitted_at,score,teacher_feedback,graded_at,profiles(full_name)')
      .eq('assignment_id', assignment.id)
      .order('submitted_at', {ascending:true});
    if (error) {
      target.append(make('p', 'assignment-meta', 'Submissions unavailable: ' + error.message));
      return;
    }
    if (!data?.length) {
      target.append(make('p', 'assignment-meta', 'No student submissions yet.'));
      return;
    }
    for (const submission of data) {
      const review = make('section', 'submission-review');
      const studentName = submission.profiles?.full_name || 'Student';
      review.append(make('h4', '', studentName));
      review.append(make('p', 'assignment-meta', (submission.status === 'submitted' ? 'Submitted' : 'Draft') +
        (submission.submitted_at ? ' · ' + dateLabel(submission.submitted_at) : '')));
      const response = submission.response?.text || '';
      review.append(make('div', 'response-text', response || 'No written response provided.'));
      if (submission.graded_at) {
        review.append(make('p', 'assignment-meta', 'Graded · ' + submission.score + '/' + assignment.points_possible));
      }
      const form = make('form');
      const scoreLabel = make('label', '', 'Score (out of ' + assignment.points_possible + ')');
      const score = make('input');
      score.type = 'number'; score.min = '0'; score.max = String(assignment.points_possible);
      score.step = '0.01'; score.required = true;
      if (submission.score !== null) score.value = String(submission.score);
      scoreLabel.append(score);
      const feedbackLabel = make('label', '', 'Teacher feedback');
      const feedback = make('textarea');
      feedback.maxLength = 5000; feedback.value = submission.teacher_feedback || '';
      feedbackLabel.append(feedback);
      const save = make('button', '', 'Save grade and feedback');
      save.type = 'submit';
      form.append(scoreLabel, feedbackLabel, save);
      form.addEventListener('submit', async event => {
        event.preventDefault();
        const numericScore = Number(score.value);
        if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > assignment.points_possible) {
          setStatus('Enter a score between 0 and ' + assignment.points_possible + '.', true);
          return;
        }
        save.disabled = true;
        const {error: updateError} = await client.from('assignment_submissions').update({
          score: numericScore,
          teacher_feedback: feedback.value.trim(),
          graded_at: new Date().toISOString(),
          graded_by: currentUser.id
        }).eq('id', submission.id);
        save.disabled = false;
        if (updateError) return setStatus('Grade could not be saved: ' + updateError.message, true);
        setStatus('Grade and feedback saved for ' + studentName + '.');
        await loadAssignments();
      });
      review.append(form);
      target.append(review);
    }
  }

  async function loadStudentSubmission(assignment, card) {
    const {data, error} = await client.from('assignment_submissions')
      .select('id,response,status,submitted_at,score,teacher_feedback,graded_at')
      .eq('assignment_id', assignment.id).eq('student_id', currentUser.id).maybeSingle();
    if (error) {
      card.append(make('p', 'assignment-meta', 'Your work could not be loaded: ' + error.message));
      return;
    }
    const form = make('form');
    const label = make('label', '', 'Your response');
    const textarea = make('textarea');
    textarea.maxLength = 12000;
    textarea.required = true;
    textarea.placeholder = 'Write your answer, observations or reflection here.';
    textarea.value = data?.response?.text || '';
    label.append(textarea);
    const actions = make('div', 'assignment-actions');
    const saveDraft = make('button', 'secondary', 'Save draft');
    saveDraft.type = 'button';
    const submit = make('button', '', data?.status === 'submitted' ? 'Update submission' : 'Submit work');
    submit.type = 'submit';
    actions.append(saveDraft, submit);
    form.append(label, actions);
    const graded = Boolean(data?.graded_at);
    if (graded) {
      textarea.disabled = true;
      saveDraft.disabled = true;
      submit.disabled = true;
      card.append(make('p', 'assignment-meta', 'Graded · ' + data.score + '/' + assignment.points_possible));
      if (data.teacher_feedback) card.append(make('p', '', 'Teacher feedback: ' + data.teacher_feedback));
    } else {
      const save = async finalSubmission => {
        if (!textarea.value.trim()) {
          setStatus('Write your response before saving.', true);
          return;
        }
        saveDraft.disabled = true; submit.disabled = true;
        const {error: saveError} = await client.from('assignment_submissions').upsert({
          assignment_id: assignment.id,
          student_id: currentUser.id,
          response: {text: textarea.value.trim()},
          status: finalSubmission ? 'submitted' : 'draft'
        }, {onConflict:'assignment_id,student_id'});
        saveDraft.disabled = false; submit.disabled = false;
        if (saveError) return setStatus('Your work could not be saved: ' + saveError.message, true);
        setStatus(finalSubmission ? 'Your work has been submitted.' : 'Your draft has been saved.');
        await loadAssignments();
      };
      saveDraft.addEventListener('click', () => save(false));
      form.addEventListener('submit', event => {event.preventDefault(); save(true);});
    }
    card.append(form);
  }

  async function loadAssignments() {
    const list = $('assignment-list');
    list.replaceChildren();
    const classIds = [...classMap.keys()];
    if (!classIds.length) {
      list.append(make('p', 'assignment-empty', currentRole === 'teacher'
        ? 'Create a class first, then publish an assignment for it.'
        : 'You have not joined a class yet. Ask your teacher for an invite code.'));
      return;
    }
    const {data: assignments, error} = await client.from('assignments')
      .select('id,class_id,title,description,instructions,due_at,points_possible,status,published_at,created_at')
      .in('class_id', classIds).order('created_at', {ascending:false});
    if (error) {
      list.append(make('p', 'assignment-empty', 'Assignments could not be loaded: ' + error.message));
      return;
    }
    if (!assignments?.length) {
      list.append(make('p', 'assignment-empty', currentRole === 'teacher'
        ? 'No assignments yet. Create one above and publish it when ready.'
        : 'No published assignments are available in your classes yet.'));
      return;
    }
    for (const assignment of assignments) {
      const card = make('article', 'assignment-card');
      const classInfo = classMap.get(assignment.class_id);
      card.append(make('p', 'assignment-meta', classInfo?.name || 'Your class'));
      card.append(make('h3', '', assignment.title));
      card.append(make('span', 'assignment-tag', assignment.status));
      if (assignment.description) card.append(make('p', '', assignment.description));
      card.append(make('p', '', assignment.instructions));
      card.append(make('p', 'assignment-meta assignment-due', 'Due: ' + dateLabel(assignment.due_at) +
        ' · ' + assignment.points_possible + ' points'));
      if (currentRole === 'teacher') {
        const actions = make('div', 'assignment-actions');
        addButton(actions, 'Edit', 'secondary', () => {
          editingAssignmentId = assignment.id;
          $('assignment-class').value = assignment.class_id;
          $('assignment-class').disabled = true;
          $('assignment-title').value = assignment.title;
          $('assignment-description').value = assignment.description || '';
          $('assignment-instructions').value = assignment.instructions || '';
          $('assignment-points').value = String(assignment.points_possible);
          if (assignment.due_at) {
            const localDate = new Date(new Date(assignment.due_at).getTime() - new Date(assignment.due_at).getTimezoneOffset() * 60000);
            $('assignment-due').value = localDate.toISOString().slice(0,16);
          } else $('assignment-due').value = '';
          $('assignment-cancel-edit').hidden = false;
          $('assignment-save-draft').textContent = 'Save changes';
          $('assignment-publish').textContent = 'Save and publish';
          $('assignment-list').scrollIntoView({behavior:'smooth',block:'start'});
          $('assignment-title').focus();
          setStatus('Editing “' + assignment.title + '”.');
        });
        if (assignment.status === 'draft') {
          addButton(actions, 'Publish', '', async () => {
            const {error: updateError} = await client.from('assignments').update({
              status:'published', published_at:new Date().toISOString()
            }).eq('id', assignment.id);
            if (updateError) return setStatus('Could not publish: ' + updateError.message, true);
            setStatus('Assignment published.');
            await loadAssignments();
          });
        } else if (assignment.status === 'published') {
          addButton(actions, 'Archive', 'secondary', async () => {
            const {error: updateError} = await client.from('assignments').update({status:'archived'}).eq('id', assignment.id);
            if (updateError) return setStatus('Could not archive: ' + updateError.message, true);
            setStatus('Assignment archived.');
            await loadAssignments();
          });
        }
        addButton(actions, 'Delete', 'danger', async () => {
          if (!window.confirm('Delete this assignment and all its submissions?')) return;
          const {error: deleteError} = await client.from('assignments').delete().eq('id', assignment.id);
          if (deleteError) return setStatus('Could not delete: ' + deleteError.message, true);
          setStatus('Assignment deleted.');
          await loadAssignments();
        });
        card.append(actions);
        if (assignment.status !== 'draft') {
          const reviews = make('div');
          reviews.append(make('h4', '', 'Student submissions and grading'));
          card.append(reviews);
          await loadTeacherSubmissions(assignment, reviews);
        }
      } else {
        await loadStudentSubmission(assignment, card);
      }
      list.append(card);
    }
  }

  async function initialise() {
    const {data: sessionData, error: sessionError} = await client.auth.getSession();
    if (sessionError) return setStatus(sessionError.message, true);
    currentUser = sessionData.session?.user || null;
    if (!currentUser) {
      show('assignment-content', false);
      show('assignment-login-prompt', true);
      return setStatus('Sign in with your account to view assignments.');
    }
    const {data: profile, error: profileError} = await client.from('profiles')
      .select('full_name,role').eq('id', currentUser.id).maybeSingle();
    if (profileError || !profile) {
      return setStatus('Your account profile is unavailable. Apply the Phase 1 profiles migration and sign in again.', true);
    }
    currentRole = profile.role;
    $('assignment-account').textContent = (profile.full_name || currentUser.email) + ' · ' +
      (currentRole === 'teacher' ? 'Teacher' : 'Student');
    show('assignment-login-prompt', false);
    show('assignment-content', true);
    show('teacher-assignment-create', currentRole === 'teacher');
    if (currentRole !== 'teacher') $('assignment-list-heading').textContent = 'Published class assignments';
    try {
      await loadClasses();
      await loadAssignments();
      setStatus('Signed in. Your assignments are up to date.');
    } catch (error) {
      setStatus('Could not load class information: ' + error.message, true);
    }
  }

  $('assignment-create-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (currentRole !== 'teacher') return setStatus('Only teachers can create assignments.', true);
    const intent = event.submitter?.value === 'published' ? 'published' : 'draft';
    const classId = $('assignment-class').value;
    if (!classId || !classMap.has(classId)) return setStatus('Choose one of your classes.', true);
    const points = Number($('assignment-points').value);
    if (!Number.isInteger(points) || points < 1 || points > 1000) return setStatus('Points must be a whole number from 1 to 1000.', true);
    const buttons = [...$('assignment-create-form').querySelectorAll('button')];
    buttons.forEach(button => button.disabled = true);
    const dueValue = $('assignment-due').value;
    const payload = {
      class_id: classId,
      teacher_id: currentUser.id,
      title: $('assignment-title').value.trim(),
      description: $('assignment-description').value.trim(),
      instructions: $('assignment-instructions').value.trim(),
      due_at: dueValue ? new Date(dueValue).toISOString() : null,
      points_possible: points,
      status: intent,
      published_at: intent === 'published' ? new Date().toISOString() : null
    };
    const result = editingAssignmentId
      ? await client.from('assignments').update({
          title: payload.title, description: payload.description, instructions: payload.instructions,
          due_at: payload.due_at, points_possible: payload.points_possible, status: payload.status,
          published_at: intent === 'published' ? (new Date().toISOString()) : null
        }).eq('id', editingAssignmentId)
      : await client.from('assignments').insert(payload);
    buttons.forEach(button => button.disabled = false);
    if (result.error) return setStatus('Assignment could not be saved: ' + result.error.message, true);
    const wasEditing = Boolean(editingAssignmentId);
    editingAssignmentId = null;
    $('assignment-create-form').reset();
    $('assignment-class').disabled = false;
    $('assignment-points').value = '100';
    $('assignment-cancel-edit').hidden = true;
    $('assignment-save-draft').textContent = 'Save as draft';
    $('assignment-publish').textContent = 'Publish assignment';
    setStatus(wasEditing ? 'Assignment updated.' : (intent === 'published' ? 'Assignment created and published.' : 'Assignment saved as a draft.'));
    await loadAssignments();
  });

  $('assignment-cancel-edit').addEventListener('click', () => {
    editingAssignmentId = null;
    $('assignment-create-form').reset();
    $('assignment-class').disabled = false;
    $('assignment-points').value = '100';
    $('assignment-cancel-edit').hidden = true;
    $('assignment-save-draft').textContent = 'Save as draft';
    $('assignment-publish').textContent = 'Publish assignment';
    setStatus('Assignment editing cancelled.');
  });

  $('assignment-signout').addEventListener('click', async () => {
    const {error} = await client.auth.signOut();
    if (error) return setStatus(error.message, true);
    window.location.href = 'auth.html';
  });

  initialise();
})();