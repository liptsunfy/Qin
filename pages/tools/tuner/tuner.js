/*
 * Copyright (c) 2026 BA4SGP, SFY
 */
Page({
  data: {
    tuningPresets: [],
    tuningPresetNames: [],
    currentPresetIndex: 0,
    a4: 440,
    strings: [
      { id: 1, name: '一弦', note: 'D', octave: '4', tuned: false, frequency: 293.66 },
      { id: 2, name: '二弦', note: 'A', octave: '4', tuned: false, frequency: 440.0 },
      { id: 3, name: '三弦', note: 'E', octave: '4', tuned: false, frequency: 329.63 },
      { id: 4, name: '四弦', note: 'B', octave: '3', tuned: false, frequency: 246.94 },
      { id: 5, name: '五弦', note: 'F', octave: '4', tuned: false, frequency: 349.23 },
      { id: 6, name: '六弦', note: 'C', octave: '4', tuned: false, frequency: 261.63 },
      { id: 7, name: '七弦', note: 'G', octave: '4', tuned: false, frequency: 392.0 }
    ],
    currentStringIndex: 0,
    tuningValue: 0,
    cents: 0,
    currentFrequency: 0,
    volume: 0,
    autoTune: false,
    isListening: false,
    statusText: '未开始监听',
    statusLevel: 'idle'
  },

  onLoad() {
    this.setupPresets();
    this.setupRecorder();
    this.applyPreset(0);
    this.updateTuningFeedback(true);
    this.lastFrameAt = 0;
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
      if (this.data.isListening) {
        this.setData({
          isListening: false,
          statusText: '录音已停止',
          statusLevel: 'idle'
        });
      }
    });
    this.recorderManager.onError(() => {
      this.stopListening();
      this.setData({
        statusText: '录音失败，请重试',
        statusLevel: 'idle'
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
    const octaveNumber = Number(octave || 4);
    const n = semitone + (octaveNumber - 4) * 12;
    return Number((a4 * Math.pow(2, n / 12)).toFixed(2));
  },

  onStringTap(e) {
    const index = Number(e.currentTarget.dataset.index);
    this.setData({
      currentStringIndex: index
    });
    this.updateTuningFeedback(true);
  },

  updateTuningFeedback(reset = false) {
    if (!reset && this.data.isListening) return;
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
    this.stopListening(false);
    this.ensureRecordPermission()
      .then(() => {
        this.setData({
          isListening: true,
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
        this.listenTimer = setInterval(() => {
          const now = Date.now();
          if (!this.lastFrameAt || now - this.lastFrameAt > 1200) {
            this.updateTuningFeedback(true);
          }
          if (this.data.autoTune) {
            this.maybeAutoAdvance();
          }
        }, 800);
      })
      .catch(() => {
        this.setData({
          isListening: false,
          statusText: '未获得麦克风权限',
          statusLevel: 'idle'
        });
      });
  },

  stopListening(updateStatus = true) {
    if (this.listenTimer) {
      clearInterval(this.listenTimer);
      this.listenTimer = null;
    }
    if (this.recorderManager) {
      try {
        this.recorderManager.stop();
      } catch (err) {
        // recorder may already be stopped
      }
    }
    if (updateStatus) {
      this.setData({
        isListening: false,
        statusText: '已停止监听',
        statusLevel: 'idle'
      });
    }
    this.lastFrameAt = 0;
  },

  maybeAutoAdvance() {
    if (Math.abs(this.data.tuningValue) > 5) return;
    const nextStrings = this.data.strings.map((item, index) => {
      if (index === this.data.currentStringIndex) {
        return { ...item, tuned: true };
      }
      return item;
    });
    const nextIndex = Math.min(this.data.currentStringIndex + 1, nextStrings.length - 1);
    this.setData({
      strings: nextStrings,
      currentStringIndex: nextIndex
    });
  },

  onPresetChange(e) {
    const index = Number(e.detail.value);
    this.stopListening();
    this.applyPreset(index);
    this.updateTuningFeedback(true);
  },

  onA4Change(e) {
    const value = Number(e.detail.value);
    this.setData({ a4: value });
    this.applyPreset(this.data.currentPresetIndex);
    this.updateTuningFeedback(true);
  },

  onMarkTuned() {
    const nextStrings = this.data.strings.map((item, index) => {
      if (index === this.data.currentStringIndex) {
        return { ...item, tuned: true };
      }
      return item;
    });
    this.setData({ strings: nextStrings });
    if (this.data.autoTune) {
      this.maybeAutoAdvance();
    }
  },

  onResetTuned() {
    const resetStrings = this.data.strings.map(item => ({ ...item, tuned: false }));
    this.setData({
      strings: resetStrings,
      currentStringIndex: 0
    });
    this.updateTuningFeedback(true);
  },

  ensureRecordPermission() {
    return new Promise((resolve, reject) => {
      wx.getSetting({
        success: res => {
          const hasPermission = res.authSetting['scope.record'];
          if (hasPermission) {
            resolve();
            return;
          }
          wx.authorize({
            scope: 'scope.record',
            success: resolve,
            fail: reject
          });
        },
        fail: reject
      });
    });
  },

  onFrameRecorded(res) {
    const { frameBuffer } = res;
    const deviation = this.mockDetectPitch(frameBuffer);
    const { statusText, statusLevel } = this.getStatusFromDeviation(deviation);
    const stringItem = this.data.strings[this.data.currentStringIndex];
    const targetFrequency = stringItem ? stringItem.frequency : this.data.a4;
    const currentFrequency = Number((targetFrequency * Math.pow(2, deviation / 1200)).toFixed(2));
    this.lastFrameAt = Date.now();

    this.setData({
      tuningValue: deviation,
      cents: deviation,
      currentFrequency,
      statusText,
      statusLevel
    });

    if (this.data.autoTune) {
      this.maybeAutoAdvance();
    }
  },

  mockDetectPitch(buffer) {
    if (!buffer) return 0;
    const deviation = Math.random() * 12 - 6;
    return Number(deviation.toFixed(1));
  }
});
