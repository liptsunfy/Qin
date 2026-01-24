Page({
  data: {
    strings: [],
    tuningPresets: [],
    tuningPresetNames: [],
    currentPresetIndex: 0,
    a4: 440,
    currentStringIndex: 0,
    tuningValue: 0,
    cents: 0,
    currentFrequency: 0,
    volume: 0,
    strings: [
      { id: 1, name: '一弦', note: 'D', tuned: false, frequency: 293.664 },
      { id: 2, name: '二弦', note: 'A', tuned: false, frequency: 440.000 },
      { id: 3, name: '三弦', note: 'E', tuned: false, frequency: 329.628 },
      { id: 4, name: '四弦', note: 'B', tuned: false, frequency: 246.942 },
      { id: 5, name: '五弦', note: 'F', tuned: false, frequency: 349.228 },
      { id: 6, name: '六弦', note: 'C', tuned: false, frequency: 261.626 },
      { id: 7, name: '七弦', note: 'G', tuned: false, frequency: 392.000 }
    ],
    currentStringIndex: 0,
    tuningValue: 0,
    autoTune: false,
    isListening: false,
    statusText: '未开始监听',
    statusLevel: 'idle'
  },

  onLoad() {
    this.setupPresets();
    this.setupRecorder();
    this.applyPreset(0);
    this.updateTuningFeedback();
  },

  onUnload() {
    this.stopListening();
  },

  setupPresets() {
    const tuningPresets = [
      {
        name: '正调',
        description: '常用五六一二三五六',
        notes: ['D4', 'A4', 'E4', 'B3', 'F4', 'C4', 'G4']
      },
      {
        name: '紧五弦',
        description: '五弦升高',
        notes: ['D4', 'A4', 'E4', 'B3', 'G4', 'C4', 'G4']
      },
      {
        name: '慢三弦',
        description: '三弦降低',
        notes: ['D4', 'A4', 'D4', 'B3', 'F4', 'C4', 'G4']
      },
      {
        name: '紧五慢三',
        description: '五弦升高，三弦降低',
        notes: ['D4', 'A4', 'D4', 'B3', 'G4', 'C4', 'G4']
      }
    ];
    this.setData({
      tuningPresets,
      tuningPresetNames: tuningPresets.map(item => item.name)
    });
  },

  setupRecorder() {
    this.recorderManager = wx.getRecorderManager();
    this.recorderManager.onFrameRecorded(this.onFrameRecorded.bind(this));
    this.recorderManager.onStop(() => {
      this.setData({
        isListening: false
      });
    });
  },

  applyPreset(index) {
    const preset = this.data.tuningPresets[index];
    if (!preset) return;
    const stringNames = ['一弦', '二弦', '三弦', '四弦', '五弦', '六弦', '七弦'];
    const strings = preset.notes.map((note, i) => {
      const frequency = this.noteToFrequency(note, this.data.a4);
      const [noteName, octave] = this.parseNote(note);
      return {
        id: i + 1,
        name: stringNames[i] || `${i + 1}弦`,
        note: noteName,
        octave,
        tuned: false,
        frequency
      };
    });
    this.setData({
      strings,
      currentPresetIndex: index,
      currentStringIndex: 0
    });
  },

  parseNote(note) {
    const match = /^([A-G]#?)(\d)$/.exec(note);
    if (!match) return [note, ''];
    return [match[1], match[2]];
  },

  noteToFrequency(note, a4) {
    const noteMap = {
      C: -9,
      'C#': -8,
      D: -7,
      'D#': -6,
      E: -5,
      F: -4,
      'F#': -3,
      G: -2,
      'G#': -1,
      A: 0,
      'A#': 1,
      B: 2
    };
    const [name, octave] = this.parseNote(note);
    const semitone = noteMap[name];
    if (semitone === undefined) return a4;
    const octaveNumber = Number(octave);
    const n = semitone + (octaveNumber - 4) * 12;
    return Number((a4 * Math.pow(2, n / 12)).toFixed(2));
  },

  onStringTap(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      currentStringIndex: index
    });
    this.updateTuningFeedback(true);
  },

  updateTuningFeedback(reset = false) {
    if (!reset && this.data.isListening) return;
  updateTuningFeedback() {
    const deviation = Number((Math.random() * 100 - 50).toFixed(1));
    const clamped = Math.max(-50, Math.min(50, deviation));
    const { statusText, statusLevel } = this.getStatusFromDeviation(clamped);

    this.setData({
      tuningValue: clamped,
      cents: clamped,
      currentFrequency: 0,
      statusText,
      statusLevel
    });
  },

  getStatusFromDeviation(value) {
    const abs = Math.abs(value);
    if (abs <= 5) {
      return { statusText: '音准稳定', statusLevel: 'ok' };
    }
    if (value < 0) {
      return { statusText: '偏低，建议拧紧', statusLevel: 'low' };
    }
    return { statusText: '偏高，建议放松', statusLevel: 'high' };
  },

  onAutoTuneToggle(e) {
  onAutoTuneToggle() {
    this.setData({
      autoTune: e.detail.value
    });
  },

  onToggleListen() {
    const nextState = !this.data.isListening;
    this.setData({ isListening: nextState });
    if (nextState) {
      this.startListening();
      return;
    }
    this.stopListening();
  },

  startListening() {
    this.stopListening();
    this.ensureRecordPermission()
      .then(() => {
        this.setData({
          statusText: '正在监听音高…',
          statusLevel: 'listening'
        });
        this.recorderManager.start({
          format: 'PCM',
          sampleRate: 44100,
          numberOfChannels: 1,
          encodeBitRate: 96000,
          frameSize: 8
        });
      })
      .catch(() => {
        this.setData({
          isListening: false,
          statusText: '未获得麦克风权限',
          statusLevel: 'idle'
        });
      });
    this.setData({
      statusText: '正在监听音高…',
      statusLevel: 'listening'
    });
    this.listenTimer = setInterval(() => {
      this.updateTuningFeedback();
      if (this.data.autoTune) {
        this.maybeAutoAdvance();
      }
    }, 800);
  },

  stopListening() {
    if (this.listenTimer) {
      clearInterval(this.listenTimer);
      this.listenTimer = null;
    }
    if (this.recorderManager) {
      try {
        this.recorderManager.stop();
      } catch (e) {
        // ignore
      }
    }
    this.setData({
      statusText: '已停止监听',
      statusLevel: 'idle'
    });
  },

  maybeAutoAdvance() {
    if (Math.abs(this.data.tuningValue) > 5) return;
    const nextStrings = this.data.strings.map((item, index) => {
      if (index === this.data.currentStringIndex) {
        return { ...item, tuned: true };
      }
      return item;
    });
    const nextIndex = nextStrings.findIndex(item => !item.tuned);
    this.setData({
      strings: nextStrings,
      currentStringIndex: nextIndex === -1 ? this.data.currentStringIndex : nextIndex
    });
  },

  onMarkTuned() {
    const nextStrings = this.data.strings.map((item, index) => {
      if (index === this.data.currentStringIndex) {
        return { ...item, tuned: true };
      }
      return item;
    });
    this.setData({ strings: nextStrings });
  },

  onResetTuned() {
    const resetStrings = this.data.strings.map(item => ({ ...item, tuned: false }));
    this.setData({
      strings: resetStrings,
      currentStringIndex: 0
    });
  },

  onPresetChange(e) {
    const index = Number(e.detail.value);
    this.applyPreset(index);
    this.updateTuningFeedback(true);
  },

  onA4Change(e) {
    const value = Number(e.detail.value);
    this.setData({ a4: value });
    this.applyPreset(this.data.currentPresetIndex);
    this.updateTuningFeedback(true);
  },

  ensureRecordPermission() {
    return new Promise((resolve, reject) => {
      wx.authorize({
        scope: 'scope.record',
        success: resolve,
        fail: () => {
          wx.showModal({
            title: '需要麦克风权限',
            content: '请在设置中开启麦克风权限以启用调音功能。',
            confirmText: '去设置',
            success: modalRes => {
              if (modalRes.confirm) {
                wx.openSetting({});
              }
            }
          });
          reject(new Error('permission denied'));
        }
      });
    });
  },

  onFrameRecorded(res) {
    if (!res || !res.frameBuffer) return;
    const buffer = this.convertToFloat32(res.frameBuffer);
    const { frequency, volume } = this.detectPitch(buffer, 44100);
    const target = this.data.strings[this.data.currentStringIndex];
    if (!target) return;

    let statusText = '信号偏弱';
    let statusLevel = 'listening';
    let cents = 0;
    let tuningValue = 0;
    let currentFrequency = 0;

    if (frequency > 0) {
      currentFrequency = Number(frequency.toFixed(1));
      cents = this.getCentsDifference(frequency, target.frequency);
      tuningValue = Math.max(-50, Math.min(50, cents));
      const status = this.getStatusFromDeviation(cents);
      statusText = status.statusText;
      statusLevel = status.statusLevel;
    }

    this.setData({
      currentFrequency,
      cents: Number(cents.toFixed(1)),
      tuningValue,
      volume: Number(volume.toFixed(2)),
      statusText,
      statusLevel
    });

    if (this.data.autoTune) {
      this.maybeAutoAdvance();
    }
  },

  convertToFloat32(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    const length = view.byteLength / 2;
    const buffer = new Float32Array(length);
    for (let i = 0; i < length; i += 1) {
      buffer[i] = view.getInt16(i * 2, true) / 32768;
    }
    return buffer;
  },

  detectPitch(buffer, sampleRate) {
    let rms = 0;
    for (let i = 0; i < buffer.length; i += 1) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / buffer.length);
    if (rms < 0.01) {
      return { frequency: -1, volume: rms };
    }

    const size = buffer.length;
    const correlations = new Float32Array(size);
    for (let offset = 0; offset < size; offset += 1) {
      let sum = 0;
      for (let i = 0; i < size - offset; i += 1) {
        sum += buffer[i] * buffer[i + offset];
      }
      correlations[offset] = sum;
    }

    let d = 0;
    while (d < size - 1 && correlations[d] > correlations[d + 1]) {
      d += 1;
    }

    let maxValue = -1;
    let maxIndex = -1;
    for (let i = d; i < size; i += 1) {
      if (correlations[i] > maxValue) {
        maxValue = correlations[i];
        maxIndex = i;
      }
    }

    if (maxIndex <= 0) {
      return { frequency: -1, volume: rms };
    }

    const frequency = sampleRate / maxIndex;
    return { frequency, volume: rms };
  },

  getCentsDifference(freq, target) {
    return 1200 * Math.log2(freq / target);
  }
});
