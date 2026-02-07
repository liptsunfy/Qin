/*
 * Copyright (c) 2026 BA4SGP, SFY
 */
Page({
  data: {
    tuningPresets: [],
    tuningPresetNames: [],
    currentPresetIndex: 0,
    a4: 440,
    a4Options: [432, 440, 442],
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
    isTonePlaying: false,
    statusText: '未开始监听',
    statusLevel: 'idle',
    needleDeg: 0
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
    this.stopReferenceTone();
  },

  onHide() {
    this.stopListening();
    this.stopReferenceTone();
  },

  setupPresets() {
    // 正调以 C 调为基准：五六一二三五六 -> G2/A2/C3/D3/E3/G3/A3
    const tuningPresets = [
      {
        name: '正调',
        description: '五六一二三五六（C调）',
        notes: ['G2', 'A2', 'C3', 'D3', 'E3', 'G3', 'A3']
      },
      {
        name: '紧五弦',
        description: '五弦升高',
        notes: ['G2', 'A2', 'C3', 'D3', 'F#3', 'G3', 'A3']
      },
      {
        name: '慢三弦',
        description: '三弦降低',
        notes: ['G2', 'A2', 'B2', 'D3', 'E3', 'G3', 'A3']
      },
      {
        name: '紧五慢三',
        description: '五弦升高，三弦降低',
        notes: ['G2', 'A2', 'B2', 'D3', 'F#3', 'G3', 'A3']
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
      needleDeg: this.centsToNeedle(clamped)
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
      this.stopReferenceTone();
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
        statusLevel: 'idle'
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

  onA4Input(e) {
    const value = Number(e.detail.value);
    if (!value) return;
    const clamped = Math.max(415, Math.min(466, value));
    this.setData({ a4: clamped });
    this.applyPreset(this.data.currentPresetIndex);
    this.updateTuningFeedback(true);
  },

  adjustA4(e) {
    const step = Number(e.currentTarget.dataset.step || 0);
    if (!step) return;
    const next = Math.max(415, Math.min(466, this.data.a4 + step));
    this.setData({ a4: next });
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
        statusLevel: 'idle'
      });
      return;
    }
    const { frequency, volume } = detection;
    const smoothedFrequency = this.smoothFrequency(frequency);
    const match = this.findClosestString(smoothedFrequency);
    if (match) {
      this.setData({
        currentStringIndex: match.index,
        currentString: match.string
      });
    }
    const stringItem = match ? match.string : (this.data.currentString || this.data.strings[this.data.currentStringIndex]);
    const targetFrequency = stringItem ? stringItem.frequency : this.data.a4;
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
      needleDeg: this.centsToNeedle(deviation)
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
    if (rms < 0.008) {
      return null;
    }
    const result = this.detectPitchWithFft(floatBuffer, sampleRate);
    if (!result || result.frequency === -1 || result.confidence < 0.12) {
      return null;
    }
    const volume = Math.min(100, Math.round(rms * 200));
    return { frequency: result.frequency, volume };
  },

  smoothFrequency(frequency) {
    if (!frequency) return frequency;
    if (!this.frequencyHistory) {
      this.frequencyHistory = [];
    }
    this.frequencyHistory.push(frequency);
    if (this.frequencyHistory.length > 7) {
      this.frequencyHistory.shift();
    }
    const sorted = [...this.frequencyHistory].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted[mid];
  },

  detectPitchWithFft(buffer, sampleRate) {
    const size = 2048;
    if (buffer.length < size) return { frequency: -1, confidence: 0 };
    const slice = buffer.slice(0, size);
    const { magnitudes } = this.fftReal(slice);
    const minFreq = 60;
    const maxFreq = 1200;
    const minIndex = Math.floor((minFreq / sampleRate) * size);
    const maxIndex = Math.min(magnitudes.length - 1, Math.floor((maxFreq / sampleRate) * size));
    let peakIndex = -1;
    let peakValue = 0;
    for (let i = minIndex; i <= maxIndex; i += 1) {
      if (magnitudes[i] > peakValue) {
        peakValue = magnitudes[i];
        peakIndex = i;
      }
    }
    if (peakIndex <= 0) return { frequency: -1, confidence: 0 };
    let fundamental = (peakIndex * sampleRate) / size;
    const harmonicCandidates = [2, 3, 4];
    harmonicCandidates.forEach((divisor) => {
      const index = Math.floor(peakIndex / divisor);
      if (index >= minIndex && magnitudes[index] > peakValue * 0.2) {
        fundamental = (index * sampleRate) / size;
      }
    });
    return {
      frequency: fundamental,
      confidence: peakValue / (size * 0.5)
    };
  },

  fftReal(buffer) {
    const size = buffer.length;
    const real = buffer.slice();
    const imag = new Float32Array(size);
    for (let step = 1; step < size; step *= 2) {
      const jump = step * 2;
      const delta = Math.PI / step;
      for (let group = 0; group < step; group += 1) {
        const cos = Math.cos(delta * group);
        const sin = -Math.sin(delta * group);
        for (let pair = group; pair < size; pair += jump) {
          const match = pair + step;
          const tre = cos * real[match] - sin * imag[match];
          const tim = cos * imag[match] + sin * real[match];
          real[match] = real[pair] - tre;
          imag[match] = imag[pair] - tim;
          real[pair] += tre;
          imag[pair] += tim;
        }
      }
    }
    const magnitudes = new Float32Array(size / 2);
    for (let i = 0; i < magnitudes.length; i += 1) {
      magnitudes[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
    }
    return { magnitudes };
  },

  frequencyToCents(current, target) {
    if (!current || !target) return 0;
    const cents = 1200 * Math.log2(current / target);
    return Number(Math.max(-50, Math.min(50, cents)).toFixed(1));
  },

  centsToNeedle(cents) {
    const clamped = Math.max(-50, Math.min(50, cents));
    return (clamped / 50) * 45;
  },

  findClosestString(frequency) {
    if (!frequency || !this.data.strings || !this.data.strings.length) return null;
    let closestIndex = 0;
    let closestDiff = Infinity;
    this.data.strings.forEach((stringItem, index) => {
      const diff = Math.abs(frequency - stringItem.frequency);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = index;
      }
    });
    return {
      index: closestIndex,
      string: this.data.strings[closestIndex]
    };
  },

  toggleReferenceTone() {
    if (this.data.isTonePlaying) {
      this.stopReferenceTone();
      return;
    }
    this.playReferenceTone();
  },

  playReferenceTone() {
    const stringItem = this.data.currentString || this.data.strings[this.data.currentStringIndex];
    const frequency = stringItem ? stringItem.frequency : this.data.a4;
    const filePath = this.generateToneFile(frequency, 1.2);
    if (!filePath) return;
    if (!this.toneContext) {
      this.toneContext = wx.createInnerAudioContext();
    }
    this.toneContext.src = filePath;
    this.toneContext.onEnded(() => {
      this.setData({ isTonePlaying: false });
    });
    this.toneContext.onStop(() => {
      this.setData({ isTonePlaying: false });
    });
    this.toneContext.onError(() => {
      this.setData({ isTonePlaying: false });
      wx.showToast({ title: '播放参考音失败', icon: 'none' });
    });
    this.toneContext.play();
    this.setData({ isTonePlaying: true });
  },

  stopReferenceTone() {
    if (this.toneContext) {
      this.toneContext.stop();
    }
    this.setData({ isTonePlaying: false });
  },

  generateToneFile(frequency, durationSeconds) {
    if (!frequency) return null;
    const sampleRate = 44100;
    const sampleCount = Math.floor(sampleRate * durationSeconds);
    const buffer = new ArrayBuffer(44 + sampleCount * 2);
    const view = new DataView(buffer);
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i += 1) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + sampleCount * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, sampleCount * 2, true);
    for (let i = 0; i < sampleCount; i += 1) {
      const t = i / sampleRate;
      const sample = Math.sin(2 * Math.PI * frequency * t);
      view.setInt16(44 + i * 2, sample * 32767, true);
    }
    const fs = wx.getFileSystemManager();
    const filePath = `${wx.env.USER_DATA_PATH}/tone_${Math.round(frequency)}.wav`;
    try {
      fs.writeFileSync(filePath, buffer);
      return filePath;
    } catch (err) {
      wx.showToast({ title: '参考音生成失败', icon: 'none' });
      return null;
    }
  }
});
