/**
 * Sound Notification Service
 * Handles playing sounds for different notification types
 */

class SoundNotificationService {
  constructor() {
    this.sounds = {};
    this.isEnabled = this.getSoundPreference();
    this.initializeSounds();
  }

  /**
   * Initialize sound files
   */
  initializeSounds() {
    // Using Web Audio API to create simple notification sounds
    // This creates different tones for different notification types
    
    this.sounds = {
      // Default notification sound - gentle chime
      default: this.createTone(800, 0.3, 'sine'),
      
      // Job status change - ascending tone
      job_status: this.createTone(600, 0.4, 'sine'),
      
      // Assignment notification - double beep
      assignment: this.createDoubleTone(700, 0.3),
      
      // Invoice notification - higher pitch
      invoice: this.createTone(1000, 0.3, 'sine'),
      
      // System notification - lower pitch
      system: this.createTone(400, 0.5, 'sine'),
      
      // Success sound - pleasant ascending chord
      success: this.createChord([523, 659, 784], 0.5),
      
      // Error sound - descending tone
      error: this.createTone(300, 0.4, 'sawtooth')
    };
  }

  /**
   * Create a simple tone using Web Audio API
   */
  createTone(frequency, duration, waveType = 'sine') {
    return () => {
      if (!this.isEnabled) return;
      
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = waveType;
        
        // Set volume envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
      } catch (error) {
        console.warn('Could not play notification sound:', error);
      }
    };
  }

  /**
   * Create a double beep sound
   */
  createDoubleTone(frequency, duration) {
    return () => {
      if (!this.isEnabled) return;
      
      this.createTone(frequency, duration)();
      setTimeout(() => {
        this.createTone(frequency, duration)();
      }, 200);
    };
  }

  /**
   * Create a chord sound
   */
  createChord(frequencies, duration) {
    return () => {
      if (!this.isEnabled) return;
      
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        
        frequencies.forEach((freq, index) => {
          const oscillator = audioContext.createOscillator();
          oscillator.connect(gainNode);
          oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
          oscillator.type = 'sine';
          
          oscillator.start(audioContext.currentTime + (index * 0.1));
          oscillator.stop(audioContext.currentTime + duration);
        });
        
        // Set volume envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      } catch (error) {
        console.warn('Could not play chord sound:', error);
      }
    };
  }

  /**
   * Play notification sound based on type
   */
  playNotificationSound(type = 'default') {
    const soundFunction = this.sounds[type] || this.sounds.default;
    soundFunction();
  }

  /**
   * Enable/disable sound notifications
   */
  setSoundEnabled(enabled) {
    this.isEnabled = enabled;
    localStorage.setItem('notification_sound_enabled', enabled.toString());
  }

  /**
   * Get sound preference from localStorage
   */
  getSoundPreference() {
    const stored = localStorage.getItem('notification_sound_enabled');
    return stored !== null ? stored === 'true' : true; // Default to enabled
  }

  /**
   * Check if sound is enabled
   */
  isSoundEnabled() {
    return this.isEnabled;
  }

  /**
   * Play a custom sound with specific parameters
   */
  playCustomSound(frequency, duration, waveType = 'sine') {
    if (!this.isEnabled) return;
    
    const customSound = this.createTone(frequency, duration, waveType);
    customSound();
  }

  /**
   * Test all notification sounds
   */
  testAllSounds() {
    console.log('🔊 Testing all notification sounds...');
    
    Object.keys(this.sounds).forEach((type, index) => {
      setTimeout(() => {
        console.log(`🔊 Playing ${type} sound`);
        this.playNotificationSound(type);
      }, index * 1000);
    });
  }
}

// Create singleton instance
const soundNotificationService = new SoundNotificationService();

export default soundNotificationService;
