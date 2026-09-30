/**
 * Studio Human Audio Pronunciation (Dictionary Gold Standard) +
 * High-Fidelity Speech Recognition & Natural Speech Synthesis
 */

let activeAudio: HTMLAudioElement | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

// Initialize voices listener as early as possible
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const updateVoices = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
  updateVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
}

export function createSpeechRecognizer(
  onResult: (transcript: string, isFinal: boolean) => void,
  onError?: (error: string) => void,
  onEnd?: () => void
) {
  if (!isSpeechRecognitionSupported()) {
    return null;
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event: any) => {
    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }

    const currentText = final || interim;
    if (currentText) {
      onResult(currentText.trim(), !!final);
    }
  };

  recognition.onerror = (event: any) => {
    console.warn('Speech recognition error:', event.error);
    if (onError) onError(event.error);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
}

/**
 * Stop any ongoing audio playback (both HTML5 Audio and SpeechSynthesis)
 */
export function stopAllAudio() {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch (e) {
      // ignore
    }
    activeAudio = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export const stopTextToSpeech = stopAllAudio;

/**
 * Play authentic native studio recorded pronunciation for words/short phrases.
 * Uses high-fidelity native speaker studio dictionary MP3s (American US or British UK).
 * Falls back gracefully to natural browser speech synthesis if offline or error.
 */
export function playNativeAudio(
  text: string,
  accent: 'us' | 'uk' = 'us',
  onEnd?: () => void
): () => void {
  stopAllAudio();

  const clean = text.trim().replace(/[.,!?;:"'(){}\[\]]/g, '');
  const wordCount = clean.split(/\s+/).filter(Boolean).length;

  // Words and short terms: use authentic studio human dictionary recording
  if (wordCount <= 4 && clean.length > 0) {
    const type = accent === 'uk' ? 1 : 2;
    const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(clean)}&type=${type}`;
    const audio = new Audio(audioUrl);
    activeAudio = audio;

    audio.onended = () => {
      if (activeAudio === audio) activeAudio = null;
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      console.warn('Studio audio stream unavailable, switching to speech synthesis');
      playTextToSpeech(text, 1.0, onEnd);
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('HTML5 Audio playback prevented, fallback to synthesis', err);
        playTextToSpeech(text, 1.0, onEnd);
      });
    }

    return () => {
      audio.pause();
      audio.currentTime = 0;
      if (activeAudio === audio) activeAudio = null;
    };
  }

  // Sentences and longer passages: use natural speech synthesis
  return playTextToSpeech(text, 1.0, onEnd);
}

// Backward-compatible alias
export const playTextToSpeech = (
  text: string,
  rate: number = 1.0,
  onEnd?: () => void
): (() => void) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return () => {};
  }

  // If it's a single word or short phrase, directly use studio human audio for crystal clear quality!
  const clean = text.trim();
  const wordCount = clean.split(/\s+/).filter(Boolean).length;
  if (wordCount <= 3 && !clean.includes('.') && !clean.includes('!')) {
    return playNativeAudio(clean, 'us', onEnd);
  }

  stopAllAudio();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = rate;

  // Ensure voices are retrieved
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();

  // Find genuine high-quality native English voice, avoid robotic or Chinese engines trying to read English
  const englishVoices = voices.filter(
    (v) =>
      v.lang.startsWith('en') &&
      !v.name.toLowerCase().includes('chinese') &&
      !v.name.toLowerCase().includes('mandarin')
  );

  const preferredVoice =
    englishVoices.find(
      (v) =>
        v.name.includes('Natural') ||
        v.name.includes('Online') ||
        v.name.includes('Google US English') ||
        v.name.includes('Samantha') ||
        v.name.includes('Daniel') ||
        v.name.includes('Karen') ||
        v.name.includes('Ava')
    ) ||
    englishVoices.find((v) => v.lang === 'en-US') ||
    englishVoices[0];

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  if (onEnd) {
    utterance.onend = () => {
      onEnd();
    };
  }

  utterance.onerror = (e) => {
    console.warn('Speech synthesis utterance error:', e);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);

  return () => {
    window.speechSynthesis.cancel();
  };
};
