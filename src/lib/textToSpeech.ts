// Text-to-Speech utility using Web Speech API
// Provides accessibility for visually impaired students and reading support

let speechSynthesis: SpeechSynthesis | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

// Initialize speech synthesis
export const initSpeechSynthesis = (): boolean => {
  if (typeof window === 'undefined') return false;

  if ('speechSynthesis' in window) {
    speechSynthesis = window.speechSynthesis;
    return true;
  }
  return false;
};

// Get Portuguese voice (prefer pt-PT, fallback to pt-BR)
export const getPortugueseVoice = (): SpeechSynthesisVoice | null => {
  if (!speechSynthesis) return null;

  const voices = speechSynthesis.getVoices();

  // Prefer European Portuguese
  let voice = voices.find(v => v.lang === 'pt-PT');
  if (voice) return voice;

  // Fallback to Brazilian Portuguese
  voice = voices.find(v => v.lang === 'pt-BR');
  if (voice) return voice;

  // Fallback to any Portuguese
  voice = voices.find(v => v.lang.startsWith('pt'));
  if (voice) return voice;

  return null;
};

// Speak text with Portuguese voice
export const speak = (text: string, options?: {
  rate?: number;
  pitch?: number;
  volume?: number;
  onEnd?: () => void;
  onError?: (error: SpeechSynthesisErrorEvent) => void;
}): void => {
  if (!speechSynthesis) {
    if (!initSpeechSynthesis()) {
      console.warn('Speech synthesis not supported');
      return;
    }
  }

  // Stop any ongoing speech
  stop();

  currentUtterance = new SpeechSynthesisUtterance(text);

  const voice = getPortugueseVoice();
  if (voice) {
    currentUtterance.voice = voice;
  }

  currentUtterance.lang = 'pt-PT';
  currentUtterance.rate = options?.rate || 0.9; // Slightly slower for clarity
  currentUtterance.pitch = options?.pitch || 1.0;
  currentUtterance.volume = options?.volume || 1.0;

  if (options?.onEnd) {
    currentUtterance.onend = options.onEnd;
  }

  if (options?.onError) {
    currentUtterance.onerror = options.onError;
  }

  speechSynthesis!.speak(currentUtterance);
};

// Stop current speech
export const stop = (): void => {
  if (speechSynthesis) {
    speechSynthesis.cancel();
  }
  currentUtterance = null;
};

// Pause current speech
export const pause = (): void => {
  if (speechSynthesis && speechSynthesis.speaking) {
    speechSynthesis.pause();
  }
};

// Resume paused speech
export const resume = (): void => {
  if (speechSynthesis && speechSynthesis.paused) {
    speechSynthesis.resume();
  }
};

// Check if speaking
export const isSpeaking = (): boolean => {
  return speechSynthesis?.speaking || false;
};

// Check if paused
export const isPaused = (): boolean => {
  return speechSynthesis?.paused || false;
};

// Speak quiz question with options
export const speakQuizQuestion = (
  questionText: string,
  options: string[],
  speakOptions: boolean = true
): void => {
  let fullText = questionText;

  if (speakOptions) {
    fullText += '. Opções: ';
    options.forEach((option, index) => {
      fullText += `${String.fromCharCode(65 + index)}, ${option}. `;
    });
  }

  speak(fullText);
};

// Initialize on load
if (typeof window !== 'undefined') {
  // Load voices
  window.speechSynthesis?.getVoices();

  // Some browsers need this event to load voices
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis?.getVoices();
    };
  }
}
