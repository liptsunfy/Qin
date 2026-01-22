
Page({
  data: {
    strings: [
      { id: 1, name: '一弦', note: 'D', tuned: false, frequency: 293.664 },
      { id: 2, name: '二弦', note: 'A', tuned: false, frequency: 440.000 },
      { id: 3, name: '三弦', note: 'E', tuned: false, frequency: 329.628 },
      { id: 4, name: '四弦', note: 'B', tuned: false, frequency: 246.942 },
      { id: 5, name: '五弦', note: 'F', tuned: false, frequency: 349.228 },
      { id: 6, name: '六弦', note: 'C', tuned: false, frequency: 261.626 },
      { id: 7, name: '七弦', note: 'G', tuned: false, frequency: 392.000 }
    ],
    currentStringIndex: 0, // Track the current selected string
    tuningValue: 0, // Frequency deviation
    autoTune: false // Toggle auto-tune mode
  },

  onLoad() {
    this.updateTuningFeedback();
  },

  // Switch between strings
  onStringTap(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      currentStringIndex: index
    });
    this.updateTuningFeedback();
  },

  // Update tuning feedback based on the current string's frequency
  updateTuningFeedback() {
    const currentString = this.data.strings[this.data.currentStringIndex];
    // Simulate tuning feedback, you would integrate with microphone input for real data
    this.setData({
      tuningValue: (Math.random() * 100 - 50).toFixed(1) // Simulating deviation from target frequency
    });
  },

  // Toggle auto-tune mode
  onAutoTuneToggle() {
    this.setData({
      autoTune: !this.data.autoTune
    });
  }
});
