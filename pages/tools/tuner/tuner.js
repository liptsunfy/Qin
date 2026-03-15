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
      { id: 1, name: '一弦', note: 'C', octave: '2', tuned: false, frequency: 65.4},
      { id: 2, name: '二弦', note: 'D', octave: '2', tuned: false, frequency: 73.4 },
      { id: 3, name: '三弦', note: 'F', octave: '2', tuned: false, frequency: 87.3 },
      { id: 4, name: '四弦', note: 'G', octave: '2', tuned: false, frequency: 98.0 },
      { id: 5, name: '五弦', note: 'A', octave: '2', tuned: false, frequency: 110 },
      { id: 6, name: '六弦', note: 'C', octave: '3', tuned: false, frequency: 130.8 },
      { id: 7, name: '七弦', note: 'D', octave: '3', tuned: false, frequency: 146.8 }
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
    stability: 0,
    recorderProfileIndex: 0
  },

  onLoad() {
    this.setupPresets();
    this.buildPitchReferenceList();
    this.setupRecorder();
    this.applyPreset(0);
    this.updateTuningFeedback(true);
    this.lastFrameAt = 0;
    this.recorderProfiles = this.getRecorderProfiles();
  },

  onUnload() {
    this.stopListening();
    this.stopReferenceTone();
  },

  onHide() {
    this.stopListening();
    this.stopReferenceTone();
  },

  getRecorderProfiles() {
    // 底层兼容策略：先尝试可直接分析的 PCM/WAV，再降级采样率、帧长与音源参数。
    // 部分机型对 format 大小写敏感，故同时覆盖 PCM/pcm；另有机型仅支持 wav。
    return [
      { format: 'PCM', sampleRate: 48000, frameSize: 16, useMic: true },
      { format: 'PCM', sampleRate: 44100, frameSize: 8, useMic: true },
      { format: 'PCM', sampleRate: 32000, frameSize: 8, useMic: true },
      { format: 'PCM', sampleRate: 16000, frameSize: 10, useMic: true },
      { format: 'PCM', sampleRate: 16000, frameSize: 5, useMic: true },
      { format: 'pcm', sampleRate: 16000, frameSize: 5, useMic: true },
      { format: 'wav', sampleRate: 16000, frameSize: 5, useMic: true },
      { format: 'wav', sampleRate: 44100, frameSize: 8, useMic: true },
      { format: 'PCM', sampleRate: 16000, frameSize: 5, useMic: false },
      { format: 'pcm', sampleRate: 16000, frameSize: 2, useMic: false },
      { format: 'wav', sampleRate: 16000, frameSize: 2, useMic: false },
      { sampleRate: 16000, frameSize: 5, useMic: false }
    ];
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
    this.recorderState = {
      startToken: 0,
      hasFirstFrame: false,
      startupTimer: null,
      switching: false
    };

    this.recorderManager.onFrameRecorded(this.onFrameRecorded.bind(this));
    this.recorderManager.onStop(() => {
      if (!this.data.isListening) return;
      // 避免切参过程中 stop 误触发最终失败
      if (this.recorderState && this.recorderState.switching) return;
      this.setData({
        isListening: false,
        statusText: '录音已停止',
        statusLevel: 'idle'
      });
    });
    this.recorderManager.onError((err) => {
      if (!this.data.isListening) return;
      this.switchToNextProfile((err && err.errMsg) || 'onError');
    });
  },

  clearStartupTimer() {
    if (this.recorderState && this.recorderState.startupTimer) {
      clearTimeout(this.recorderState.startupTimer);
      this.recorderState.startupTimer = null;
    }
  },

  buildStartOptions(profile) {
    const options = {
      duration: 10 * 60 * 1000,
      numberOfChannels: 1,
      sampleRate: profile.sampleRate || 16000,
      frameSize: profile.frameSize || 5
    };
    if (profile.format) options.format = profile.format;
    if (profile.useMic) options.audioSource = 'mic';
    return options;
  },

  startWithProfile(index) {
    if (!this.data.isListening) return;
    const profile = (this.recorderProfiles && this.recorderProfiles[index]) || null;
    if (!profile) {
      this.setData({
        isListening: false,
        statusText: '录音失败：当前设备录音参数不兼容',
        statusLevel: 'idle'
      });
      return;
    }

    const token = Date.now() + Math.floor(Math.random() * 1000);
    this.recorderState.startToken = token;
    this.recorderState.hasFirstFrame = false;
    this.recorderState.switching = false;
    this.clearStartupTimer();

    this.currentRecorderSampleRate = profile.sampleRate || 16000;
    this.currentRecorderFormat = (profile.format || '').toLowerCase();
    this.setData({
      recorderProfileIndex: index,
      statusText: `正在监听音高（${profile.format || 'default'}/${profile.sampleRate || 'default'}Hz${profile.useMic ? '/mic' : ''}）…`,
      statusLevel: 'listening'
    });

    const startOptions = this.buildStartOptions(profile);
    try {
      this.recorderManager.start(startOptions);
    } catch (err) {
      this.switchToNextProfile((err && err.errMsg) || 'start throw');
      return;
    }

    // 某些机型 start 不报错但永远不回帧：超时后自动切参数
    this.recorderState.startupTimer = setTimeout(() => {
      if (!this.data.isListening) return;
      if (!this.recorderState || this.recorderState.startToken !== token) return;
      if (!this.recorderState.hasFirstFrame) {
        this.switchToNextProfile('start ok but no frame');
      }
    }, 2500);
  },

  switchToNextProfile(reason) {
    if (!this.data.isListening || !this.recorderProfiles) return;
    const nextIndex = this.data.recorderProfileIndex + 1;
    if (nextIndex >= this.recorderProfiles.length) {
      this.stopListening(false);
      this.setData({
        isListening: false,
        statusText: `录音失败：当前设备录音参数不兼容（${reason}）`,
        statusLevel: 'idle'
      });
      return;
    }

    const next = this.recorderProfiles[nextIndex];
    this.recorderState.switching = true;
    this.clearStartupTimer();
    this.setData({
      recorderProfileIndex: nextIndex,
      statusText: `录音参数切换中（${next.format || 'default'}/${next.sampleRate || 'default'}Hz${next.useMic ? '/mic' : ''}）…`,
      statusLevel: 'listening'
    });

    try {
      this.recorderManager.stop();
    } catch (e) {
      // ignore stop race
    }

    setTimeout(() => {
      if (!this.data.isListening) return;
      this.startWithProfile(nextIndex);
    }, 120);
  },

  startRecorderWithCurrentProfile() {
    const profile = (this.recorderProfiles && this.recorderProfiles[this.data.recorderProfileIndex])
      || { format: 'PCM', sampleRate: 16000, frameSize: 5, useMic: true };
    this.currentRecorderSampleRate = profile.sampleRate || 16000;
    this.currentRecorderFormat = (profile.format || '').toLowerCase();

    const startOptions = {
      duration: 10 * 60 * 1000,
      numberOfChannels: 1
    };
    if (profile.format) startOptions.format = profile.format;
    if (profile.sampleRate) startOptions.sampleRate = profile.sampleRate;
    if (profile.frameSize) startOptions.frameSize = profile.frameSize;
    if (profile.useMic) startOptions.audioSource = 'mic';

    this.setData({
      statusText: `正在监听音高（${profile.format || 'default'}/${profile.sampleRate || 'default'}Hz${profile.useMic ? '/mic' : ''}）…`,
      statusLevel: 'listening'
    });

    try {
      this.recorderManager.start(startOptions);
    } catch (err) {
      this.retryRecorderProfile(err);
    }
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
    if (!this.data.isListening) {
      this.stopReferenceTone();
      this.setData({ recorderProfileIndex: 0 });
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
          statusText: '正在启动录音…',
          statusLevel: 'listening'
        });
        this.lastFrameAt = 0;
        this.firstFrameDeadlineAt = Date.now() + 2200;
        this.frequencyHistory = [];
        this.stabilityHistory = [];
        this.startWithProfile(this.data.recorderProfileIndex || 0);
        this.listenTimer = setInterval(() => {
          const now = Date.now();
          if (!this.lastFrameAt) return;
          if (now - this.lastFrameAt > 1200) {
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
          statusText: '未获得麦克风权限，请在设置中允许录音',
          statusLevel: 'idle'
        });
      });
  },

  stopListening(updateStatus = true) {
    if (this.listenTimer) {
      clearInterval(this.listenTimer);
      this.listenTimer = null;
    }
    this.clearStartupTimer();
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
    this.recorderProfiles = this.getRecorderProfiles();
    this.frequencyHistory = [];
    this.stabilityHistory = [];
    this.currentRecorderFormat = '';
    if (this.recorderState) {
      this.recorderState.hasFirstFrame = false;
      this.recorderState.switching = false;
    }
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
    return this.ensurePrivacyAuthorization()
      .then(() => new Promise((resolve, reject) => {
        wx.getSetting({
          success: res => {
            const permission = res.authSetting['scope.record'];
            if (permission) {
              resolve();
              return;
            }
            if (permission === false) {
              this.promptOpenRecordSetting(resolve, reject);
              return;
            }
            wx.authorize({
              scope: 'scope.record',
              success: resolve,
              fail: (err) => {
                this.promptOpenRecordSetting(resolve, reject, err);
              }
            });
          },
          fail: () => {
            // 某些机型 getSetting 可能异常，回退为直接申请授权
            wx.authorize({
              scope: 'scope.record',
              success: resolve,
              fail: (err) => this.promptOpenRecordSetting(resolve, reject, err)
            });
          }
        });
      }));
  },

  ensurePrivacyAuthorization() {
    return new Promise((resolve, reject) => {
      if (!wx.requirePrivacyAuthorize) {
        resolve();
        return;
      }
      wx.requirePrivacyAuthorize({
        success: () => resolve(),
        fail: reject
      });
    });
  },

  promptOpenRecordSetting(resolve, reject) {
    wx.showModal({
      title: '需要录音权限',
      content: '调音器需要麦克风权限，请前往设置开启。',
      confirmText: '去设置',
      success: modalRes => {
        if (!modalRes.confirm) {
          reject();
          return;
        }
        wx.openSetting({
          success: settingRes => {
            if (settingRes.authSetting && settingRes.authSetting['scope.record']) {
              resolve();
              return;
            }
            reject();
          },
          fail: reject
        });
      },
      fail: reject
    });
  },

  onFrameRecorded(res) {
    if (!this.data.isListening) return;
    const frameBuffer = res && res.frameBuffer;
    if (!frameBuffer) return;
    if (this.recorderState) {
      this.recorderState.hasFirstFrame = true;
      this.recorderState.switching = false;
    }
    this.clearStartupTimer();
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
    const calibratedFrequency = this.calibrateToTargetOctave(smoothedFrequency, targetFrequency);
    const deviation = this.frequencyToCents(calibratedFrequency, targetFrequency);
    const { statusText, statusLevel } = this.getStatusFromDeviation(deviation);
    const currentFrequency = Number(calibratedFrequency.toFixed(2));
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
    const data = this.toInt16Samples(buffer, this.currentRecorderFormat);
    if (!data || !data.length) return null;
    const sampleRate = this.currentRecorderSampleRate || 16000;
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


  toInt16Samples(buffer, format) {
    if (!buffer) return null;
    let offset = 0;
    // wav 帧可能包含头部，跳过 RIFF/WAVE 头后再按 PCM16 读取。
    if (format === 'wav' && buffer.byteLength >= 44) {
      const header = new Uint8Array(buffer, 0, 4);
      if (header[0] === 82 && header[1] === 73 && header[2] === 70 && header[3] === 70) {
        offset = 44;
      }
    }
    const remain = buffer.byteLength - offset;
    if (remain <= 2) return null;
    const aligned = remain - (remain % 2);
    if (aligned <= 0) return null;
    return new Int16Array(buffer.slice(offset, offset + aligned));
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
    const minTau = Math.floor(sampleRate / 400);
    const maxTau = Math.min(yinBuffer.length - 1, Math.ceil(sampleRate / 50));
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
    for (let tau = Math.max(2, minTau); tau <= maxTau; tau += 1) {
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


  calibrateToTargetOctave(frequency, targetFrequency) {
    if (!frequency || !targetFrequency) return frequency;
    let calibrated = frequency;
    while (calibrated >= targetFrequency * 1.95) {
      calibrated /= 2;
    }
    while (calibrated <= targetFrequency * 0.52) {
      calibrated *= 2;
    }
    return calibrated;
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
    const filePath = this.generateToneFile(frequency, 2.5);
    if (!filePath) return;
    if (!this.toneContext) {
      this.toneContext = wx.createInnerAudioContext();
      this.toneContext.obeyMuteSwitch = false;
      this.toneContext.loop = true;
      this.toneContext.volume = 1;
      this.toneContext.onStop(() => {
        this.setData({ isTonePlaying: false });
      });
      this.toneContext.onError(() => {
        this.setData({ isTonePlaying: false });
        wx.showToast({ title: '播放参考音失败', icon: 'none' });
      });
    }
    this.toneContext.src = filePath;
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
    const sampleRate = this.currentRecorderSampleRate || 16000;
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
      fs.writeFileSync(filePath, buffer, "binary");
      return filePath;
    } catch (err) {
      wx.showToast({ title: '参考音生成失败', icon: 'none' });
      return null;
    }
  },

  referenceWave(frequency, time) {
    // 钢琴感参考音：保持基频准确，同时加入递减谐波以提升可听性。
    const h1 = Math.sin(2 * Math.PI * frequency * time) * 0.68;
    const h2 = Math.sin(2 * Math.PI * frequency * 2 * time) * 0.2;
    const h3 = Math.sin(2 * Math.PI * frequency * 3 * time) * 0.09;
    const h4 = Math.sin(2 * Math.PI * frequency * 4 * time) * 0.03;
    return h1 + h2 + h3 + h4;
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
