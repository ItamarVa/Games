import { GoogleGenAI, Type, Modality, LiveServerMessage } from "@google/genai";
import { StoryData } from "../types";

// Helper to get client with current key
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to decode raw PCM data into an AudioBuffer
export const pcmToAudioBuffer = (buffer: ArrayBuffer, ctx: AudioContext, sampleRate: number = 24000): AudioBuffer => {
  const pcm16 = new Int16Array(buffer);
  const audioBuffer = ctx.createBuffer(1, pcm16.length, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  for (let i = 0; i < pcm16.length; i++) {
    // Normalize 16-bit integer to float [-1.0, 1.0]
    channelData[i] = pcm16[i] / 32768.0;
  }
  return audioBuffer;
};

// 1. Generate Story with Search Grounding
export const generateStory = async (topic: string): Promise<StoryData> => {
  const ai = getAiClient();
  
  const prompt = `Write a short, engaging English story (CEFR A1/A2 level) for a child about: "${topic}". 
  
  **Character & Role Guide (Use these names if the role fits the story context):**
  - **Heroines/Sisters:** "Yael" and "Avigail".
  - **Girl Friend/Cousin:** "Ariel".
  - **Boys (Friends/Cousins):** "Michael", "Ofek", "Eitan", or "Ori".
  - **Mother:** "Keren".
  - **Father:** "Itamar".
  - **Aunts:** "Ofra" or "Chen".
  - **Uncles:** "Daniel" or "Eli".
  - **Grandfather:** "Rami".

  **Story Style:**
  - Create interesting stories with educational value.
  - Incorporate imagination, creativity, and knowledge about the world.

  Also, use Google Search to find one interesting, real-world fun fact related to this topic.
  Provide vocabulary words (English to Hebrew).
  
  Include a vocabulary quiz and comprehension questions.
  The vocabulary quiz answers should be in Hebrew.
  The comprehension quiz questions should be in English, answers in English.
  
  IMPORTANT: Provide a Hebrew translation for every quiz question in the field "questionTranslation".
  
  The fun fact should be in Hebrew.
  
  RETURN JSON ONLY. Structure:
  {
    "title": "string",
    "content": "string",
    "funFact": "string",
    "vocabulary": [{"word": "string", "translation": "string"}],
    "vocabQuiz": [{"question": "string", "questionTranslation": "string", "options": ["string"], "correctIndex": number, "explanation": "string"}],
    "comprehensionQuiz": [{"question": "string", "questionTranslation": "string", "options": ["string"], "correctIndex": number, "explanation": "string"}]
  }`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });

  if (!response.text) throw new Error("Failed to generate story");

  let jsonStr = response.text.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
  }

  const data = JSON.parse(jsonStr) as StoryData;
  
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks && chunks.length > 0) {
    const webChunk = chunks.find(c => c.web);
    if (webChunk?.web) {
      data.funFactSource = webChunk.web.title || webChunk.web.uri;
    }
  }

  return data;
};

// 2. TTS Generation (For Story Reading)
export const generateSpeech = async (text: string, retryCount = 0): Promise<ArrayBuffer> => {
  if (!text || !text.trim()) {
      throw new Error("Text is empty");
  }

  const ai = getAiClient();
  try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              // Changed to Puck for a possibly friendlier/less mechanical tone
              prebuiltVoiceConfig: { voiceName: 'Puck' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("No audio generated");
      
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
  } catch (error: any) {
      // Check for Rate Limit / Quota Exhausted (429)
      const errorMsg = error.toString();
      const isRateLimit = errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('quota');
      
      if (isRateLimit) {
          console.warn("Gemini TTS Quota exceeded. Falling back to native.");
          throw new Error("QUOTA_EXCEEDED"); // Custom error to trigger fallback
      }

      if (retryCount < 2) {
          console.warn(`TTS failed, retrying (${retryCount + 1})...`);
          await new Promise(r => setTimeout(r, 1500 * (retryCount + 1))); // Increased backoff
          return generateSpeech(text, retryCount + 1);
      }
      throw error;
  }
};

// 3. Check Reading (Pronunciation) - Switched to standard Flash model
export const checkReading = async (audioBase64: string, mimeType: string, originalText: string): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash", // Changed from native-audio-preview to flash for better REST support
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: audioBase64
          }
        },
        {
          text: `The child is trying to read this text: "${originalText}". 
          Please evaluate their pronunciation and fluency. 
          Give a score out of 10.
          Give feedback in Hebrew (friendly and encouraging).
          IMPORTANT: Start your response EXACTLY with "Score: [x]/10".
          Example: "Score: 9/10\nGreat job!..."`
        }
      ]
    }
  });
  
  return response.text || "Could not analyze audio.";
};

// 7. Translate spoken word - Switched to standard Flash model
export const translateSpokenWord = async (audioBase64: string, mimeType: string): Promise<string> => {
    if (audioBase64.length < 100) {
        throw new Error("Audio too short");
    }
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", // Changed from native-audio-preview to flash
        contents: {
            parts: [
            {
                inlineData: {
                mimeType: mimeType,
                data: audioBase64
                }
            },
            {
                text: `You are a translator for kids. Identify the word or phrase spoken in the audio.
                If it's English, provide the Hebrew translation.
                If it's Hebrew, provide the English translation.
                If it's unclear, ask them to say it again in Hebrew.
                Format: "[Word] = [Translation]"
                Keep it very short.`
            }
            ]
        }
        });
        return response.text || "Could not understand.";
    } catch (e) {
        console.error("Translation error", e);
        throw new Error("Connection failed");
    }
};

// 4. Veo Video Generation
export const generateVeoVideo = async (imageB64: string, prompt: string): Promise<string> => {
  if (window.aistudio && window.aistudio.openSelectKey) {
     const hasKey = await window.aistudio.hasSelectedApiKey();
     if (!hasKey) {
       await window.aistudio.openSelectKey();
     }
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt, 
    image: {
      imageBytes: imageB64,
      mimeType: 'image/jpeg', 
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed");
  
  return `${videoUri}&key=${process.env.API_KEY}`;
};

// 6. Generate Fun Image (Reward)
export const generateFunImage = async (prompt: string, referenceImageBase64?: string): Promise<string> => {
    const ai = getAiClient();
    
    const parts: any[] = [];
    
    // If there is a reference image, add it (Editing mode)
    if (referenceImageBase64) {
        parts.push({
            inlineData: {
                data: referenceImageBase64,
                mimeType: 'image/jpeg'
            }
        });
        parts.push({ text: prompt + " (Make it cartoony and fun)" });
    } else {
        // Generation mode
        parts.push({ text: "A fun, colorful, cartoony image for a child: " + prompt });
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
            imageConfig: {
                aspectRatio: "1:1",
            }
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    
    throw new Error("No image generated");
};


// 5. Live Client (WebSocket Wrapper)
export class LiveClient {
  private sessionPromise: Promise<any> | null = null;
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext;
  private sources = new Set<AudioBufferSourceNode>();
  private nextStartTime = 0;
  private ai: GoogleGenAI;
  // Hold references to prevent Garbage Collection
  private scriptProcessor: ScriptProcessorNode | null = null;
  private mediaStream: MediaStream | null = null;
  
  constructor(
    private onOutput: (text: string) => void,
    private onError: (err: any) => void,
    private onVolume?: (vol: number) => void
  ) {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
  }

  async connect() {
    // Ensure audio output is allowed (browser autoplay policy)
    if (this.outputContext.state === 'suspended') {
      await this.outputContext.resume();
    }

    this.sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          console.log("Live session opened");
        },
        onmessage: async (message: LiveServerMessage) => {
          const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          
          if (base64Audio) {
             this.playAudio(base64Audio);
          }
          
          const interrupted = message.serverContent?.interrupted;
          if (interrupted) {
             this.sources.forEach(s => s.stop());
             this.sources.clear();
             this.nextStartTime = 0;
          }
        },
        onclose: () => {
           console.log("Session closed");
        },
        onerror: (e) => {
          this.onError(e);
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {}, // Enable VAD/Speech recognition hints
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
        },
        systemInstruction: "You are a fun and patient English teacher for a Hebrew speaking child. Speak simply, slowly, and encourage them. If they speak Hebrew, help them translate to English."
      }
    });

    await this.sessionPromise;
    await this.startMicrophone();
  }

  async startMicrophone() {
     this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
     this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
     
     const source = this.inputContext.createMediaStreamSource(this.mediaStream);
     // Store in class property to prevent Garbage Collection (Critical Fix)
     this.scriptProcessor = this.inputContext.createScriptProcessor(4096, 1, 1);
     
     this.scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calculate volume for UI feedback
        if (this.onVolume) {
           let sum = 0;
           for(let i=0; i<inputData.length; i+=10) { // Sample every 10th for speed
               sum += Math.abs(inputData[i]);
           }
           const avg = sum / (inputData.length / 10);
           this.onVolume(avg);
        }

        const pcmBlob = this.createBlob(inputData);
        if(this.sessionPromise) {
            this.sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
            });
        }
     };

     source.connect(this.scriptProcessor);
     this.scriptProcessor.connect(this.inputContext.destination);
  }

  private createBlob(data: Float32Array): any {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    
    // Manual Base64 encoding for the raw PCM
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);

    return {
      data: b64,
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  private async playAudio(base64: string) {
     const binaryString = atob(base64);
     const len = binaryString.length;
     const bytes = new Uint8Array(len);
     for (let i = 0; i < len; i++) {
       bytes[i] = binaryString.charCodeAt(i);
     }
     
     // Decode PCM 24000Hz
     const dataInt16 = new Int16Array(bytes.buffer);
     const buffer = this.outputContext.createBuffer(1, dataInt16.length, 24000);
     const channelData = buffer.getChannelData(0);
     for(let i=0; i<dataInt16.length; i++) {
         channelData[i] = dataInt16[i] / 32768.0;
     }

     const source = this.outputContext.createBufferSource();
     source.buffer = buffer;
     source.connect(this.outputContext.destination);
     
     this.nextStartTime = Math.max(this.outputContext.currentTime, this.nextStartTime);
     source.start(this.nextStartTime);
     this.nextStartTime += buffer.duration;
     
     this.sources.add(source);
     source.onended = () => this.sources.delete(source);
  }

  async disconnect() {
    if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (this.scriptProcessor) {
        this.scriptProcessor.disconnect();
        this.scriptProcessor = null;
    }
    if(this.inputContext) await this.inputContext.close();
    if(this.outputContext) await this.outputContext.close();
  }
}