/**
 * Web Audio API synthesizer for creating gentle, health-themed notification chimes.
 * Plays a soft, harmonious melody (C5 followed by E5 and G5) representing freshness and energy.
 */
export const playChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    const now = audioCtx.currentTime;

    const playTone = (freq: number, start: number, duration: number, type: "sine" | "triangle" = "sine") => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = type;
      osc.frequency.value = freq;

      // Soft volume ramp-up and exponential decay to prevent clicking
      gainNode.gain.setValueAtTime(0, start);
      gainNode.gain.linearRampToValueAtTime(0.15, start + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    // Beautiful major-chord arpeggio chime (C5 -> E5 -> G5)
    playTone(523.25, now, 0.4, "sine");       // C5
    playTone(659.25, now + 0.15, 0.45, "sine");  // E5
    playTone(783.99, now + 0.3, 0.6, "sine");   // G5
  } catch (err) {
    console.error("Failed to play synthesized alert chime:", err);
  }
};

/**
 * Speech Synthesis utility to speak notifications out loud in Thai using the natural OS Thai voice.
 */
export const speakText = (text: string) => {
  try {
    if (!("speechSynthesis" in window)) return;

    // Cancel any active speech to avoid queuing delays
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "th-TH";
    utterance.rate = 1.0; // Standard speed
    utterance.pitch = 1.1; // Slightly sweet/friendly pitch

    // Find Thai voice if available (sometimes works on Chrome/Safari)
    const voices = window.speechSynthesis.getVoices();
    const thaiVoice = voices.find((voice) => voice.lang.includes("TH") || voice.lang.includes("th"));
    if (thaiVoice) {
      utterance.voice = thaiVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error("Speech synthesis failed:", err);
  }
};
