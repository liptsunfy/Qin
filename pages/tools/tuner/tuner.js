/*
 * Copyright (c) 2026 BA4SGP, SFY
 */
Page({
  data: {
    tuningPresets: [],
    tuningPresetNames: [],
    currentPresetIndex: 0,
    referenceStandards: [],
    referenceStandardNames: [],
    referenceStandardIndex: 0,
    a4: 440,
    sensitivity: 60,
    strings: [
      { id: 1, name: '一弦', note: 'D', octave: '4', tuned: false, frequency: 293.66 },
      { id: 2, name: '二弦', note: 'A', octave: '4', tuned: false, frequency: 440.0 },
      { id: 3, name: '三弦', note: 'E', octave: '4', tuned: false, frequency: 329.63 },
      { id: 4, name: '四弦', note: 'B', octave: '3', tuned: false, frequency: 246.94 },
      { id: 5, name: '五弦', note: 'F', octave: '4', tuned: false, frequency: 349.23 },
      { id: 6, name: '六弦', note: 'C', octave: '4', tuned: false, frequency: 261.63 },
      { id: 7, name: '七弦', note: 'G', octave: '4', tuned: false, frequency: 392.0 }
    ],
    currentString: null,
    currentStringIndex: 0,
    tuningValue: 0,
    cents: 0,
    currentFrequency: 0,
    volume: 0,
    autoTune: false,
    isListening: false,
    statusText: '未开始监听',
    statusLevel: 'idle',
    stabilityText: '等待输入'
  },

  onLoad() {
    this.setupPresets();
    this.setupReferenceStandards();
    this.setupRecorder();
    this.applyPreset(0);
    this.updateTuningFeedback(true);
    this.lastFrameAt = 0;
  },

  onUnload() {
    this.stopListening();
  },

  onHide() {
    this.stopListening();
  },

  setupReferenceStandards() {
    const referenceStandards = [
      { name: '现代标准', a4: 440, desc: '国际 A4=440Hz' },
      { name: '国乐合奏', a4: 442, desc: '合奏常用 A4=442Hz' },
      { name: '丝弦质感', a4: 435, desc: '偏柔和 A4=435Hz' },
      { name: '低音共鸣', a4: 432, desc: '舒缓 A4=432Hz' }
    ];
    this.setData({
      referenceStandards,
      referenceStandardNames: referenceStandards.map(item => item.name),
      referenceStandardIndex: 0,
      a4: referenceStandards[0].a4
    });
  },

  setupPresets() {
    const tuningPresets = [
      {
        name: '正调',
        description: '常用五六一二三五六',
        notes: ['D4', 'A4', 'E4', 'B3', 'F4', 'C4', 'G4']
      },
      {
        name: '清角调',
        description: '清亮明快，二弦上扬',
        notes: ['D4', 'B4', 'E4', 'B3', 'F4', 'C4', 'G4']
      },
      {
        name: '黄钟调',
        description: '厚重稳健，四弦偏稳',
        notes: ['C4', 'G4', 'D4', 'A3', 'E4', 'B3', 'F4']
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
        statusText: '录音失败，请稍后重试',
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
    const currentStringIndex = 0;
    this.setData({
      strings,
      currentPresetIndex: index,
      currentStringIndex,
      currentString: strings[currentStringIndex] || null
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
    this.selectString(index);
    this.updateTuningFeedback(true);
  },

  selectString(index) {
    const strings = this.data.strings || [];
    if (!strings.length) {
      this.setData({
        currentStringIndex: 0,
        currentString: null
      });
      return;
    }
    const clampedIndex = Math.max(0, Math.min(index, strings.length - 1));
    this.setData({
      currentStringIndex: clampedIndex,
      currentString: strings[clampedIndex]
    });
  },

  updateTuningFeedback(reset = false) {
    if (!reset && this.data.isListening) return;
    const deviation = 0;
    const clamped = Math.max(-50, Math.min(50, deviation));
    const { statusText, statusLevel } = this.getStatusFromDeviation(clamped);

    this.setData({
      tuningValue: clamped,
      cents: clamped,
      currentFrequency: 0,
      volume: 0,
      statusText,
      statusLevel,
      stabilityText: '等待输入'
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

  onReferenceChange(e) {
    const index = Number(e.detail.value);
    const standard = this.data.referenceStandards[index];
    if (!standard) return;
    this.setData({
      referenceStandardIndex: index,
      a4: standard.a4
    });
    this.applyPreset(this.data.currentPresetIndex);
    this.updateTuningFeedback(true);
  },

  onSensitivityChange(e) {
    const value = Number(e.detail.value);
    this.setData({
      sensitivity: value
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
          statusLevel: 'listening',
          stabilityText: '正在捕捉'
        });
        this.lastFrameAt = 0;
        this.frequencyHistory = [];
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
            this.setData({
              tuningValue: 0,
              cents: 0,
              currentFrequency: 0,
              volume: 0,
              statusText: '未检测到稳定音高',
              statusLevel: 'idle',
              stabilityText: '无信号'
              statusLevel: 'idle'
            });
            return;
          }
          if (this.data.autoTune) {
            this.maybeAutoAdvance();
          }
        }, 600);
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
        statusLevel: 'idle',
        stabilityText: '已停止'
      });
    }
    this.lastFrameAt = 0;
    this.frequencyHistory = [];
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
      currentStringIndex: nextIndex,
      currentString: nextStrings[nextIndex] || null
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
      currentStringIndex: 0,
      currentString: resetStrings[0] || null
    });
    this.updateTuningFeedback(true);
  },

  ensureRecordPermission() {
    return new Promise((resolve, reject) => {
      wx.getSetting({
        success: res => {
          const permission = res.authSetting['scope.record'];
          if (permission) {
            resolve();
            return;
          }
          if (permission === false) {
            wx.showModal({
              title: '需要录音权限',
              content: '调音器需要麦克风权限，请前往设置开启。',
              confirmText: '去设置',
              success: modalRes => {
                if (modalRes.confirm) {
                  wx.openSetting();
                }
              }
            });
            reject();
            return;
          }
          wx.authorize({
            scope: 'scope.record',
            success: resolve,
            fail: () => {
              wx.showModal({
                title: '需要录音权限',
                content: '调音器需要麦克风权限，请前往设置开启。',
                confirmText: '去设置',
                success: modalRes => {
                  if (modalRes.confirm) {
                    wx.openSetting();
                  }
                }
              });
              reject();
            }
          });
        },
        fail: reject
      });
    });
  },

  onFrameRecorded(res) {
    if (!this.data.isListening) return;
    const { frameBuffer } = res;
    const detection = this.detectPitch(frameBuffer);
    if (!detection) {
      this.setData({
        tuningValue: 0,
        cents: 0,
        currentFrequency: 0,
        volume: 0,
        statusText: '未检测到稳定音高',
        statusLevel: 'idle',
        stabilityText: '等待输入'
      });
      return;
    }
    const { frequency, volume } = detection;
    const smoothedFrequency = this.smoothFrequency(frequency);
    const stringItem = this.data.currentString || this.data.strings[this.data.currentStringIndex];
    const targetFrequency = stringItem ? stringItem.frequency : this.data.a4;
    const correctedFrequency = this.normalizeFrequency(frequency, targetFrequency);
    const smoothedFrequency = this.smoothFrequency(correctedFrequency);
    const deviation = this.frequencyToCents(smoothedFrequency, targetFrequency);
    const { statusText, statusLevel } = this.getStatusFromDeviation(deviation);
    const currentFrequency = Number(smoothedFrequency.toFixed(2));
    const stabilityText = this.getStabilityText();
    const deviation = this.frequencyToCents(smoothedFrequency, targetFrequency);
    const { statusText, statusLevel } = this.getStatusFromDeviation(deviation);
    const currentFrequency = Number(smoothedFrequency.toFixed(2));
    this.lastFrameAt = Date.now();

    this.setData({
      tuningValue: deviation,
      cents: deviation,
      currentFrequency,
      volume,
      statusText,
      statusLevel,
      stabilityText
    });

    if (this.data.autoTune) {
      this.maybeAutoAdvance();
    }
  },

  detectPitch(buffer) {
    if (!buffer) return null;
    const data = new Int16Array(buffer);
    if (!data.length) return null;
    const sampleRate = 44100;
    const floatBuffer = new Float32Array(data.length);
    let rms = 0;
    for (let i = 0; i < data.length; i += 1) {
      const value = data[i] / 32768;
      floatBuffer[i] = value;
      rms += value * value;
    }
    rms = Math.sqrt(rms / data.length);
    if (rms < this.getSensitivityThreshold()) {
      return null;
    }
    const frequency = this.autoCorrelate(floatBuffer, sampleRate);
    if (!frequency || frequency === -1) {
      return null;
    }
    const volume = Math.min(100, Math.round(rms * 200));
    return { frequency, volume };
  },

  smoothFrequency(frequency) {
    if (!frequency) return frequency;
    if (!this.frequencyHistory) {
      this.frequencyHistory = [];
    }
    this.frequencyHistory.push(frequency);
    if (this.frequencyHistory.length > 5) {
      this.frequencyHistory.shift();
    }
    const sorted = [...this.frequencyHistory].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted[mid];
  },

  normalizeFrequency(frequency, targetFrequency) {
    if (!frequency || !targetFrequency) return frequency;
    let adjusted = frequency;
    let iterations = 0;
    while (adjusted < targetFrequency / 1.8 && iterations < 4) {
      adjusted *= 2;
      iterations += 1;
    }
    while (adjusted > targetFrequency * 1.8 && iterations < 8) {
      adjusted /= 2;
      iterations += 1;
    }
    return adjusted;
  },

  getSensitivityThreshold() {
    const value = this.data.sensitivity || 60;
    const clamped = Math.max(0, Math.min(100, value));
    return 0.02 - (clamped / 100) * 0.015;
  },

  getStabilityText() {
    if (!this.frequencyHistory || this.frequencyHistory.length < 3) {
      return '正在捕捉';
    }
    const max = Math.max(...this.frequencyHistory);
    const min = Math.min(...this.frequencyHistory);
    const range = max - min;
    if (range < 1.5) {
      return '音高稳定';
    }
    if (range < 4) {
      return '轻微波动';
    }
    return '音高波动';
  },

  autoCorrelate(buffer, sampleRate) {
    const size = buffer.length;
    const correlations = new Array(size).fill(0);
    let start = 0;
    let end = size - 1;
    const threshold = 0.2;

    while (start < size / 2 && Math.abs(buffer[start]) < threshold) start += 1;
    while (end > size / 2 && Math.abs(buffer[end]) < threshold) end -= 1;

    const trimmed = buffer.slice(start, end);
    const trimmedSize = trimmed.length;
    if (trimmedSize < 2) return -1;

    for (let offset = 0; offset < trimmedSize; offset += 1) {
      let sum = 0;
      for (let i = 0; i < trimmedSize - offset; i += 1) {
        sum += trimmed[i] * trimmed[i + offset];
      }
      correlations[offset] = sum;
    }

    let dip = 0;
    while (dip < trimmedSize - 1 && correlations[dip] > correlations[dip + 1]) dip += 1;

    let maxVal = -1;
    let maxPos = -1;
    for (let i = dip; i < trimmedSize; i += 1) {
      if (correlations[i] > maxVal) {
        maxVal = correlations[i];
        maxPos = i;
      }
    }

    if (maxPos <= 0) return -1;
    let t0 = maxPos;
    if (maxPos < trimmedSize - 1) {
      const x1 = correlations[maxPos - 1];
      const x2 = correlations[maxPos];
      const x3 = correlations[maxPos + 1];
      const a = (x1 + x3 - 2 * x2) / 2;
      const b = (x3 - x1) / 2;
      if (a) {
        t0 = t0 - b / (2 * a);
      }
    }

    return sampleRate / t0;
  },

  frequencyToCents(current, target) {
    if (!current || !target) return 0;
    const cents = 1200 * Math.log2(current / target);
    return Number(Math.max(-50, Math.min(50, cents)).toFixed(1));
  }
});
