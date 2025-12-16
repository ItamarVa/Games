
import React from 'react';
import { Topic, TopicCategory } from '../types';
import { MIXED_TOPIC } from '../constants';

interface DashboardProps {
  topics: Topic[];
  onSelectTopic: (topic: Topic) => void;
  userPoints: number;
}

const CategorySection: React.FC<{ 
  title: string; 
  topics: Topic[]; 
  color: string;
  onSelect: (t: Topic) => void;
}> = ({ title, topics, color, onSelect }) => {
  if (!topics || topics.length === 0) return null;
  return (
    <div className="mb-8">
      <h3 className={`text-2xl font-bold mb-4 text-${color}-600 border-b-2 border-${color}-200 pb-2`}>
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map(topic => (
          <button
            key={topic.id}
            onClick={() => onSelect(topic)}
            className={`bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-${color}-400 group text-right relative overflow-hidden`}
          >
            <div className={`absolute top-0 left-0 w-2 h-full bg-${color}-400`}></div>
            <h4 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
              {topic.title}
            </h4>
            <p className="text-gray-500 text-sm">
              {topic.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ topics, onSelectTopic }) => {
  const safeTopics = topics || [];
  const wholeNumbers = safeTopics.filter(t => t.category === TopicCategory.WHOLE_NUMBERS);
  const fractions = safeTopics.filter(t => t.category === TopicCategory.FRACTIONS);
  const geometry = safeTopics.filter(t => t.category === TopicCategory.GEOMETRY);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
          ברוכים הבאים ל-Math Game!
        </h1>
        <p className="text-xl text-gray-600">
          מתחילים לתרגל וצוברים נקודות 🏆
        </p>
      </div>

      {/* Hero Section: Mixed Practice */}
      <div className="mb-12 flex justify-center">
        <button
          onClick={() => onSelectTopic(MIXED_TOPIC)}
          className="relative group w-full max-w-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1 rounded-3xl shadow-2xl hover:shadow-indigo-500/50 transform hover:-translate-y-1 transition-all duration-300"
        >
          <div className="bg-white rounded-[20px] p-8 h-full flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-300 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob animation-delay-2000"></div>
            
            <h2 className="text-3xl font-black text-gray-800 mb-2 relative z-10 group-hover:scale-105 transition-transform">
              🎲 תרגול מעורב (מומלץ!)
            </h2>
            <p className="text-lg text-gray-600 mb-4 relative z-10">
              שאלות הפתעה מכל הנושאים. מוכנים לאתגר?
            </p>
            <span className="inline-block bg-gray-900 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg group-hover:bg-gray-800 transition-colors relative z-10">
              התחל עכשיו ➜
            </span>
          </div>
        </button>
      </div>

      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-gray-400 uppercase tracking-wider">או בחר נושא ספציפי</h3>
      </div>

      <CategorySection 
        title="מספרים שלמים" 
        topics={wholeNumbers} 
        color="blue" 
        onSelect={onSelectTopic} 
      />
      <CategorySection 
        title="שברים" 
        topics={fractions} 
        color="purple" 
        onSelect={onSelectTopic} 
      />
      <CategorySection 
        title="גיאומטריה" 
        topics={geometry} 
        color="green" 
        onSelect={onSelectTopic} 
      />
    </div>
  );
};
