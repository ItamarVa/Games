import React, { useEffect, useState, useRef } from 'react';
import { LiveClient } from '../services/geminiService';
import { Mic, MicOff, Volume2, XCircle, Play } from 'lucide-react';

interface LiveTutorProps {
  onClose: () => void;
}

const LiveTutor: React.FC<LiveTutorProps> = ({ onClose }) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  const clientRef = useRef<LiveClient | null>(null);

  const startSession = async () => {
    setStatus('connecting');
    setErrorMsg(null);
    try {
      clientRef.current = new LiveClient(
        (text) => console.log('Model says:', text),
        (err) => {
          console.error(err);
          setErrorMsg("Connection interrupted");
          setStatus('error');
        },
        (vol) => {
           // Smooth volume update
           setVolume(prev => prev * 0.8 + vol * 0.2);
        }
      );
      await clientRef.current.connect();
      setStatus('active');
    } catch (e: any) {
      console.error(e);
      setErrorMsg("Could not access microphone or connect to AI.");
      setStatus('error');
    }
  };

  useEffect(() => {
    return () => {
      clientRef.current?.disconnect();
    };
  }, []);

  // Calculate visual scale based on volume
  const scale = 1 + Math.min(volume * 5, 0.5); 
  const ringColor = volume > 0.01 ? 'bg-green-500' : 'bg-gray-300';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-yellow-200 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-blue-200 rounded-full blur-3xl opacity-50"></div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-20"
        >
          <XCircle className="w-8 h-8" />
        </button>

        <div className="flex flex-col items-center text-center space-y-6 relative z-10">
          <div className="w-24 h-24 bg-gradient-to-tr from-green-500 to-emerald-400 rounded-full flex items-center justify-center shadow-lg">
            <Volume2 className="w-12 h-12 text-white" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800">תרגול שיחה (Live)</h2>
            <p className="text-gray-500">Practice speaking English in real-time!</p>
          </div>

          <div className="w-full py-4 flex justify-center min-h-[150px] items-center">
            {status === 'idle' && (
              <button 
                onClick={startSession}
                className="flex flex-col items-center gap-3 group"
              >
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition duration-300">
                   <Play className="w-10 h-10 text-white fill-current ml-1" />
                </div>
                <span className="font-bold text-blue-600 text-lg">לחץ להתחלה</span>
              </button>
            )}

            {status === 'connecting' && (
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-500"></div>
                <span className="text-gray-500 font-medium">מתחבר... (Connecting)</span>
              </div>
            )}

            {status === 'active' && (
              <div className="relative flex justify-center items-center">
                {/* Visualizer Rings */}
                <div 
                  className={`absolute w-32 h-32 rounded-full opacity-30 transition-all duration-75 ${ringColor}`}
                  style={{ transform: `scale(${scale * 1.2})` }}
                ></div>
                <div 
                  className={`absolute w-24 h-24 rounded-full opacity-50 transition-all duration-75 ${ringColor}`}
                  style={{ transform: `scale(${scale})` }}
                ></div>
                
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center border-4 border-green-500 shadow-xl z-10">
                   <Mic className={`w-10 h-10 ${volume > 0.01 ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center gap-3">
                 <div className="text-red-500 bg-red-50 p-4 rounded-xl text-sm font-medium">
                   {errorMsg || "Connection Error"}
                 </div>
                 <button 
                   onClick={startSession}
                   className="text-blue-600 hover:underline font-bold"
                 >
                   נסה שוב (Try Again)
                 </button>
              </div>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800">
             {status === 'active' ? (
                volume > 0.01 ? (
                   <span className="font-bold text-green-600 animate-pulse">I hear you! / אני שומע אותך!</span>
                ) : (
                   <span>Listening... Speak up! / מקשיב... דבר בקול!</span>
                )
             ) : (
                <>
                    <strong>Tip:</strong> Say "Hello!" or "Can you help me practice?" to start.<br/>
                    (אמור "שלום" או "האם תוכלי לעזור לי לתרגל?")
                </>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTutor;