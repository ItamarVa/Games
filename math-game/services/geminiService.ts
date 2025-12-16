
import { GoogleGenAI, Type, LiveServerMessage, Modality, GenerateContentResponse } from "@google/genai";

// Safety check: ensure process is defined before accessing it to prevent white screen crashes
const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY || '';
    }
  } catch (e) {
    // Ignore error if process is not defined
  }
  return '';
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

// Helper for timeout
const withTimeout = <T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), ms)
    )
  ]);
};

// Helper to clean JSON string more robustly
const cleanJsonString = (str: string): string => {
  // Remove markdown code blocks
  let cleaned = str.replace(/```json/g, '').replace(/```/g, '');
  
  // Find the first '{' and the last '}' to extract the JSON object
  const firstOpen = cleaned.indexOf('{');
  const lastClose = cleaned.lastIndexOf('}');
  
  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    cleaned = cleaned.substring(firstOpen, lastClose + 1);
  }
  
  return cleaned.trim();
};

// --- Quiz Generation ---

export const generateQuestion = async (topicTitle: string, difficulty: string): Promise<any> => {
  const model = "gemini-2.5-flash";
  
  // Logic for mixed topics
  const isMixed = topicTitle === 'mixed' || topicTitle.includes('מעורב');
  const topicPrompt = isMixed 
    ? "Pick a random math topic suitable for 4th grade (Geometry, Fractions, Long Multiplication, or Division)." 
    : `Topic: ${topicTitle}`;

  // Simplified prompt without Schema dependency to avoid "Invalid Argument" errors
  const prompt = `
    Create a fun, engaging multiple-choice math question for a 4th grade student in Israel.
    ${topicPrompt}
    Difficulty: ${difficulty}
    Language: Hebrew.
    
    IMPORTANT FORMATTING RULES:
    1. Enclose ALL mathematical formulas, equations, or number expressions in backticks (\`) to ensure they stay on one line. Example: "Calculate \`50 + 20\`".
    2. If the topic is GEOMETRY, you MUST provide a simple, clean SVG string in the "svg" field illustrating the shape or angle. The SVG should be 200x200px.
    
    You MUST return the result as a valid JSON object.
    Do not include any text outside the JSON object.
    
    JSON Structure:
    {
      "text": "The question text in Hebrew. Formulas inside backticks.",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswerIndex": 0,
      "explanation": "Brief explanation in Hebrew",
      "svg": "<svg...>...</svg>" (Optional, required for Geometry)
    }
  `;

  const fetchQuestion = async () => {
    // Note: Removed responseSchema as it can cause "Invalid Argument" errors with some model versions/inputs.
    // We rely on responseMimeType and prompt engineering.
    const response = await withTimeout<GenerateContentResponse>(
      ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      }),
      12000, // 12 seconds timeout
      "Timeout waiting for Gemini"
    );

    let text = response.text;
    if (!text) {
      throw new Error("No response text from Gemini");
    }

    text = cleanJsonString(text);
    
    try {
      const data = JSON.parse(text);
      
      // Validate structure
      if (!data.text || !Array.isArray(data.options) || data.options.length === 0) {
        throw new Error("Invalid question format received from API");
      }
      return data;
    } catch (parseError) {
      console.warn("JSON Parse Error:", text);
      throw new Error("Failed to parse JSON response");
    }
  };

  // Retry logic: Try once, if fail, try again
  try {
    return await fetchQuestion();
  } catch (firstError) {
    // Log as warning, not error, to avoid cluttering console for expected network flakes
    console.warn("First attempt to generate question failed, retrying...", firstError);
    try {
      return await fetchQuestion();
    } catch (secondError) {
      console.warn("Second attempt failed, falling back to local questions.", secondError);
      throw secondError; // Propagate to component to trigger fallback
    }
  }
};

// --- Text Tutor with Search ---

export const askTextTutor = async (query: string, context: string) => {
  const model = "gemini-2.5-flash";
  const systemInstruction = `
    You are a friendly, encouraging private math tutor for a 4th grade student.
    The student is learning: ${context}.
    Answer in Hebrew. Be concise, fun, and use emojis.
    If the question is about real-world examples, use Google Search to find interesting facts.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: query,
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }]
    }
  });

  return response;
};

// --- Veo Video Generation ---

export const generateRewardVideo = async (prompt: string): Promise<string | null> => {
  // Check for API key selection
  if (typeof window !== 'undefined' && (window as any).aistudio) {
     const hasKey = await (window as any).aistudio.hasSelectedApiKey();
     if (!hasKey) {
       await (window as any).aistudio.openSelectKey();
     }
  }

  // Create a new instance to ensure fresh key if selected
  const freshAi = new GoogleGenAI({ apiKey: getApiKey() });

  try {
    let operation = await freshAi.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `A cute, fun, 4th-grade appropriate animation: ${prompt}. Cartoon style, bright colors.`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await freshAi.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (videoUri) {
      return `${videoUri}&key=${getApiKey()}`;
    }
    return null;
  } catch (error) {
    console.error("Veo error:", error);
    throw error;
  }
};

// --- Image Editing (Avatar) ---

export const editAvatarImage = async (base64Image: string, prompt: string): Promise<string | null> => {
  const model = "gemini-2.5-flash-image";
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Image
            }
          },
          { text: `Edit this image to make it look like a cool math student avatar. ${prompt}. Keep it cartoonish and safe for kids.` }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e) {
    console.error("Image edit error", e);
    return null;
  }
};

// --- Live API Helpers ---

export const createLiveSession = async (
  onOpen: () => void,
  onMessage: (msg: LiveServerMessage) => void,
  onClose: () => void,
  onError: (err: any) => void
) => {
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: onOpen,
      onmessage: onMessage,
      onclose: onClose,
      onerror: onError
    },
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: "You are a helpful, patient, and fun Israeli math tutor for a 4th grader. Speak Hebrew clearly. Explain math concepts simply. Encourage the student.",
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } // Selecting a voice
      }
    }
  });
};
