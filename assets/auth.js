(() => {
  const $ = (id) => document.getElementById(id);
  const status = $('auth-status');
  const setStatus = (message, error = false) => {
    status.textContent = message;
    status.dataset.state = error ? 'error' : 'success';
  };
  const config = window.SUPABASE_CONFIG;
  if (!config?.url || !config?.publishableKey ||
      config.url.includes('YOUR-PROJECT-REF') ||
      config.publishableKey.includes('YOUR-SUPABASE')) {
    setStatus('Authentication is not connected yet. A project administrator must configure the Supabase project URL and publishable key. See the Phase 1 setup guide.', true);
    $('auth-forms').hidden = true;
    return;
  }
  if (!window.supabase?.createClient) {
    setStatus('The authentication library could not load. Check your connection and reload this page.', true);
    return;
  }

  const client = window.supabase.createClient(config.url, config.publishableKey);
  const forms = ['signin-form', 'signup-form', 'reset-form', 'password-update-form'];
  const showForm = (id) => {
    forms.forEach(formId => { $(formId).hidden = formId !== id; });
    document.querySelectorAll('[data-auth-view]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.authView === id));
    });
    setStatus('');
  };
  document.querySelectorAll('[data-auth-view]').forEach(button =>
    button.addEventListener('click', () => showForm(button.dataset.authView))
  );

  const renderSession = async (session) => {
    $('auth-forms').hidden = Boolean(session);
    $('signed-in-panel').hidden = !session;
    if (!session) return;
    $('account-email').textContent = session.user.email || '';
    const { data, error } = await client.from('profiles')
      .select('full_name, role').eq('id', session.user.id).maybeSingle();
    if (error) {
      $('account-role').textContent = 'Profile unavailable';
      setStatus('Signed in, but the profile could not be loaded. Confirm that the profiles migration has been applied.', true);
      return;
    }
    $('account-name').textContent = data?.full_name || 'Student';
    $('account-role').textContent = data?.role === 'teacher' ? 'Teacher account' : 'Student account';
    setStatus('You are securely signed in.');
  };

  $('signin-form').addEventListener('submit', async event => {
    event.preventDefault();
    const button = $('signin-submit'); button.disabled = true;
    const { data, error } = await client.auth.signInWithPassword({
      email: $('signin-email').value.trim(),
      password: $('signin-password').value
    });
    button.disabled = false;
    if (error) return setStatus(error.message, true);
    await renderSession(data.session);
  });

  $('signup-form').addEventListener('submit', async event => {
    event.preventDefault();
    const button = $('signup-submit'); button.disabled = true;
    const { data, error } = await client.auth.signUp({
      email: $('signup-email').value.trim(),
      password: $('signup-password').value,
      options: { data: { full_name: $('signup-name').value.trim() } }
    });
    button.disabled = false;
    if (error) return setStatus(error.message, true);
    if (data.session) {
      await renderSession(data.session);
      return;
    }
    setStatus('Registration received. Check your email to confirm your account, then sign in.');
    showForm('signin-form');
  });

  $('reset-form').addEventListener('submit', async event => {
    event.preventDefault();
    const { error } = await client.auth.resetPasswordForEmail($('reset-email').value.trim(), {
      redirectTo: window.location.origin + window.location.pathname
    });
    if (error) return setStatus(error.message, true);
    setStatus('If an account exists for that email, a password-reset link has been sent.');
  });

  $('password-update-form').addEventListener('submit', async event => {
    event.preventDefault();
    const password = $('new-password').value;
    if (password.length < 8) return setStatus('Use a password with at least 8 characters.', true);
    const { error } = await client.auth.updateUser({ password });
    if (error) return setStatus(error.message, true);
    $('new-password').value = '';
    setStatus('Your password has been updated.');
    const { data } = await client.auth.getSession();
    await renderSession(data.session);
  });

  $('signout-button').addEventListener('click', async () => {
    const { error } = await client.auth.signOut();
    if (error) return setStatus(error.message, true);
    await renderSession(null);
    showForm('signin-form');
    setStatus('You have signed out.');
  });

  client.auth.onAuthStateChange((_event, session) => {
    renderSession(session);
  });
  client.auth.getSession().then(({ data, error }) => {
    if (error) setStatus(error.message, true);
    renderSession(data.session);
  });
})();
