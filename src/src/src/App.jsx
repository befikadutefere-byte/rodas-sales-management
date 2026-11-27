
import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }

    supabase
      .from('employee_profiles')
      .select('full_name, role, active')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else if (!data?.active) setError('Your account is inactive.');
        else setProfile(data);
      });
  }, [session]);

  async function login(event) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);

    const { error } = await supabase.auth.signInWithPassword({
      email: form.get('email'),
      password: form.get('password')
    });

    if (error) setError(error.message);
  }

  async function logout() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  if (loading) return <main><h2>RODAS Sales Management</h2>Loading...</main>;

  if (!session) {
    return (
      <main className="login">
        <h1>RODAS</h1>
        <h2>Sales Management</h2>
        <form onSubmit={login}>
          <input name="email" type="email" placeholder="Email address" required />
          <input name="password" type="password" placeholder="Password" required />
          <button type="submit">Log in</button>
        </form>
        {error && <p className="error">{error}</p>}
      </main>
    );
  }

  if (!profile) {
    return <main><h2>Checking your employee profile...</h2>{error && <p className="error">{error}</p>}<button onClick={logout}>Log out</button></main>;
  }

  return (
    <main>
      <header>
        <h1>RODAS Sales Management</h1>
        <button onClick={logout}>Log out</button>
      </header>
      <h2>Welcome, {profile.full_name}</h2>
      <p>Role: {profile.role.replaceAll('_', ' ')}</p>
      {profile.role === 'owner' ? (
        <h3>Company Owner Dashboard</h3>
      ) : (
        <h3>Employee Dashboard</h3>
      )}
      <p>Your account is active.</p>
    </main>
  );
}
