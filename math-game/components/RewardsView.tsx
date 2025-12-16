
import React, { useState } from 'react';
import { generateRewardVideo } from '../services/geminiService';

interface RewardsViewProps {
  points: number;
  onSpendPoints: (amount: number) => void;
  onBack: () => void;
}

export const RewardsView: React.FC<RewardsViewProps> = ({ points, onSpendPoints, onBack }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const COST = 50;

  const handleGenerate = async () => {
    if (points < COST) return;
    if (!prompt.trim()) return;

    setLoading(true);
    setVideoUrl(null);
    try {
      const url = await generateRewardVideo(prompt);
      if (url) {
        onSpendPoints(COST);
        setVideoUrl(url);
      }
    } catch (e) {
      alert("שגיאה ביצירת הסרטון. וודא שבחרת מפתח API בתשלום.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button onClick={onBack} className="mb-6 text-gray-500 font-bold">➜ חזרה</button>
      
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-8 text-white mb-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl font-black mb-2">חנות ההפתעות! 🎁</h1>
          <p className="text-xl opacity-90">יש לך {points} נקודות</p>
        </div>
        <div className="absolute right-0 bottom-0 text-9xl opacity-20 transform translate-x-10 translate-y-10">🏆</div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">צור סרטון אנימציה משלך!</h2>
        <p className="text-gray-600 mb-6">
          תאר איזה סרטון מצחיק או מגניב אתה רוצה לראות, והבינה המלאכותית תיצור אותו בשבילך.
          <br />
          <span className="font-bold text-orange-500">מחיר: {COST} נקודות</span>
        </p>

        <div className="flex gap-4 mb-6">
          <input 
            type="text" 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="למשל: חתול רוכב על סקייטבורד בחלל..."
            className="flex-1 p-4 border-2 border-gray-200 rounded-xl focus:border-orange-400 outline-none text-lg"
            disabled={loading}
          />
          <button 
            onClick={handleGenerate}
            disabled={points < COST || loading || !prompt}
            className={`px-8 py-4 rounded-xl font-bold text-white text-lg transition-all
              ${points < COST ? 'bg-gray-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 shadow-lg hover:shadow-orange-200 transform hover:-translate-y-1'}
            `}
          >
            {loading ? 'יוצר קסם...' : 'צור סרטון! 🎬'}
          </button>
        </div>

        {videoUrl && (
          <div className="mt-8 bg-black rounded-2xl overflow-hidden shadow-2xl">
            <video controls autoPlay loop className="w-full">
              <source src={videoUrl} type="video/mp4" />
              הדפדפן שלך לא תומך בווידאו.
            </video>
            <div className="p-4 bg-gray-900 text-center">
              <a href={videoUrl} download className="text-orange-400 font-bold hover:text-orange-300">הורד סרטון</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
