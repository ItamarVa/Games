
import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { QuizView } from './components/QuizView';
import { LiveTutorView } from './components/LiveTutorView';
import { RewardsView } from './components/RewardsView';
import { TOPICS } from './constants';
import { Topic, AppView } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [points, setPoints] = useState(120); // Start with some generous points!

  const handleSelectTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setCurrentView(AppView.QUIZ);
  };

  const handleCompleteQuestion = (earnedPoints: number) => {
    setPoints(prev => prev + earnedPoints);
    // Simple confetti effect or sound could go here
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-200">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => setCurrentView(AppView.DASHBOARD)}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              ∑
            </div>
            <span className="font-bold text-xl tracking-tight hidden md:inline">Math Game</span>
          </div>

          <div className="flex items-center gap-4">
             <button 
              onClick={() => setCurrentView(AppView.REWARDS)}
              className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-1.5 rounded-full font-bold hover:bg-yellow-200 transition-colors"
            >
              <span>⭐</span>
              <span>{points}</span>
            </button>
            <button 
              onClick={() => setCurrentView(AppView.LIVE_TUTOR)}
              className="bg-indigo-100 text-indigo-700 p-2 rounded-full hover:bg-indigo-200 transition-colors"
              title="מורה פרטי"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">
        {currentView === AppView.DASHBOARD && (
          <Dashboard 
            topics={TOPICS} 
            onSelectTopic={handleSelectTopic} 
            userPoints={points}
          />
        )}

        {currentView === AppView.QUIZ && selectedTopic && (
          <QuizView 
            topic={selectedTopic} 
            onBack={() => setCurrentView(AppView.DASHBOARD)}
            onCompleteQuestion={handleCompleteQuestion}
            onRequestTutor={() => setCurrentView(AppView.LIVE_TUTOR)}
          />
        )}

        {currentView === AppView.LIVE_TUTOR && (
          <LiveTutorView 
            onBack={() => setCurrentView(selectedTopic ? AppView.QUIZ : AppView.DASHBOARD)}
            context={selectedTopic ? `Topic: ${selectedTopic.title}` : 'General Math Help'}
          />
        )}

        {currentView === AppView.REWARDS && (
          <RewardsView 
            points={points}
            onSpendPoints={(amt) => setPoints(p => p - amt)}
            onBack={() => setCurrentView(AppView.DASHBOARD)}
          />
        )}
      </main>

      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="blob top-0 left-0 bg-purple-300 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="blob top-0 right-0 bg-yellow-300 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="blob -bottom-32 left-20 bg-pink-300 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
    </div>
  );
}
