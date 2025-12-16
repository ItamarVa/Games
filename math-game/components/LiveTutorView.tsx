
import React, { useEffect, useRef, useState } from 'react';
import { createLiveSession } from '../services/geminiService';
import { createPcmBlob, decodeAudioData, decodeAudioResponse } from '../utils/audio';
import { LiveServerMessage } from '@google/genai';

interface LiveTutorViewProps {
  onBack: () => void;
  context?: string; // e.g. "Currently struggling with Long Division"
}

export const LiveTutorView: React.FC<LiveTutorViewProps> = ({ onBack, context }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState("מתחבר למורה...");
  
  // Refs for audio handling
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const inputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initial connection
  useEffect(() => {
    let session: any = null;
    let cleanup = () => {};

    const init = async () => {
      try {
        // Setup Output Audio
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        // Setup Input Audio
        inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const inputSource = inputContextRef.current.createMediaStreamSource(stream);
        const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
        
        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmBlob = createPcmBlob(inputData);
          
          if (session) {
            session.sendRealtimeInput({ media: { mimeType: 'audio/pcm', data: pcmBlob } });
          }
        };

        inputSource.connect(processor);
        processor.connect(inputContextRef.current.destination);

        // Connect to Gemini
        const sessionPromise = createLiveSession(
          () => {
            setIsConnected(true);
            setStatus("המורה מקשיב/ה...");
            // Send context immediately
            if (context && session) {
              session.sendRealtimeInput({ 
                text: `The student is asking for help regarding: ${context}. say hello and ask how you can help with this.` 
              });
            }
          },
          async (msg: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const ctx = audioContextRef.current;
              setIsSpeaking(true);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioData = decodeAudioResponse(base64Audio);
              const audioBuffer = await decodeAudioData(audioData, ctx);
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsSpeaking(false);
              };
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
            
            // Handle Interruptions
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          () => {
            setStatus("השיחה הסתיימה");
            setIsConnected(false);
          },
          (err) => {
            console.error(err);
            setStatus("שגיאה בחיבור");
          }
        );

        session = await sessionPromise;

        cleanup = () => {
          if (session) {
             // We can't easily "close" the session via the wrapper if not exposed, 
             // but we can stop sending audio.
             // Ideally we call session.close() if exposed.
          }
          if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
          if (inputContextRef.current) inputContextRef.current.close();
          if (audioContextRef.current) audioContextRef.current.close();
          processor.disconnect();
          inputSource.disconnect();
        };

      } catch (e) {
        console.error("Failed to init live session", e);
        setStatus("לא ניתן לגשת למיקרופון");
      }
    };

    init();

    return () => cleanup();
  }, [context]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 to-purple-800 z-50 flex flex-col items-center justify-center text-white p-6">
      <button 
        onClick={onBack}
        className="absolute top-6 right-6 bg-white/20 hover:bg-white/30 rounded-full p-2"
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="relative mb-12">
        {/* Animated Avatar/Visualizer */}
        <div className={`w-48 h-48 rounded-full bg-gradient-to-tr from-pink-400 to-blue-500 flex items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.5)] transition-transform duration-200 ${isSpeaking ? 'scale-110' : 'scale-100'}`}>
           <span className="text-6xl">🦉</span>
        </div>
        {isSpeaking && (
           <div className="absolute inset-0 rounded-full border-4 border-white opacity-50 animate-ping"></div>
        )}
      </div>

      <h2 className="text-3xl font-bold mb-4">{status}</h2>
      <p className="text-center text-indigo-200 max-w-md text-lg">
        {isConnected 
          ? "אני מקשיב... דברו איתי חופשי על התרגיל או כל דבר אחר בחשבון!" 
          : "אנא המתינו..."}
      </p>

      <div className="mt-12 flex gap-4">
        {/* Controls could go here */}
      </div>
    </div>
  );
};
