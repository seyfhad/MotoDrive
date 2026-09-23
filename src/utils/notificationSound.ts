// Web Audio API Sound Synthesizer for MotoDrive Notifications

class NotificationSound {
  private audioCtx: AudioContext | null = null;

  private initCtx() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Play pleasant double-chime for new ride request or arrival
  playChime(type: 'new_ride' | 'driver_arriving' | 'admin_update' | 'general' = 'general') {
    try {
      this.initCtx();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      if (type === 'new_ride') {
        // High attention double chime (880Hz -> 1046.5Hz)
        osc1.frequency.setValueAtTime(880, now); // A5
        osc1.frequency.setValueAtTime(1046.5, now + 0.15); // C6
        osc2.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(523.25, now + 0.15);
      } else if (type === 'driver_arriving') {
        // Gentle arrival tone (523.25Hz -> 659.25Hz -> 783.99Hz)
        osc1.frequency.setValueAtTime(523.25, now);
        osc1.frequency.setValueAtTime(659.25, now + 0.12);
        osc1.frequency.setValueAtTime(783.99, now + 0.24);
        osc2.frequency.setValueAtTime(261.63, now);
      } else if (type === 'admin_update') {
        // Official notification alert tone
        osc1.frequency.setValueAtTime(659.25, now);
        osc1.frequency.setValueAtTime(880, now + 0.18);
        osc2.frequency.setValueAtTime(329.63, now);
      } else {
        // Standard notification chime
        osc1.frequency.setValueAtTime(587.33, now);
        osc1.frequency.setValueAtTime(880, now + 0.15);
        osc2.frequency.setValueAtTime(293.66, now);
      }

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.8);
      osc2.stop(now + 0.8);
    } catch (e) {
      console.warn('Audio play notice:', e);
    }
  }

  // Vibrate if supported on device (e.g. mobile Android/APK)
  vibrate(pattern: number[] = [200, 100, 200]) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignore vibration errors
      }
    }
  }
}

export const notificationSound = new NotificationSound();
