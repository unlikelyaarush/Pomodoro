import { useState, useEffect } from 'react';
import { supabase, getCurrentUser, signOut } from './lib/supabase';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Header from './components/Header';
import AssignmentForm from './components/AssignmentForm';
import Auth from './components/Auth';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    checkUser();

    // Listen for auth changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    }

  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    checkUser();
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar onSignOut={() => setUser(null)} />
      
      {!user ? (
        <>
          <LandingPage />
          <div id="app" className="min-h-screen py-20 px-4 bg-gray-900/50">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-800 rounded-lg p-8 shadow-2xl border border-gray-700">
                <ErrorBoundary>
                  <Auth onAuthSuccess={handleAuthSuccess} />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="min-h-screen py-20 px-4 pt-24">
          <div className="max-w-4xl mx-auto">
            <Header />
            <div className="bg-gray-800 rounded-lg p-8 shadow-2xl">
              <ErrorBoundary>
                <AssignmentForm />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
