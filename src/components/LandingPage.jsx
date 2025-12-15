import { useState, useEffect, useRef } from 'react';
import ShaderBackground from './ShaderBackground';

export default function LandingPage({ onNavigateToAuth, user, onNavigateToApp }) {
  const [visibleSections, setVisibleSections] = useState({
    features: false,
    howItWorks: false,
    cta: false,
  });

  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('data-section');
          if (sectionId) {
            setVisibleSections((prev) => ({
              ...prev,
              [sectionId]: true,
            }));
          }
        }
      });
    }, observerOptions);

    if (featuresRef.current) observer.observe(featuresRef.current);
    if (howItWorksRef.current) observer.observe(howItWorksRef.current);
    if (ctaRef.current) observer.observe(ctaRef.current);

    return () => {
      if (featuresRef.current) observer.unobserve(featuresRef.current);
      if (howItWorksRef.current) observer.unobserve(howItWorksRef.current);
      if (ctaRef.current) observer.unobserve(ctaRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* Shader Background */}
      <ShaderBackground />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section id="top" className="relative overflow-hidden pt-48 pb-56">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-purple-900/40 to-gray-900/80"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-fade-in">
              Pomodoro
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Stop underestimating your homework. Get realistic time estimates powered by AI and learn from your past assignments.
            </p>
            <p className="text-lg text-purple-300 mb-8 animate-fade-in" style={{ animationDelay: '0.15s' }}>
              Assignment Time Predictor
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <a
                href="#features"
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/50"
              >
                Learn More
              </a>
              <button
                onClick={() => {
                  if (user) {
                    // If signed in, go to predictor page
                    if (onNavigateToApp) {
                      onNavigateToApp();
                    }
                  } else {
                    // If not signed in, go to sign in page
                    if (onNavigateToAuth) {
                      onNavigateToAuth();
                    }
                  }
                }}
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all duration-200 border border-gray-700"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="features" 
        ref={featuresRef}
        data-section="features"
        className={`py-40 bg-gray-900/70 relative transition-all duration-1000 ${
          visibleSections.features ? 'scroll-visible' : 'scroll-hidden'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-20 text-purple-300">
            Why Students Love It
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div 
              className={`bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-purple-600 transition-all duration-500 ${
                visibleSections.features ? 'scroll-visible' : 'scroll-hidden'
              }`}
              style={{ transitionDelay: visibleSections.features ? '0.1s' : '0s' }}
            >
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">AI-Powered Estimates</h3>
              <p className="text-gray-400">
                Get realistic time predictions using Google Gemini AI that considers assignment complexity, your work style, and historical patterns.
              </p>
            </div>

            <div 
              className={`bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-purple-600 transition-all duration-500 ${
                visibleSections.features ? 'scroll-visible' : 'scroll-hidden'
              }`}
              style={{ transitionDelay: visibleSections.features ? '0.2s' : '0s' }}
            >
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Learns From You</h3>
              <p className="text-gray-400">
                Log how long assignments actually took. The system learns your patterns and gets more accurate with each completed assignment.
              </p>
            </div>

            <div 
              className={`bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-purple-600 transition-all duration-500 ${
                visibleSections.features ? 'scroll-visible' : 'scroll-hidden'
              }`}
              style={{ transitionDelay: visibleSections.features ? '0.3s' : '0s' }}
            >
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Start Date Warnings</h3>
              <p className="text-gray-400">
                Know exactly when to start working. Get warnings if you're cutting it too close, so you never miss a deadline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section 
        ref={howItWorksRef}
        data-section="howItWorks"
        className={`py-40 relative transition-all duration-1000 ${
          visibleSections.howItWorks ? 'scroll-visible' : 'scroll-hidden'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-20 text-purple-300">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div 
              className={`bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-purple-600 transition-all duration-500 text-center ${
                visibleSections.howItWorks ? 'scroll-visible' : 'scroll-hidden'
              }`}
              style={{ transitionDelay: visibleSections.howItWorks ? '0.1s' : '0s' }}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                1
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Enter Details</h3>
              <p className="text-gray-400 text-sm">
                Tell us about your assignment: type, subject, description, and due date.
              </p>
            </div>
            <div 
              className={`bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-purple-600 transition-all duration-500 text-center ${
                visibleSections.howItWorks ? 'scroll-visible' : 'scroll-hidden'
              }`}
              style={{ transitionDelay: visibleSections.howItWorks ? '0.2s' : '0s' }}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                2
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Analysis</h3>
              <p className="text-gray-400 text-sm">
                Our AI analyzes your assignment and compares it with your past completed work.
              </p>
            </div>
            <div 
              className={`bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-purple-600 transition-all duration-500 text-center ${
                visibleSections.howItWorks ? 'scroll-visible' : 'scroll-hidden'
              }`}
              style={{ transitionDelay: visibleSections.howItWorks ? '0.3s' : '0s' }}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                3
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Get Estimate</h3>
              <p className="text-gray-400 text-sm">
                Receive a realistic time estimate with breakdown, start date, and pro tips.
              </p>
            </div>
            <div 
              className={`bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-purple-600 transition-all duration-500 text-center ${
                visibleSections.howItWorks ? 'scroll-visible' : 'scroll-hidden'
              }`}
              style={{ transitionDelay: visibleSections.howItWorks ? '0.4s' : '0s' }}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                4
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Log & Learn</h3>
              <p className="text-gray-400 text-sm">
                After completing, log actual hours. Future estimates become more accurate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        id="get-started" 
        ref={ctaRef}
        data-section="cta"
        className={`py-40 bg-gradient-to-r from-purple-900/30 to-pink-900/30 transition-all duration-1000 ${
          visibleSections.cta ? 'scroll-visible' : 'scroll-hidden'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4 text-white">
            Ready to Stop Underestimating?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join students who are getting realistic time estimates and better planning their work.
          </p>
          <button
            onClick={() => {
              if (user) {
                // If signed in, go to predictor page
                if (onNavigateToApp) {
                  onNavigateToApp();
                }
              } else {
                // If not signed in, go to sign in page
                if (onNavigateToAuth) {
                  onNavigateToAuth();
                }
              }
            }}
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/50 text-lg"
          >
            Get Started Now
          </button>
        </div>
      </section>
      </div>
    </div>
  );
}
