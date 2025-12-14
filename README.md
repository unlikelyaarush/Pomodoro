# Pomodoro

A web app that helps students get realistic time estimates for their homework and assignments using AI-powered predictions.

## Features

- **AI-Powered Estimates**: Uses Google Gemini API to generate realistic time estimates
- **User Authentication**: Secure sign-up and login with Supabase Auth
- **Pattern Learning**: Learns from your past assignments to improve accuracy
- **Type-Specific Learning**: Considers assignment type similarity for more accurate estimates
- **Actual Time Logging**: Log how long assignments actually took to improve future predictions
- **Detailed Breakdowns**: Shows time estimates for each phase (research, writing, editing, etc.)
- **Start Date Recommendations**: Tells you when to start working to finish on time
- **Pro Tips**: Provides assignment-specific advice
- **Assignment History**: View and manage all your past assignments

## Tech Stack

- **Frontend**: React + Vite
- **Styling**: Tailwind CSS (dark theme with purple accents)
- **AI**: Google Gemini API (gemini-1.5-flash - free tier compatible)
- **Database**: Supabase (PostgreSQL)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory (copy from `env.example`):

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Getting API Keys:**
- **Gemini API**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Supabase**: Create a project at [Supabase](https://supabase.com) and get your project URL and anon key from Settings > API

### 3. Set Up Supabase Database

1. Go to your Supabase project
2. **Enable Authentication**: 
   - Go to Authentication > Providers
   - Enable "Email" provider
   - Configure email settings (you can use Supabase's built-in email service for development)
3. **Create Database Table**:
   - Go to SQL Editor
   - Run the SQL from `supabase-schema.sql` to create the `assignments` table with proper RLS policies

### 4. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

## Project Structure

```
src/
  components/
    AssignmentForm.jsx    # Main form component with assignment input
    TimeEstimate.jsx       # Results display component
    PastAssignments.jsx   # Display and manage past assignments
    LogActualHours.jsx    # Form to log actual time spent
    Auth.jsx              # Authentication (login/signup) component
    Header.jsx            # App header
    LoadingSpinner.jsx    # Loading indicator
    ErrorMessage.jsx      # Error display
  lib/
    gemini.js             # Gemini API integration
    supabase.js           # Supabase client, auth, and database functions
    utils.js              # Utility functions (multipliers, date formatting)
  App.jsx                 # Main app component with auth state management
  main.jsx                # Entry point
  index.css               # Global styles with Tailwind
```

## How It Works

1. **Authentication**: Users sign up/login with email and password
2. **Assignment Input**: User enters assignment details (type, subject, description, due date)
3. **Pattern Analysis**: App fetches user's past assignments from Supabase
4. **Type-Specific Multiplier**: Calculates accuracy multiplier based on:
   - Same assignment type (if 3+ samples available)
   - Overall history (if no type-specific data)
   - Blended approach (if 1-2 samples of same type)
5. **AI Estimation**: Sends assignment details + type-specific multiplier to Gemini API
6. **Results Display**: Shows time estimate with breakdown, start date, reasoning, and tips
7. **Save & Learn**: Estimate is saved to Supabase
8. **Actual Time Logging**: After completing assignments, users log actual hours spent
9. **Continuous Improvement**: Future estimates become more accurate as more data is collected

## Deployment

The app is configured for deployment to Vercel. Make sure to add your environment variables in Vercel's project settings.

## License

MIT
