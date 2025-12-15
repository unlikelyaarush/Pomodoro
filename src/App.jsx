import { useState, useEffect } from 'react';
import { supabase, getCurrentUser, signOut } from './lib/supabase';
import { SimpleHeader } from './components/ui/simple-header';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Header from './components/Header';
import AssignmentForm from './components/AssignmentForm';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('landing'); // 'landing' or 'auth'

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
      // If user is logged in, show assignment form by default
      if (currentUser) {
        setCurrentPage('app');
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    checkUser();
    setCurrentPage('app'); // Show assignment form after successful auth
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
      <SimpleHeader 
        user={user}
        onSignOut={() => setUser(null)} 
        onNavigateToAuth={() => setCurrentPage('auth')} 
        onNavigateToHome={() => setCurrentPage('landing')}
      />
      
      {!user ? (
        currentPage === 'auth' ? (
          <AuthPage onAuthSuccess={handleAuthSuccess} />
        ) : (
          <LandingPage 
            user={user}
            onNavigateToAuth={() => setCurrentPage('auth')} 
            onNavigateToApp={() => setCurrentPage('app')}
          />
        )
      ) : (
        currentPage === 'app' ? (
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
        ) : (
          <LandingPage 
            user={user}
            onNavigateToAuth={() => setCurrentPage('auth')} 
            onNavigateToApp={() => setCurrentPage('app')}
          />
        )
      )}
    </div>
  );
}

export default App;
