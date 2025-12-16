import React, { useState } from 'react';
import { generateStory } from './services/geminiService';
import { StoryData, AppView } from './types';
import StoryMode from './components/StoryMode';
import VeoStudio from './components/VeoStudio';
import LiveTutor from './components/LiveTutor';
import { BookOpen, Video, Mic, Sparkles, Trophy, Shuffle, Gift, ArrowRight } from 'lucide-react';

const RANDOM_TOPICS = [
  "Space Adventure",
  "The Magical Forest",
  "A Day at the Zoo",
  "The Friendly Dragon",
  "Underwater Mystery",
  "Superhero School",
  "The Lost Robot",
  "A Flying Car"
];

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [topic, setTopic] = useState('');
  const [loadingStory, setLoadingStory] = useState(false);
  const [story, setStory] = useState<StoryData | null>(null);
  const [score, setScore] = useState(120); // Starting bonus points for demo!

  const handleGenerateStory = async () => {
    // If topic is empty, pick a random one
    let selectedTopic = topic.trim();
    if (!selectedTopic) {
      selectedTopic = RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)];
    }

    setLoadingStory(true);
    try {
      const data = await generateStory(selectedTopic);
      setStory(data);
      setView(AppView.STORY);
    } catch (e) {
      alert("Something went wrong generating the story. Please try again!");
      console.error(e);
    } finally {
      setLoadingStory(false);
    }
  };

  const handleAddPoints = (points: number) => {
    setScore(s => s + points);
  };

  const handleSpendPoints = (amount: number) => {
    setScore(s => Math.max(0, s - amount));
  };

  const handleFinishStory = (sessionScore: number) => {
    // Points were already added incrementally via handleAddPoints.
    // We just use sessionScore for the summary message.
    alert(`Great job! You earned ${sessionScore} points in this story! Total XP: ${score}`);
    setView(AppView.HOME);
    setTopic('');
  };

  return (
    <div className="min-h-screen pb-10">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 font-bold text-xl text-blue-600 cursor-pointer"
            onClick={() => setView(AppView.HOME)}
          >
            <BookOpen className="w-6 h-6" />
            <span>EnglishAdventure</span>
          </div>
          <div 
            onClick={() => setView(AppView.VEO_STUDIO)}
            className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold animate-in fade-in cursor-pointer hover:bg-yellow-200 transition shadow-sm hover:shadow-md"
            title="Open Rewards Shop / חנות ההפתעות"
          >
            <Trophy className="w-4 h-4 text-yellow-600" />
            <span>{score} XP</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 mt-8">
        {view === AppView.HOME && (
          <div className="space-y-10 text-center animate-in fade-in slide-in-from-bottom-4">
            
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
                Let's Learn English!
              </h1>
              <p className="text-xl text-gray-500">
                Choose what you want to do today / מה נלמד היום?
              </p>
            </div>

            {/* Topic Input for Story */}
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-blue-50 max-w-lg mx-auto transform hover:scale-105 transition duration-300">
              <div className="mb-4">
                <span className="text-4xl">📚</span>
              </div>
              <h2 className="text-2xl font-bold mb-4">Create a Story</h2>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Space, Dinosaurs, or leave empty for surprise!"
                className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-center font-english text-lg mb-4"
                dir="auto"
              />
              <button
                onClick={handleGenerateStory}
                disabled={loadingStory}
                className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg flex items-center justify-center gap-2 ${loadingStory ? 'bg-gray-400' : (topic.trim() ? 'bg-blue-500 hover:bg-blue-600' : 'bg-purple-500 hover:bg-purple-600') + ' blob-btn'}`}
              >
                {loadingStory ? (
                  <span className="animate-pulse">Generating Magic...</span>
                ) : (
                  topic.trim() ? (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Start Adventure
                    </>
                  ) : (
                    <>
                      <Shuffle className="w-5 h-5" />
                      Surprise Me! (סיפור הפתעה)
                    </>
                  )
                )}
              </button>
            </div>

            {/* Additional Modules */}
            <div className="flex justify-center max-w-3xl mx-auto">
              
              {/* Live Tutor Card */}
              <div 
                onClick={() => setView(AppView.LIVE_TUTOR)}
                className="bg-white p-6 rounded-2xl shadow-lg border border-green-100 cursor-pointer hover:shadow-xl transition group w-full max-w-xs"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition">
                  <Mic className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">תרגול שיחה</h3>
                <p className="text-gray-500 mt-2">Practice conversation in real-time!</p>
              </div>
            </div>
          </div>
        )}

        {view === AppView.STORY && story && (
          <StoryMode 
            story={story} 
            onFinish={handleFinishStory} 
            onAddPoints={handleAddPoints}
          />
        )}

        {view === AppView.VEO_STUDIO && (
          <VeoStudio 
            currentScore={score}
            onSpend={handleSpendPoints}
            onBack={() => setView(AppView.HOME)}
          />
        )}

        {view === AppView.LIVE_TUTOR && (
          <LiveTutor onClose={() => setView(AppView.HOME)} />
        )}
      </main>
    </div>
  );
};

export default App;