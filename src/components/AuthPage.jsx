import ShaderBackground from './ShaderBackground';
import Auth from './Auth';
import ErrorBoundary from './ErrorBoundary';

export default function AuthPage({ onAuthSuccess }) {
  return (
    <div className="min-h-screen relative">
      {/* Shader Background */}
      <ShaderBackground />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Welcome to Pomodoro
            </h1>
            <p className="text-gray-300 text-lg">
              Sign in or create an account to get started
            </p>
          </div>
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-gray-700">
            <ErrorBoundary>
              <Auth onAuthSuccess={onAuthSuccess} />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
