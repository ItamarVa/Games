import React, { useState, useRef, useEffect, useMemo } from 'react';
import { StoryData, QuizQuestion } from '../types';
import { generateSpeech, checkReading, pcmToAudioBuffer, translateSpokenWord } from '../services/geminiService';
import { Play, Pause, Mic, CheckCircle, HelpCircle, Star, BookOpen, Volume2, MessageCircle, SkipBack, SkipForward, AlertCircle, Trophy } from 'lucide-react';

interface StoryModeProps {
  story: StoryData;
  onFinish: (sessionScore: number) => void;
  onAddPoints: (points: number) => void;
}

// Helper for robust sentence splitting
const splitTextToSentences = (text: string): string[] => {
  // Try Intl.Segmenter (Modern Browsers) - best for handling "Mr.", quotes, etc.
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
     // Cast to any to avoid TS errors if lib target is old
     const segmenter = new (Intl as any).Segmenter('en', { granularity: 'sentence' });
     return Array.from(segmenter.segment(text))
        .map((s: any) => s.segment.trim())
        .filter((s: string) => s.length > 0);
  }
  
  // Fallback: Split preserving delimiters so no text is lost.
  // Matches punctuation [.!?] followed optionally by quotes/parens ['"”’)], followed by whitespace/EOF
  const parts = text.split(/([.!?]+['"”’)]?(?:\s+|$))/);
  const result: string[] = [];
  
  for (let i = 0; i < parts.length; i += 2) {
     const part = parts[i];
     const delim = parts[i+1] || '';
     const full = (part + delim).trim();
     if (full) result.push(full);
  }
  
  return result;
};

// Custom Friendly Brown Owl Icon
const OwlIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Ears/Tufts */}
    <path d="M20 20 L35 30 L25 40 Z" fill="#8B4513" />
    <path d="M80 20 L65 30 L75 40 Z" fill="#8B4513" />
    
    {/* Body */}
    <ellipse cx="50" cy="55" rx="40" ry="42" fill="#8B4513" />
    
    {/* Belly */}
    <ellipse cx="50" cy="68" rx="28" ry="25" fill="#D2691E" opacity="0.8" />
    
    {/* Eyes Background (Glasses look) */}
    <circle cx="35" cy="42" r="14" fill="#3E2723" />
    <circle cx="65" cy="42" r="14" fill="#3E2723" />
    
    {/* Eyes White */}
    <circle cx="35" cy="42" r="11" fill="white" />
    <circle cx="65" cy="42" r="11" fill="white" />
    
    {/* Pupils */}
    <circle cx="35" cy="42" r="4" fill="black" />
    <circle cx="65" cy="42" r="4" fill="black" />
    <circle cx="37" cy="40" r="1.5" fill="white" /> 
    <circle cx="67" cy="40" r="1.5" fill="white" />
    
    {/* Beak */}
    <path d="M45 52 L55 52 L50 62 Z" fill="#FFD700" stroke="#B8860B" strokeWidth="1" />
    
    {/* Feet */}
    <path d="M35 95 L30 100 L40 100 Z" fill="#FFD700" />
    <path d="M65 95 L60 100 L70 100 Z" fill="#FFD700" />
  </svg>
);

const StoryMode: React.FC<StoryModeProps> = ({ story, onFinish, onAddPoints }) => {
  const [step, setStep] = useState<'read' | 'vocab' | 'comprehension'>('read');
  
  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(-1);
  const [loadingAudio, setLoadingAudio] = useState(false);
  
  // Recording State (Reading)
  const [isRecording, setIsRecording] = useState(false);
  const [readingFeedback, setReadingFeedback] = useState<string | null>(null);

  // Side Helper (Chat) State
  const [helperResult, setHelperResult] = useState<string | null>(null);
  const [isHelperListening, setIsHelperListening] = useState(false);

  // Quiz State
  const [quizScore, setQuizScore] = useState(0); // We keep this for the session summary
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const shouldStopRef = useRef(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Recorder Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recordingContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Audio Cache
  const audioCacheRef = useRef<Map<number, AudioBuffer>>(new Map());
  
  // Ref for quota status to avoid retry loops when limit reached
  const isQuotaExceededRef = useRef(false);

  // Split content into sentences for highlighting
  const sentences = useMemo(() => {
    return splitTextToSentences(story.content);
  }, [story.content]);

  // Initial Prefetch on Mount
  useEffect(() => {
    const loadInitialAudio = async () => {
      // Sequential prefetch to be gentle on rate limits
      await getAudioForSentence(0);
      if (!shouldStopRef.current) getAudioForSentence(1);
    };
    loadInitialAudio();

    return () => {
      stopPlayback();
      cleanupRecording();
    };
  }, [sentences]);

  // --- AUDIO BUFFERING & LOGIC ---

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const getAudioForSentence = async (index: number): Promise<AudioBuffer | null> => {
    if (index >= sentences.length || index < 0) return null;
    
    if (audioCacheRef.current.has(index)) {
        return audioCacheRef.current.get(index)!;
    }

    // Use native if we know quota is dead
    if (isQuotaExceededRef.current) return null;

    const text = sentences[index];
    if(!text) return null;

    try {
        const audioData = await generateSpeech(text);
        const ctx = initAudioContext();
        const buffer = pcmToAudioBuffer(audioData, ctx, 24000);
        audioCacheRef.current.set(index, buffer);
        return buffer;
    } catch (e: any) {
        if (e.message === "QUOTA_EXCEEDED") {
           isQuotaExceededRef.current = true;
           console.warn("Switching to Native TTS due to quota");
        } else {
           console.error("Error generating speech for index", index, e);
        }
        return null;
    }
  };

  const prefetchUpcoming = (currentIndex: number) => {
      // Reduce prefetch concurrency to 1 to avoid 429
      getAudioForSentence(currentIndex + 1);
  };

  const playNativeTTS = (text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    currentUtteranceRef.current = utterance; // Keep ref to prevent GC
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    
    utterance.onend = () => {
        currentUtteranceRef.current = null;
        // Only trigger callback if we weren't stopped manually
        if (!shouldStopRef.current && onEnd) {
             onEnd();
        }
    };
    
    utterance.onerror = (e) => {
        currentUtteranceRef.current = null;
        // Ignore interrupted/canceled errors
        if (e.error === 'interrupted' || e.error === 'canceled') {
            return;
        }
        console.error("Native TTS error:", e.error);
        if (!shouldStopRef.current && onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopPlayback = () => {
    shouldStopRef.current = true;
    if (currentSourceRef.current) {
      currentSourceRef.current.stop();
      currentSourceRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const playSentence = async (index: number) => {
    if (index >= sentences.length || shouldStopRef.current) {
      setIsPlaying(false);
      setActiveSentenceIndex(-1);
      return;
    }

    setActiveSentenceIndex(index);
    setLoadingAudio(true);

    // Try getting AI Audio
    const buffer = await getAudioForSentence(index);
    
    if (shouldStopRef.current) {
        setLoadingAudio(false);
        return;
    }

    if (buffer) {
        // --- Play with Gemini ---
        const ctx = initAudioContext();
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        currentSourceRef.current = source;
        
        setLoadingAudio(false);
        source.start(0);
        
        prefetchUpcoming(index);

        source.onended = () => {
          if (!shouldStopRef.current) {
             playSentence(index + 1);
          }
        };
    } else {
        // --- Play with Native Fallback ---
        setLoadingAudio(false);
        // We still prefetch next (maybe quota recovers? unlikely but harmless if flagged)
        prefetchUpcoming(index);
        
        playNativeTTS(sentences[index], () => {
            playSentence(index + 1);
        });
    }
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback();
      shouldStopRef.current = true; 
    } else {
      shouldStopRef.current = false;
      setIsPlaying(true);
      const nextIdx = activeSentenceIndex === -1 ? 0 : activeSentenceIndex;
      playSentence(nextIdx);
    }
  };

  const skipSentence = (direction: 'prev' | 'next') => {
      stopPlayback();
      setTimeout(() => {
          let nextIdx = direction === 'next' ? activeSentenceIndex + 1 : activeSentenceIndex - 1;
          if (nextIdx < 0) nextIdx = 0;
          if (nextIdx >= sentences.length) nextIdx = 0; 
          
          shouldStopRef.current = false;
          setIsPlaying(true);
          playSentence(nextIdx);
      }, 50);
  };

  // --- RECORDING HELPERS (Silence Detection) ---

  const cleanupRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
      }
      if (recordingContextRef.current) {
          recordingContextRef.current.close();
          recordingContextRef.current = null;
      }
      if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
      }
      if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
      }
  };

  const startSmartRecording = async (onData: (blob: Blob, mimeType: string) => void) => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          // Setup Audio Analysis for Silence
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          recordingContextRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyserRef.current = analyser;

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          let silenceStart = Date.now();
          const SILENCE_THRESHOLD = 10; // Adjust based on noise floor
          const SILENCE_DURATION = 1500; // 1.5 seconds

          const checkSilence = () => {
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for(let i=0; i<bufferLength; i++) sum += dataArray[i];
              const average = sum / bufferLength;

              if (average > SILENCE_THRESHOLD) {
                  silenceStart = Date.now();
              } else if (Date.now() - silenceStart > SILENCE_DURATION) {
                  // Detected silence
                  if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                      mediaRecorderRef.current.stop();
                  }
                  return; // Stop loop
              }
              animationFrameRef.current = requestAnimationFrame(checkSilence);
          };
          
          // Setup Recorder
          const recorder = new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;
          audioChunksRef.current = [];

          recorder.ondataavailable = (e) => {
              if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };

          recorder.onstop = () => {
             cancelAnimationFrame(animationFrameRef.current!);
             // Combine chunks
             const mimeType = recorder.mimeType || 'audio/webm';
             if (audioChunksRef.current.length > 0) {
                 const blob = new Blob(audioChunksRef.current, { type: mimeType });
                 onData(blob, mimeType);
             } else {
                 console.warn("Empty recording");
             }
             stream.getTracks().forEach(track => track.stop());
             if(recordingContextRef.current) recordingContextRef.current.close();
          };

          recorder.start();
          animationFrameRef.current = requestAnimationFrame(checkSilence);

      } catch (e) {
          console.error("Mic error", e);
          alert("Could not access microphone");
          throw e;
      }
  };

  // --- RECORDING: READ ALOUD ---

  const toggleRecording = async () => {
    if (isRecording) {
      cleanupRecording();
      setIsRecording(false);
    } else {
      if (isPlaying) stopPlayback(); 
      setIsRecording(true);
      setReadingFeedback("Listening... (Speak now)");
      
      try {
          await startSmartRecording(async (blob, mimeType) => {
             setIsRecording(false);
             setReadingFeedback("Thinking... / חושב...");
             
             const reader = new FileReader();
             reader.readAsDataURL(blob);
             reader.onloadend = async () => {
                const base64 = (reader.result as string).split(',')[1];
                try {
                    const feedback = await checkReading(base64, mimeType, story.content);
                    setReadingFeedback(feedback);
                    
                    // Parse Score and update globally
                    const scoreMatch = feedback.match(/Score:\s*(\d+)/i);
                    if (scoreMatch && scoreMatch[1]) {
                        const points = parseInt(scoreMatch[1], 10) * 10; // 100 max per read
                        if (points > 0) {
                             // Just for visual effect in component
                             setQuizScore(s => s + points);
                             onAddPoints(points); // Update global score immediately
                        }
                    }

                } catch (e) {
                    setReadingFeedback("Error analyzing audio. Try again.");
                }
             };
          });
      } catch {
          setIsRecording(false);
      }
    }
  };

  // --- RECORDING: OWL HELPER ---

  const toggleHelper = async () => {
      if (isHelperListening) {
          cleanupRecording();
          setIsHelperListening(false);
      } else {
          if (isPlaying) stopPlayback();
          setIsHelperListening(true);
          setHelperResult("Listening... (Auto-send on silence)");
          
          try {
             await startSmartRecording(async (blob, mimeType) => {
                 setIsHelperListening(false);
                 setHelperResult("Thinking...");
                 
                 const reader = new FileReader();
                 reader.readAsDataURL(blob);
                 reader.onloadend = async () => {
                    const base64 = (reader.result as string).split(',')[1];
                    try {
                        const ans = await translateSpokenWord(base64, mimeType);
                        setHelperResult(ans);
                    } catch(e) {
                        setHelperResult("Sorry, error connecting.");
                    }
                 };
             });
          } catch {
              setIsHelperListening(false);
          }
      }
  };


  // --- VOCAB LOGIC (NATIVE) ---

  const handleVocabClick = (word: string, trans: string) => {
      if(isPlaying) stopPlayback();
      
      // Native TTS
      const synth = window.speechSynthesis;
      synth.cancel(); // Stop any current speech

      // English Word
      const utterEn = new SpeechSynthesisUtterance(word);
      utterEn.lang = 'en-US';
      utterEn.rate = 0.8;

      // Hebrew Translation
      const utterHe = new SpeechSynthesisUtterance(trans);
      utterHe.lang = 'he-IL';
      utterHe.rate = 0.9;
      
      // Chain them
      synth.speak(utterEn);
      
      const voices = synth.getVoices();
      const hasHebrew = voices.some(v => v.lang.includes('he'));
      
      if(hasHebrew) {
          synth.speak(utterHe);
      } else {
          synth.speak(utterHe);
      }
  };

  // --- QUIZ LOGIC ---

  const handleAnswer = (index: number, currentQuiz: QuizQuestion[]) => {
    if (answered) return;
    setSelectedOption(index);
    setAnswered(true);
    if (index === currentQuiz[currentQuestionIndex].correctIndex) {
      setQuizScore(s => s + 10);
      onAddPoints(10); // Update global score immediately
    }
  };

  const nextQuestion = (currentQuiz: QuizQuestion[], nextStep: 'vocab' | 'comprehension' | 'finish') => {
    if (currentQuestionIndex < currentQuiz.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setAnswered(false);
      setSelectedOption(null);
    } else {
      if (nextStep === 'finish') {
        onFinish(quizScore);
      } else {
        setStep(nextStep);
        setCurrentQuestionIndex(0);
        setAnswered(false);
        setSelectedOption(null);
      }
    }
  };

  // --- RENDER ---

  if (step === 'read') {
    return (
      <div className="space-y-6 pb-24 relative">
        <div className="flex justify-between items-start" dir="ltr">
             <h2 className="text-3xl font-bold font-english text-blue-700 text-left">{story.title}</h2>
        </div>
        
        {/* Story Text with Highlighting */}
        <div className="bg-white p-6 rounded-2xl shadow-md font-english text-xl leading-relaxed text-gray-700 text-left" dir="ltr">
          {sentences.map((sentence, idx) => (
            <span 
              key={idx}
              onClick={() => {
                   stopPlayback();
                   setTimeout(() => {
                       shouldStopRef.current = false;
                       setIsPlaying(true);
                       playSentence(idx);
                   }, 50);
              }}
              className={`transition-colors duration-300 rounded px-1 cursor-pointer hover:bg-gray-100 ${activeSentenceIndex === idx ? 'bg-yellow-200 text-black font-semibold shadow-sm' : ''}`}
            >
              {sentence}
            </span>
          ))}
        </div>

        {/* Audio Controls - CRITICAL FIX: dir="ltr" forces strictly Left-To-Right layout regardless of Hebrew page */}
        <div className="flex flex-col items-center gap-4 bg-blue-50 p-4 rounded-2xl" dir="ltr">
            <div className="flex flex-wrap gap-4 justify-center items-center">
              
              <button onClick={() => skipSentence('prev')} className="p-3 bg-white rounded-full shadow hover:bg-gray-100 text-blue-500" title="Previous">
                  <SkipBack className="w-5 h-5" />
              </button>

              <button 
                onClick={togglePlayback}
                className="flex items-center gap-2 px-8 py-4 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600 transition shadow-lg active:scale-95 min-w-[140px] justify-center"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                {loadingAudio ? 'Loading...' : (isPlaying ? 'Pause' : 'Listen')}
              </button>

              <button onClick={() => skipSentence('next')} className="p-3 bg-white rounded-full shadow hover:bg-gray-100 text-blue-500" title="Next">
                  <SkipForward className="w-5 h-5" />
              </button>

              <div className="w-px h-8 bg-gray-300 mx-2"></div>

              <button 
                onClick={toggleRecording}
                className={`flex items-center gap-2 px-6 py-4 rounded-full font-bold transition shadow-lg active:scale-95 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-green-500 text-white hover:bg-green-600'}`}
              >
                {isRecording ? <div className="w-4 h-4 bg-white rounded-full" /> : <Mic className="w-6 h-6" />}
                {isRecording ? 'Listening...' : 'Read Aloud'}
              </button>
            </div>
            {isRecording && <p className="text-xs text-green-600 animate-pulse">Speak now, I will stop when you are done.</p>}
        </div>

        {/* Feedback Area */}
        {readingFeedback && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-right animate-in zoom-in-95">
                <h3 className="font-bold text-yellow-800 mb-2">Reading Feedback:</h3>
                <p className="whitespace-pre-wrap text-gray-700">{readingFeedback}</p>
            </div>
        )}
        
        {/* Vocabulary List */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Vocabulary (Click to listen) / אוצר מילים</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {story.vocabulary.map((v, i) => (
              <button 
                key={i} 
                onClick={() => handleVocabClick(v.word, v.translation)}
                className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center hover:bg-blue-50 transition active:scale-95"
              >
                <div className="flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-blue-400" />
                    <span className="font-english font-bold text-blue-600">{v.word}</span>
                </div>
                <span className="text-gray-500 text-sm">{v.translation}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Grounding Fun Fact */}
        {story.funFact && (
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-xl border-2 border-white shadow-sm mt-6">
            <div className="flex items-center gap-2 mb-2 text-purple-700 font-bold">
              <Star className="w-5 h-5 fill-current" />
              <span>Did you know?</span>
            </div>
            <p className="text-gray-800 text-sm">{story.funFact}</p>
            {story.funFactSource && (
              <p className="text-xs text-gray-500 mt-2 text-left" dir="ltr">Source: {story.funFactSource}</p>
            )}
          </div>
        )}

        <button 
          onClick={() => setStep('vocab')}
          className="w-full mt-6 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg blob-btn"
        >
          Start Practice / התחל תרגול
        </button>

        {/* Side AI Helper Widget (Owl) */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
            {helperResult && (
                <div className="bg-white p-4 rounded-2xl shadow-xl border border-purple-200 max-w-xs animate-in slide-in-from-right-10 mb-2 text-right">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-purple-500">מורה</span>
                        <button onClick={() => setHelperResult(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                    </div>
                    <p className="text-sm font-medium text-gray-800 dir-rtl">{helperResult}</p>
                </div>
            )}
            <button 
                onClick={toggleHelper}
                className={`w-16 h-16 rounded-full shadow-2xl border-4 transition-all hover:scale-105 flex items-center justify-center ${isHelperListening ? 'bg-red-500 border-red-200 animate-pulse' : 'bg-indigo-600 border-white'}`}
            >
                {isHelperListening ? (
                   <Mic className="w-8 h-8 text-white" />
                ) : (
                   <OwlIcon className="w-10 h-10" />
                )}
            </button>
            <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded-lg shadow">
                {isHelperListening ? 'מקשיב...' : 'תרגום מילה'}
            </span>
        </div>

      </div>
    );
  }

  // Quiz Renderer Helper
  const renderQuiz = (quizData: QuizQuestion[], title: string, nextPhase: 'vocab' | 'comprehension' | 'finish') => {
    const question = quizData[currentQuestionIndex];
    if (!question) return <div>No questions available.</div>;

    return (
      <div className="space-y-6 max-w-xl mx-auto">
        <div className="flex justify-between items-center text-sm font-bold text-gray-400">
           <span>{title}</span>
           <span>Question {currentQuestionIndex + 1} / {quizData.length}</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border-b-4 border-blue-100 relative overflow-hidden">
          
          <div className="flex items-start gap-4 mb-6" dir="ltr">
             {/* Read Question Button */}
             <button 
                onClick={() => playNativeTTS(question.question)}
                className="p-3 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200 transition shrink-0"
                title="Read Question"
             >
                <Volume2 className="w-6 h-6" />
             </button>
             
             <div className="w-full">
                <h3 className="text-xl font-bold text-gray-800 font-english">
                    {question.question}
                </h3>
                {question.questionTranslation && (
                    <p className="text-gray-500 text-right mt-2 font-medium" dir="rtl">
                        {question.questionTranslation}
                    </p>
                )}
             </div>
          </div>

          <div className="space-y-3">
            {question.options.map((opt, idx) => {
              let stateClass = "bg-gray-50 border-2 border-gray-100 hover:border-blue-300";
              if (answered) {
                if (idx === question.correctIndex) stateClass = "bg-green-100 border-2 border-green-400 text-green-800";
                else if (idx === selectedOption) stateClass = "bg-red-100 border-2 border-red-400 text-red-800 opacity-60";
                else stateClass = "opacity-50";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx, quizData)}
                  disabled={answered}
                  className={`w-full p-4 rounded-xl text-right font-medium transition-all duration-200 ${stateClass}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {answered && (
            <div className="mt-6 animate-in fade-in slide-in-from-bottom-2">
              <div className={`p-4 rounded-lg text-sm ${selectedOption === question.correctIndex ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                <p className="font-bold mb-1 flex items-center justify-between">
                  <span>{selectedOption === question.correctIndex ? 'Correct! / נכון!' : 'Oops...'}</span>
                  {selectedOption === question.correctIndex && <span className="text-xs bg-green-200 px-2 py-1 rounded">+10 XP</span>}
                </p>
                <p>{question.explanation}</p>
              </div>
              <button
                onClick={() => nextQuestion(quizData, nextPhase)}
                className="w-full mt-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
              >
                {currentQuestionIndex < quizData.length - 1 ? 'Next Question' : 'Finish Section'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (step === 'vocab') return renderQuiz(story.vocabQuiz, 'Vocabulary Quiz', 'comprehension');
  if (step === 'comprehension') return renderQuiz(story.comprehensionQuiz, 'Reading Comprehension', 'finish');

  return null;
};

export default StoryMode;