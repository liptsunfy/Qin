/*
 * Copyright (c) 2026 BA4SGP, SFY
 */
Page({
  data: {
    tuningPresets: [],
    tuningPresetNames: [],
    currentPresetIndex: 0,
    a4: 440,
    a4Options: [440],
    strings: [
      { id: 1, name: '一弦', note: 'C', octave: '2', tuned: false, frequency: 65.19},
      { id: 2, name: '二弦', note: 'D', octave: '2', tuned: false, frequency: 73.33 },
      { id: 3, name: '三弦', note: 'F', octave: '2', tuned: false, frequency: 87.09 },
      { id: 4, name: '四弦', note: 'G', octave: '2', tuned: false, frequency: 97.78 },
      { id: 5, name: '五弦', note: 'A', octave: '2', tuned: false, frequency: 110 },
      { id: 6, name: '六弦', note: 'C', octave: '3', tuned: false, frequency: 130.37 },
      { id: 7, name: '七弦', note: 'D', octave: '3', tuned: false, frequency: 146.67 }
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
    needleDeg: 0,
    stability: 0
  },

  onLoad() {
    this.setupPresets();
    this.buildPitchReferenceList();
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
    // 正调（1=F）按用户提供基准：
    // C2=65.4, D2=73.4, F2=87.3, G2=98.0, A2=110.0, C3=130.8, D3=146.8
    const tuningPresets = [
      {
        name: '正调',
        description: '1=F（五度相生律基准）',
        notes: [
          { note: 'C2', frequency: 65.4 },
          { note: 'D2', frequency: 73.4 },
          { note: 'F2', frequency: 87.3 },
          { note: 'G2', frequency: 98.0 },
          { note: 'A2', frequency: 110.0 },
          { note: 'C3', frequency: 130.8 },
          { note: 'D3', frequency: 146.8 }
        ],
        jianpu: ['1', '2', '4', '5', '6', '1', '2']
      },
      {
        name: '蕤宾调',
        description: '示例调式（含升降音名）',
        notes: ['C2', 'D2', 'E#2', 'G2', 'A2', 'Cb3', 'D3'],
        jianpu: ['1', '2', '#3', '5', '6', 'b1', '2']
      },
      {
        name: '黄钟调',
        description: '示例调式（含升降音名）',
        notes: ['Bb2', 'D2', 'F2', 'G2', 'A2', 'C3', 'E#3'],
        jianpu: ['b7', '2', '4', '5', '6', '1', '#3']
      }
    ];
    this.setData({
      tuningPresets,
      tuningPresetNames: tuningPresets.map(item => item.name)
    });
  },

  buildPitchReferenceList() {
    const names = [
      'Cb', 'C', 'C#',
      'Db', 'D', 'D#',
      'Eb', 'E', 'E#',
      'Fb', 'F', 'F#',
      'Gb', 'G', 'G#',
      'Ab', 'A', 'A#',
      'Bb', 'B', 'B#'
    ];
    this.pitchReferenceList = names.map((name) => ({
      name,
      note: `${name}2`,
      frequency: this.noteToFrequency(`${name}2`, this.data.a4)
    }));
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
        statusText: '录音失败（设备可能不支持 PCM），请重试或重启微信',
        statusLevel: 'idle'
      });
    });
  },

  applyPreset(index) {
    const preset = this.data.tuningPresets[index];
    if (!preset) return;
    const stringNames = ['一弦', '二弦', '三弦', '四弦', '五弦', '六弦', '七弦'];
    const strings = preset.notes.map((item, i) => {
      const rawNote = typeof item === 'string' ? item : item.note;
      const note = this.normalizeNoteToken(rawNote) || 'A4';
      const frequency = (item && typeof item === 'object' && item.frequency)
        ? Number(item.frequency)
        : this.noteToFrequency(note, this.data.a4);
      const [noteName, octave] = this.parseNote(note);
      return {
        id: i + 1,
        name: stringNames[i] || `${i + 1}弦`,
        jianpu: preset.jianpu ? preset.jianpu[i] : '',
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
    const match = /^([A-G](?:#|b)?)(\d{1,2})$/.exec(note);
    if (!match) return [note, ''];
    return [match[1], match[2]];
  },

  normalizeNoteToken(note) {
    if (!note || typeof note !== 'string') return null;
    const token = note.trim();
    const match = /^([A-G])([#b]?)(\d{1,2})$/.exec(token);
    if (!match) return null;
    return `${match[1]}${match[2]}${match[3]}`;
  },

  noteToFrequency(note, a4) {
    // 五度相生律后台算法锚点：A2 = 110Hz（对应国际基准音 A4 = 440Hz）
    // 自然音：由 A 音沿五度链计算，再八度归并到目标音区；
    // 升半音：* 256/243；降半音：* 243/256。
    const [name, octaveText] = this.parseNote(note);
    const match = /^([A-G])([#b]?)$/.exec(name);
    if (!match) return Number((a4 / 4).toFixed(2));

    const letter = match[1];
    const accidental = match[2];
    const octave = Number(octaveText);
    const naturalFrequency = this.getNaturalFrequency(letter, octave, a4);

    let accidentalRatio = 1;
    if (accidental === '#') accidentalRatio = 256 / 243;
    if (accidental === 'b') accidentalRatio = 243 / 256;

    return Number((naturalFrequency * accidentalRatio).toFixed(2));
  },

  getNaturalFrequency(letter, octave, a4 = 440) {
    // 以 A4=440 (=> A2=110) 为基准，采用项目约定的自然音参考频率（2组）
    // 并按八度倍频扩展到其它音区。
    const naturalRefOctave2 = {
      C: 65.4,
      D: 73.4,
      E: 82.5,
      F: 87.3,
      G: 98.0,
      A: 110.0,
      B: 123.8
    };
    const ref = naturalRefOctave2[letter];
    if (!ref) return 110;

    const a4Scale = a4 / 440;
    return ref * Math.pow(2, octave - 2) * a4Scale;
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
      stability: 0,
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

  onPresetChange(e) {
    const index = Number(e.detail.value);
    if (Number.isNaN(index)) return;
    this.applyPreset(index);
    this.updateTuningFeedback(true);
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
        this.stabilityHistory = [];
        this.recorderManager.start({
          format: 'pcm',
          sampleRate: 44100,
          numberOfChannels: 1,
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
              stability: 0,
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
    this.stabilityHistory = [];
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
    this.setData({ a4: 440 });
    this.applyPreset(this.data.currentPresetIndex);
    this.buildPitchReferenceList();
    this.updateTuningFeedback(true);
  },

  adjustA4(e) {
    this.setData({ a4: 440 });
    this.applyPreset(this.data.currentPresetIndex);
    this.buildPitchReferenceList();
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
    const frameBuffer = res && res.frameBuffer;
    if (!frameBuffer) return;
    const detection = this.detectPitch(frameBuffer);
    if (!detection) {
      this.setData({
        tuningValue: 0,
        cents: 0,
        currentFrequency: 0,
        volume: 0,
        stability: 0,
        statusText: '未检测到稳定音高',
        statusLevel: 'idle'
      });
      return;
    }
    const { frequency, volume, stability } = detection;
    const smoothedFrequency = this.smoothFrequency(frequency);
    let stringItem = this.data.currentString || this.data.strings[this.data.currentStringIndex];
    if (this.data.autoTune) {
      const match = this.findClosestString(smoothedFrequency);
      if (match) {
        this.setData({
          currentStringIndex: match.index,
          currentString: match.string
        });
        stringItem = match.string;
      }
    }
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
      stability,
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
    if (rms < 0.005) {
      return null;
    }
    const result = this.detectPitchWithYin(floatBuffer, sampleRate);
    if (!result || result.frequency === -1 || result.confidence < 0.08) {
      return null;
    }
    const volume = Math.min(100, Math.round(rms * 220));
    const stability = Math.min(100, Math.round(result.confidence * 100));
    return { frequency: result.frequency, volume, stability };
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

  detectPitchWithYin(buffer, sampleRate) {
    const size = Math.min(2048, buffer.length);
    if (size < 512) return { frequency: -1, confidence: 0 };
    const yinBuffer = new Float32Array(size / 2);
    for (let tau = 1; tau < yinBuffer.length; tau += 1) {
      let sum = 0;
      for (let i = 0; i < yinBuffer.length; i += 1) {
        const delta = buffer[i] - buffer[i + tau];
        sum += delta * delta;
      }
      yinBuffer[tau] = sum;
    }
    yinBuffer[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < yinBuffer.length; tau += 1) {
      runningSum += yinBuffer[tau];
      yinBuffer[tau] *= tau / runningSum;
    }
    const threshold = 0.15;
    let tauEstimate = -1;
    for (let tau = 2; tau < yinBuffer.length; tau += 1) {
      if (yinBuffer[tau] < threshold) {
        while (tau + 1 < yinBuffer.length && yinBuffer[tau + 1] < yinBuffer[tau]) {
          tau += 1;
        }
        tauEstimate = tau;
        break;
      }
    }
    if (tauEstimate === -1) return { frequency: -1, confidence: 0 };
    let betterTau = tauEstimate;
    if (tauEstimate > 1 && tauEstimate + 1 < yinBuffer.length) {
      const s0 = yinBuffer[tauEstimate - 1];
      const s1 = yinBuffer[tauEstimate];
      const s2 = yinBuffer[tauEstimate + 1];
      const denom = s0 + s2 - 2 * s1;
      if (denom !== 0) {
        betterTau = tauEstimate + (s0 - s2) / (2 * denom);
      }
    }
    const frequency = sampleRate / betterTau;
    const confidence = 1 - yinBuffer[tauEstimate];
    return { frequency, confidence };
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
      const env = this.pianoEnvelope(t, durationSeconds);
      const sample = this.referenceWave(frequency, t) * env;
      view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, sample)) * 32767, true);
    }
    const fs = wx.getFileSystemManager();
    const filePath = `${wx.env.USER_DATA_PATH}/tone_${Number(frequency).toFixed(2).replace('.', '_')}_${Math.round(durationSeconds * 1000)}ms.wav`;
    try {
      fs.writeFileSync(filePath, buffer);
      return filePath;
    } catch (err) {
      wx.showToast({ title: '参考音生成失败', icon: 'none' });
      return null;
    }
  },

  referenceWave(frequency, time) {
    // 基频始终精确为目标频率；为改善手机小喇叭对低频（如 A2=110Hz）的可感知性，
    // 轻微叠加 2/3 次谐波，避免“听起来偏低”但不改变基频。
    const base = Math.sin(2 * Math.PI * frequency * time);
    const h2 = Math.sin(2 * Math.PI * frequency * 2 * time);
    const h3 = Math.sin(2 * Math.PI * frequency * 3 * time);
    return base * 0.82 + h2 * 0.14 + h3 * 0.04;
  },

  pianoEnvelope(time, duration) {
    const attack = 0.01;
    const decay = 0.12;
    const sustainLevel = 0.82;
    const release = 0.18;
    if (time < attack) {
      return time / attack;
    }
    if (time < attack + decay) {
      const t = (time - attack) / decay;
      return 1 - (1 - sustainLevel) * t;
    }
    if (time < duration - release) {
      return sustainLevel;
    }
    const t = (time - (duration - release)) / release;
    return sustainLevel * (1 - t);
  }
});
