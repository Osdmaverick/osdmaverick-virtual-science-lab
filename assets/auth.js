(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);
  const status = byId('auth-status');
  const forms = ['signin-form', 'signup-form', 'reset-form', 'password-update-form'];
  const config = window.SUPABASE_CONFIG;

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.dataset.state = isError ? 'error' : 'success';
  }

  function showForm(formId) {
    forms.forEach((id) => { byId(id).hidden = id !== formId; });
    document.querySelectorAll('[data-auth-view]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.authView === formId));
    });
    setStatus('');
  }

  function showAccount(visible) {
    byId('auth-forms').hidden = visible;
    byId('signed-in-panel').hidden = !visible;
  }

  if (!config?.url || !config?.publishableKey ||
      config.url.includes('YOUR-PROJECT-REF') ||
      config.publishableKey.includes('YOUR_KEY')) {
    showAccount(false);
    byId('auth-forms').hidden = true;
    setStatus('Account access is not connected yet. The project administrator must add the Supabase project URL and publishable key.', true);
    return;
  }

  if (!window.supabase?.createClient) {
    setStatus('The account service could not load. Check your internet connection and reload this page.', true);
    return;
  }

  const client = window.supabase.createClient(config.url, config.publishableKey);
  let renderVersion = 0;
  let passwordRecoveryActive = false;

  async function renderSession(session) {
    const version = ++renderVersion;
    if (passwordRecoveryActive) {
      showAccount(false);
      byId('auth-forms').hidden = false;
      return;
    }
    showAccount(Boolean(session));
    if (!session) {
      byId('account-name').textContent = '';
      byId('account-email').textContent = '';
      byId('account-role').textContent = '';
      return;
    }

    byId('account-email').textContent = session.user.email || '';
    byId('account-name').textContent = 'Loading…';
    byId('account-role').textContent = 'Checking access…';

    const { data, error } = await client
      .from('profiles')
      .select('full_name, role')
      .eq('id', session.user.id)
      .maybeSingle();

    if (version !== renderVersion) return;
    if (error || !data) {
      byId('account-name').textContent = 'Profile not available';
      byId('account-role').textContent = 'Setup required';
      setStatus('You are signed in, but the profile is unavailable. The administrator must apply the identity database migration.', true);
      return;
    }

    byId('account-name').textContent = data.full_name || 'Student';
    byId('account-role').textContent = data.role === 'teacher' ? 'Teacher account' : 'Student account';
    setStatus('You are securely signed in.');
  }

  document.querySelectorAll('[data-auth-view]').forEach((button) => {
    button.addEventListener('click', () => showForm(button.dataset.authView));
  });

  byId('signin-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = byId('signin-submit');
    button.disabled = true;
    setStatus('Signing in…');
    const { error } = await client.auth.signInWithPassword({
      email: byId('signin-email').value.trim(),
      password: byId('signin-password').value
    });
    button.disabled = false;
    if (error) setStatus(error.message, true);
  });

  byId('signup-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = byId('signup-submit');
    button.disabled = true;
    setStatus('Creating your student account…');
    const { data, error } = await client.auth.signUp({
      email: byId('signup-email').value.trim(),
      password: byId('signup-password').value,
      options: {
        data: { full_name: byId('signup-name').value.trim() }
      }
    });
    button.disabled = false;
    if (error) return setStatus(error.message, true);
    if (data.session) {
      setStatus('Your account has been created and you are signed in.');
    } else {
      showForm('signin-form');
      setStatus('Registration received. Check your email to confirm your account, then sign in.');
    }
  });

  byId('reset-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const { error } = await client.auth.resetPasswordForEmail(
      byId('reset-email').value.trim(),
      { redirectTo: window.location.origin + window.location.pathname }
    );
    if (error) return setStatus(error.message, true);
    setStatus('If an account exists for that email, a password-reset link has been sent.');
  });

  byId('password-update-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = byId('new-password').value;
    if (password.length < 8) return setStatus('Use a password with at least 8 characters.', true);
    const button = byId('password-update-submit');
    button.disabled = true;
    const { error } = await client.auth.updateUser({ password });
    button.disabled = false;
    if (error) return setStatus(error.message, true);
    byId('new-password').value = '';
    passwordRecoveryActive = false;
    setStatus('Your password has been updated. Please sign in with your new password.');
    await client.auth.signOut();
    showForm('signin-form');
  });

  byId('signout-button').addEventListener('click', async () => {
    const { error } = await client.auth.signOut();
    if (error) return setStatus(error.message, true);
    showForm('signin-form');
    setStatus('You have signed out.');
  });

  // Supabase auth callbacks must stay synchronous. Defer database reads until
  // after the callback returns to avoid holding the client's auth lock.
  client.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      passwordRecoveryActive = true;
      showAccount(false);
      showForm('password-update-form');
      setStatus('Choose a new password for your account.');
    }
    window.setTimeout(() => { void renderSession(session); }, 0);
  });
})();
