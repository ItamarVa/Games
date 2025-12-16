
import React, { useState, useEffect, useRef } from 'react';
import { generateQuestion } from '../services/geminiService';
import { getFallbackQuestion, getRandomFallbackQuestion } from '../utils/fallbacks';
import { Question, Topic } from '../types';

interface QuizViewProps {
  topic: Topic;
  onBack: () => void;
  onCompleteQuestion: (points: number) => void;
  onRequestTutor: () => void;
}

const MIXED_PROMPTS = [
  'מבנה עשרוני: ערך הספרה וערך המקום במספרים עד מיליון',
  'ארבע פעולות החשבון: חיבור, חיסור, כפל וחילוק',
  'השוואת מספרים וביטויים חשבוניים (גדול/קטן/שווה)',
  'סדר פעולות חשבון: סוגריים, כפל וחילוק קודמים לחיבור וחיסור',
  'זיהוי שברים וכתיבתם במילים ובספרות',
  'הפיכת מספר מעורב לשבר מדומה (גדול מ-1) ולהפך',
  'אלכסונים במצולעים: תכונות וזיהוי',
  'זוויות ומקבילות במצולעים (מרובעים ומשולשים)'
];

// Helper to render text with math formulas on one line
const formatTextWithMath = (text: string) => {
  const parts = text.split(/(`[^`]+`)/);
  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      const math = part.slice(1, -1);
      return (
        <span 
          key={index} 
          className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded mx-1 font-mono font-bold whitespace-nowrap inline-block border border-indigo-100" 
          dir="ltr"
        >
          {math}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

export const QuizView: React.FC<QuizViewProps> = ({ topic, onBack, onCompleteQuestion, onRequestTutor }) => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  const nextQuestionPromiseRef = useRef<Promise<Question> | null>(null);

  const fetchSafeQuestion = async (): Promise<Question> => {
    try {
      if (topic.id === 'mixed') {
        const randomPrompt = MIXED_PROMPTS[Math.floor(Math.random() * MIXED_PROMPTS.length)];
        const qData = await generateQuestion(randomPrompt, 'medium');
        return { ...qData, id: `ai-${Date.now()}` };
      }
      
      const qData = await generateQuestion(topic.title, 'medium');
      return { ...qData, id: `ai-${Date.now()}` };

    } catch (e) {
      console.warn("AI generation failed, using fallback");
      if (topic.id === 'mixed') {
        return getRandomFallbackQuestion();
      }
      return getFallbackQuestion(topic.category);
    }
  };

  const startPrefetch = () => {
    nextQuestionPromiseRef.current = fetchSafeQuestion();
  };

  const loadQuestion = async (isInitial = false) => {
    setLoading(true);
    setShowResult(false);
    setSelectedOption(null);

    let nextQ: Question | null = null;

    if (!isInitial && nextQuestionPromiseRef.current) {
      try {
        nextQ = await nextQuestionPromiseRef.current;
      } catch (e) {
        nextQ = await fetchSafeQuestion();
      }
    } else {
      nextQ = await fetchSafeQuestion();
    }

    setQuestion(nextQ);
    setLoading(false);
    startPrefetch();
  };

  useEffect(() => {
    loadQuestion(true);
    return () => { nextQuestionPromiseRef.current = null; };
  }, [topic]);

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedOption(index);
    setShowResult(true);
    const correct = index === question?.correctAnswerIndex;
    setIsCorrect(correct);
    if (correct) {
      onCompleteQuestion(10);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-xl text-blue-600 font-medium animate-pulse">המורה מכין שאלה...</p>
        {topic.id === 'mixed' && (
          <p className="text-sm text-gray-500 mt-2">בוחר נושא בהפתעה...</p>
        )}
      </div>
    );
  }

  if (!question || !Array.isArray(question.options)) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 text-lg mb-4">אופס! הייתה בעיה בטעינת השאלה.</p>
        <button onClick={() => loadQuestion(false)} className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700">
          נסה שוב
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700 font-bold text-lg">
          ➜ חזרה
        </button>
        <span className="bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm font-bold">
          {topic.id === 'mixed' ? 'תרגול מעורב' : topic.title}
        </span>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 relative overflow-hidden">
        {/* Blob Decoration */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-yellow-300 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-blue-300 rounded-full blur-3xl opacity-30"></div>

        {/* Question Text */}
        <div className="relative z-10 mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 leading-relaxed">
            {formatTextWithMath(question.text)}
          </h2>
          
          {/* SVG Illustration if available */}
          {question.svg && (
            <div 
              className="mt-6 flex justify-center p-4 bg-gray-50 rounded-xl border border-gray-100"
              dangerouslySetInnerHTML={{ __html: question.svg }} 
            />
          )}
        </div>

        <div className="grid gap-4 relative z-10">
          {question.options.map((option, idx) => {
            let btnClass = "p-4 md:p-6 text-right rounded-xl border-2 text-lg font-medium transition-all duration-200 transform hover:scale-[1.02] ";
            
            if (showResult) {
              if (idx === question.correctAnswerIndex) {
                btnClass += "bg-green-100 border-green-500 text-green-800 shadow-green-200";
              } else if (idx === selectedOption) {
                btnClass += "bg-red-100 border-red-500 text-red-800";
              } else {
                btnClass += "bg-gray-50 border-gray-100 opacity-50";
              }
            } else {
              btnClass += "bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50 shadow-sm";
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={showResult}
                className={btnClass}
              >
                {formatTextWithMath(option)}
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className="mt-8 p-6 rounded-2xl bg-gray-50 border border-gray-200 animate-fade-in relative z-10">
            <h3 className={`text-xl font-bold mb-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {isCorrect ? 'כל הכבוד! 🎉' : 'לא נורא, ננסה שוב!'}
            </h3>
            <p className="text-gray-600 mb-4">{formatTextWithMath(question.explanation)}</p>
            
            <div className="flex gap-4 mt-6">
              <button 
                onClick={() => loadQuestion(false)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-colors"
              >
                השאלה הבאה
              </button>
              
              {!isCorrect && (
                <button 
                  onClick={onRequestTutor}
                  className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 py-3 rounded-xl font-bold border border-purple-300 transition-colors flex items-center justify-center gap-2"
                >
                  <span>🙋‍♂️</span> אני צריך עזרה
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <button 
          onClick={onRequestTutor}
          className="text-gray-500 hover:text-purple-600 text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <span className="bg-purple-100 p-2 rounded-full">🦉</span>
           פתח את המורה הפרטי
        </button>
      </div>
    </div>
  );
};
