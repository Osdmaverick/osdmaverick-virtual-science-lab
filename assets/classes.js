(() => {
  const $ = id => document.getElementById(id);
  const status = $('classes-status');
  const setStatus = (message, error = false) => {
    status.textContent = message;
    status.dataset.state = error ? 'error' : 'success';
  };
  const config = window.SUPABASE_CONFIG;
  if (!config?.url || !config?.publishableKey ||
      config.url.includes('YOUR-PROJECT-REF') ||
      config.publishableKey.includes('YOUR-SUPABASE')) {
    $('classes-content').hidden = true;
    setStatus('Class management is not connected yet. Complete the Supabase setup in the Phase 1 and Phase 2 administrator guides.', true);
    return;
  }
  if (!window.supabase?.createClient) {
    setStatus('The authentication library could not load. Check your connection and reload.', true);
    return;
  }

  const client = window.supabase.createClient(config.url, config.publishableKey);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));
  const show = (id, visible) => { $(id).hidden = !visible; };

  async function loadClasses(user, role) {
    const list = $('class-list');
    list.replaceChildren();
    const { data: classes, error } = await client.from('classes')
      .select('id,name,description,created_at,teacher_id')
      .order('created_at', { ascending: false });
    if (error) return setStatus('Could not load classes: ' + error.message, true);
    if (!classes?.length) {
      list.innerHTML = '<p class="empty-state">No classes yet. Create a class or join one with an invite code.</p>';
      return;
    }

    for (const item of classes) {
      const article = document.createElement('article');
      article.className = 'class-card';
      const heading = document.createElement('h3');
      heading.textContent = item.name;
      const description = document.createElement('p');
      description.textContent = item.description || 'No description provided.';
      article.append(heading, description);

      if (role === 'teacher' && item.teacher_id === user.id) {
        const codeLine = document.createElement('p');
        codeLine.className = 'class-code';
        const { data: invite, error: inviteError } = await client.from('class_invite_codes')
          .select('join_code').eq('class_id', item.id).maybeSingle();
        codeLine.textContent = inviteError ? 'Invite code unavailable: ' + inviteError.message :
          'Student invite code: ' + (invite?.join_code || 'Pending');
        article.append(codeLine);

        const rosterTitle = document.createElement('h4');
        rosterTitle.textContent = 'Enrolled students';
        article.append(rosterTitle);
        const { data: roster, error: rosterError } = await client.from('enrollments')
          .select('student_id,joined_at,profiles(full_name)')
          .eq('class_id', item.id).order('joined_at', { ascending: true });
        const rosterList = document.createElement('ul');
        if (rosterError) {
          const li = document.createElement('li');
          li.textContent = 'Roster unavailable: ' + rosterError.message;
          rosterList.append(li);
        } else if (!roster?.length) {
          const li = document.createElement('li'); li.textContent = 'No students have joined yet.';
          rosterList.append(li);
        } else {
          roster.forEach(student => {
            const li = document.createElement('li');
            li.textContent = student.profiles?.full_name || 'Student';
            rosterList.append(li);
          });
        }
        article.append(rosterList);
      } else {
        const enrolled = document.createElement('p');
        enrolled.className = 'class-meta';
        enrolled.textContent = 'You are enrolled in this class.';
        article.append(enrolled);
      }
      list.append(article);
    }
  }

  async function initialise() {
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) return setStatus(sessionError.message, true);
    const user = sessionData.session?.user;
    if (!user) {
      show('classes-content', false);
      show('classes-login-prompt', true);
      return setStatus('Sign in with your account to create or join a class.');
    }
    const { data: profile, error: profileError } = await client.from('profiles')
      .select('full_name,role').eq('id', user.id).maybeSingle();
    if (profileError || !profile) {
      return setStatus('Your account profile is unavailable. Apply the Phase 1 profiles migration and sign in again.', true);
    }
    $('classes-account').textContent = (profile.full_name || user.email) + ' · ' +
      (profile.role === 'teacher' ? 'Teacher' : 'Student');
    show('classes-login-prompt', false);
    show('classes-content', true);
    show('teacher-create-panel', profile.role === 'teacher');
    show('student-join-panel', profile.role === 'student');
    await loadClasses(user, profile.role);
    setStatus('Signed in. Your class list is up to date.');
  }

  $('create-class-form').addEventListener('submit', async event => {
    event.preventDefault();
    const { data: sessionData } = await client.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return setStatus('Please sign in again.', true);
    const button = $('create-class-button'); button.disabled = true;
    const { error } = await client.from('classes').insert({
      teacher_id: user.id,
      name: $('class-name').value.trim(),
      description: $('class-description').value.trim()
    });
    button.disabled = false;
    if (error) return setStatus('Class could not be created: ' + error.message, true);
    $('create-class-form').reset();
    setStatus('Class created. A private student invite code has been generated.');
    await initialise();
  });

  $('join-class-form').addEventListener('submit', async event => {
    event.preventDefault();
    const button = $('join-class-button'); button.disabled = true;
    const { data, error } = await client.rpc('join_class', {
      p_join_code: $('join-code').value.trim()
    });
    button.disabled = false;
    if (error) return setStatus('Could not join class: ' + error.message, true);
    $('join-class-form').reset();
    setStatus(data?.[0] ? 'You joined ' + data[0].class_name + '.' : 'Class joined successfully.');
    await initialise();
  });

  $('classes-signout').addEventListener('click', async () => {
    const { error } = await client.auth.signOut();
    if (error) return setStatus(error.message, true);
    window.location.href = 'auth.html';
  });

  initialise();
})();
