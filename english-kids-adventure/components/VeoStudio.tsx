import React, { useState, useRef } from 'react';
import { generateVeoVideo, generateFunImage } from '../services/geminiService';
import { Video, Sparkles, Upload, AlertCircle, Image as ImageIcon, Gift } from 'lucide-react';

interface VeoStudioProps {
  currentScore: number;
  onSpend: (amount: number) => void;
  onBack: () => void;
}

const VIDEO_COST = 50;
const IMAGE_COST = 20;

const VeoStudio: React.FC<VeoStudioProps> = ({ currentScore, onSpend, onBack }) => {
  const [mode, setMode] = useState<'video' | 'image'>('video');
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cost = mode === 'video' ? VIDEO_COST : IMAGE_COST;
  const canAfford = currentScore >= cost;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!canAfford) return;
    if (mode === 'video' && !image) {
        setError("Please upload an image for the video.");
        return;
    }
    if (!prompt.trim()) {
        setError("Please describe what you want to create.");
        return;
    }

    setLoading(true);
    setError(null);
    setResultUrl(null);
    
    try {
      const base64Data = image ? image.split(',')[1] : undefined;
      let result = '';

      if (mode === 'video') {
         if (!base64Data) throw new Error("Image required for video");
         result = await generateVeoVideo(base64Data, prompt);
      } else {
         result = await generateFunImage(prompt, base64Data);
      }
      
      setResultUrl(result);
      onSpend(cost);

    } catch (err: any) {
      setError("Generation failed. " + (err.message || "Try again later."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button 
          onClick={onBack}
          className="text-gray-500 hover:text-blue-600 font-bold flex items-center gap-2"
        >
          ← Back to Home / חזרה
      </button>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-20 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex justify-between items-center">
             <div>
                <h1 className="text-3xl font-extrabold flex items-center gap-2">
                    <Gift className="w-8 h-8" />
                    חנות ההפתעות!
                </h1>
                <p className="text-yellow-100 mt-1 font-bold text-lg">Magic Creative Studio</p>
             </div>
             <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30 text-center">
                 <span className="block text-xs uppercase opacity-80">Your Points</span>
                 <span className="text-3xl font-black">{currentScore} <span className="text-lg">XP</span></span>
             </div>
          </div>
      </div>

      {/* Main Studio Card */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
             <button 
                onClick={() => { setMode('video'); setResultUrl(null); }}
                className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 transition ${mode === 'video' ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-500' : 'text-gray-500 hover:bg-gray-50'}`}
             >
                <Video className="w-5 h-5" />
                Create Video (50 XP)
             </button>
             <button 
                onClick={() => { setMode('image'); setResultUrl(null); }}
                className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 transition ${mode === 'image' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:bg-gray-50'}`}
             >
                <ImageIcon className="w-5 h-5" />
                Create Image (20 XP)
             </button>
          </div>

          <div className="p-6 space-y-6">
             <p className="text-gray-600 text-center font-medium">
                 {mode === 'video' 
                    ? "Upload a photo and make it move! / העלה תמונה ותן לה חיים!"
                    : "Describe a picture and I will draw it! / תאר תמונה ואני אצייר אותה!"}
             </p>

             {/* Upload Area */}
             <div 
                onClick={() => fileInputRef.current?.click()}
                className={`
                    border-4 border-dashed rounded-xl h-56 flex flex-col items-center justify-center cursor-pointer transition-colors relative
                    ${image ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50'}
                `}
                >
                {image ? (
                    <img src={image} alt="Preview" className="h-full w-full object-contain rounded-lg p-2" />
                ) : (
                    <div className="text-center p-4">
                        <Upload className="w-12 h-12 text-gray-400 mb-2 mx-auto" />
                        <span className="text-gray-500 font-bold block">
                            {mode === 'video' ? 'Upload Photo (Required)' : 'Upload Photo (Optional)'}
                        </span>
                        <span className="text-xs text-gray-400">Click to browse</span>
                    </div>
                )}
                {image && (
                    <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow cursor-pointer hover:bg-red-50" onClick={(e) => { e.stopPropagation(); setImage(null); }}>
                        <span className="text-red-500 font-bold px-2">✕ Remove</span>
                    </div>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                />
            </div>

            {/* Prompt */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    {mode === 'video' ? 'What is happening in the video?' : 'What should I draw?'}
                </label>
                <input 
                    type="text" 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none font-english"
                    placeholder={mode === 'video' ? "e.g., The cat is flying in space" : "e.g., A happy robot eating pizza"}
                />
            </div>

            {/* Action Button */}
            <button
                onClick={handleGenerate}
                disabled={loading || !canAfford || (mode === 'video' && !image)}
                className={`
                    w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition transform active:scale-95
                    ${loading || !canAfford || (mode === 'video' && !image)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-orange-500 text-white hover:bg-orange-600'}
                `}
            >
                {loading ? (
                    <span className="animate-pulse">Creating Magic... (Wait a moment)</span>
                ) : (
                    <>
                        <Sparkles className="w-5 h-5 fill-current" />
                        {canAfford ? `Create! (-${cost} XP)` : `Not enough points (Need ${cost} XP)`}
                    </>
                )}
            </button>
            
            {!canAfford && (
                <p className="text-center text-red-500 text-sm font-bold">
                    You need more XP! Read more stories to earn points.
                </p>
            )}

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}
            
            {/* Result Display */}
            {resultUrl && (
                <div className="mt-8 bg-green-50 p-6 rounded-2xl border-2 border-green-200 animate-in zoom-in-95">
                    <h3 className="text-center font-bold text-green-800 text-xl mb-4">✨ It's Ready! ✨</h3>
                    {mode === 'video' ? (
                        <video 
                        controls 
                        autoPlay 
                        loop
                        className="w-full rounded-xl shadow-lg border-4 border-white"
                        src={resultUrl}
                        />
                    ) : (
                        <img 
                        src={resultUrl} 
                        alt="Generated Result" 
                        className="w-full rounded-xl shadow-lg border-4 border-white"
                        />
                    )}
                    <a 
                        href={resultUrl} 
                        download="magic_creation" 
                        className="block mt-4 text-center text-blue-600 font-bold hover:underline"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Download / הורד
                    </a>
                </div>
            )}

          </div>
      </div>
    </div>
  );
};

export default VeoStudio;