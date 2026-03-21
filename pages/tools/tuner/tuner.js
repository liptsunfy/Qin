/*
 * Copyright (c) 2026 BA4SGP, SFY
 */
const WORKING_PROFILE_STORAGE_KEY = 'tuner_working_profile_index';

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
    recorderProfileIndex: 0,
    workingProfileIndex: -1,
    pointerPercent: 50,
    frameInterval: 0,
    activeProfileText: '--',
    targetFrequencyText: '--',
    currentFrequencyText: '--'
  },

  onLoad() {
    this.setupPresets();
    this.buildPitchReferenceList();
    this.setupRecorder();
    this.applyPreset(0);
    this.updateTuningFeedback(true);
    this.lastFrameAt = 0;
    this.recorderProfiles = this.getRecorderProfiles();
    this.restoreWorkingProfile();
  },

  onUnload() {
    this.stopListening();
    this.stopReferenceTone();
  },

  onHide() {
    this.stopListening();
    this.stopReferenceTone();
  },

  restoreWorkingProfile() {
    try {
      const savedIndex = wx.getStorageSync(WORKING_PROFILE_STORAGE_KEY);
      if (typeof savedIndex === 'number' && savedIndex >= 0 && savedIndex < this.recorderProfiles.length) {
        this.setData({
          workingProfileIndex: savedIndex,
          recorderProfileIndex: savedIndex
        });
      }
    } catch (err) {
      // ignore storage read failures
    }
  },

  persistWorkingProfile(index) {
    try {
      wx.setStorageSync(WORKING_PROFILE_STORAGE_KEY, index);
    } catch (err) {
      // ignore storage write failures
    }
  },

  clearWorkingProfile() {
    try {
      wx.removeStorageSync(WORKING_PROFILE_STORAGE_KEY);
    } catch (err) {
      // ignore storage clear failures
    }
    this.setData({ workingProfileIndex: -1 });
  },

  getRecorderProfiles() {
    // 按“高精度优先、广兼容兜底”排列。
    // 部分机型不接受 audioSource='mic'、大采样率或显式 format，
    // 因此同时准备带/不带 mic、带/不带 format 的多组参数。
    return [
      { format: 'PCM', sampleRate: 44100, frameSize: 4, useMic: true, analysisWindowSize: 2048, analysisHopSize: 1024 },
      { format: 'pcm', sampleRate: 44100, frameSize: 4, useMic: true, analysisWindowSize: 2048, analysisHopSize: 1024 },
      { format: 'wav', sampleRate: 44100, frameSize: 4, useMic: true, analysisWindowSize: 2048, analysisHopSize: 1024 },
      { sampleRate: 44100, frameSize: 4, useMic: true, analysisWindowSize: 2048, analysisHopSize: 1024 },
      { format: 'PCM', sampleRate: 22050, frameSize: 4, useMic: true, analysisWindowSize: 2048, analysisHopSize: 1024 },
      { format: 'pcm', sampleRate: 22050, frameSize: 4, useMic: true, analysisWindowSize: 2048, analysisHopSize: 1024 },
      { format: 'wav', sampleRate: 22050, frameSize: 4, useMic: true, analysisWindowSize: 2048, analysisHopSize: 1024 },
      { sampleRate: 22050, frameSize: 4, useMic: true, analysisWindowSize: 2048, analysisHopSize: 1024 },
      { format: 'PCM', sampleRate: 16000, frameSize: 5, useMic: true, analysisWindowSize: 2048, analysisHopSize: 1024 },
      { sampleRate: 16000, frameSize: 5, useMic: true, analysisWindowSize: 2048, analysisHopSize: 1024 },
      { sampleRate: 44100, frameSize: 4, analysisWindowSize: 2048, analysisHopSize: 1024 },
      { sampleRate: 22050, frameSize: 4, analysisWindowSize: 2048, analysisHopSize: 1024 },
      { sampleRate: 16000, frameSize: 5, analysisWindowSize: 2048, analysisHopSize: 1024 },
      { sampleRate: 16000, frameSize: 2, analysisWindowSize: 1024, analysisHopSize: 512 }
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
    if (!wx.getRecorderManager) {
      this.recorderManager = null;
      return;
    }
    this.recorderManager = wx.getRecorderManager();
    this.recorderState = {
      startToken: 0,
      hasFirstFrame: false,
      startupTimer: null,
      switching: false,
      retryRound: 0,
      frameSupported: typeof this.recorderManager.onFrameRecorded === 'function'
    };

    if (this.recorderState.frameSupported) {
      this.recorderManager.onFrameRecorded(this.onFrameRecorded.bind(this));
    }
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
    this.currentAnalysisWindowSize = profile.analysisWindowSize || 2048;
    this.currentAnalysisHopSize = profile.analysisHopSize || Math.floor(this.currentAnalysisWindowSize / 2);
    const profileText = `${profile.format || 'default'}/${profile.sampleRate || 'default'}Hz${profile.useMic ? '/mic' : ''}`;
    this.setData({
      recorderProfileIndex: index,
      activeProfileText: profileText,
      statusText: `正在监听音高（${profileText}）…`,
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
      if (this.recorderState && this.recorderState.retryRound < 1) {
        this.recorderState.retryRound += 1;
        this.recorderState.switching = true;
        this.clearStartupTimer();
        this.clearWorkingProfile();
        this.setData({
          recorderProfileIndex: 0,
          statusText: '正在重试监听初始化…',
          statusLevel: 'listening'
        });
        try {
          this.recorderManager.stop();
        } catch (e) {
          // ignore stop race
        }
        setTimeout(() => {
          if (!this.data.isListening) return;
          this.startWithProfile(0);
        }, 180);
        return;
      }
      this.clearWorkingProfile();
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


  formatFrequencyText(frequency) {
    if (!frequency || Number.isNaN(Number(frequency))) return '--';
    return Number(frequency).toFixed(1);
  },

  decorateStringItem(item) {
    if (!item) return item;
    const frequency = Number(item.frequency || 0);
    return {
      ...item,
      frequency,
      frequencyText: this.formatFrequencyText(frequency)
    };
  },

  syncCurrentString(index, strings = this.data.strings) {
    const list = (strings || []).map(item => this.decorateStringItem(item));
    const hasStrings = list.length > 0;
    const safeIndex = hasStrings ? Math.max(0, Math.min(index, list.length - 1)) : 0;
    const currentString = hasStrings ? list[safeIndex] : null;
    this.setData({
      strings: list,
      currentStringIndex: safeIndex,
      currentString,
      targetFrequencyText: currentString ? currentString.frequencyText : '--'
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
    const decoratedStrings = strings.map(item => this.decorateStringItem(item));
    this.setData({
      strings: decoratedStrings,
      currentPresetIndex: index,
      currentStringIndex,
      currentString: decoratedStrings[currentStringIndex] || null,
      targetFrequencyText: decoratedStrings[currentStringIndex] ? decoratedStrings[currentStringIndex].frequencyText : '--'
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
    const nextString = this.decorateStringItem(strings[clampedIndex]);
    this.setData({
      currentStringIndex: clampedIndex,
      currentString: nextString,
      targetFrequencyText: nextString ? nextString.frequencyText : '--'
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
      currentFrequencyText: '--',
      volume: 0,
      stability: 0,
      statusText,
      statusLevel,
      needleDeg: this.centsToNeedle(clamped),
      pointerPercent: 50,
      frameInterval: 0
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
      this.startListening();
      return;
    }
    this.stopListening();
  },

  startListening() {
    this.stopListening(false);
    if (!this.recorderManager) {
      this.setData({
        isListening: false,
        statusText: '当前设备不支持录音能力',
        statusLevel: 'idle'
      });
      return;
    }
    if (!this.recorderState || !this.recorderState.frameSupported) {
      this.setData({
        isListening: false,
        statusText: '当前设备暂不支持实时音高监听',
        statusLevel: 'idle'
      });
      return;
    }
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
        this.pendingSampleQueue = [];
        if (this.recorderState) {
          this.recorderState.retryRound = 0;
        }
        const startIndex = this.data.workingProfileIndex >= 0 ? this.data.workingProfileIndex : (this.data.recorderProfileIndex || 0);
        setTimeout(() => {
          if (!this.data.isListening) return;
          this.startWithProfile(startIndex);
        }, 120);
        this.listenTimer = setInterval(() => {
          const now = Date.now();
          if (!this.lastFrameAt) return;
          if (now - this.lastFrameAt > 1200) {
            this.setData({
              tuningValue: 0,
              cents: 0,
              currentFrequency: 0,
              currentFrequencyText: '--',
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
    this.pendingSampleQueue = [];
    this.currentRecorderFormat = '';
    if (this.recorderState) {
      this.recorderState.hasFirstFrame = false;
      this.recorderState.switching = false;
      this.recorderState.retryRound = 0;
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
    this.syncCurrentString(nextIndex, nextStrings);
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
    this.syncCurrentString(0, resetStrings);
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

  pushSamplesToQueue(samples) {
    if (!samples || !samples.length) return;
    if (!this.pendingSampleQueue) this.pendingSampleQueue = [];
    for (let i = 0; i < samples.length; i += 1) {
      this.pendingSampleQueue.push(samples[i]);
    }
    const maxQueueSize = Math.max((this.currentAnalysisWindowSize || 2048) * 4, 8192);
    if (this.pendingSampleQueue.length > maxQueueSize) {
      this.pendingSampleQueue = this.pendingSampleQueue.slice(this.pendingSampleQueue.length - maxQueueSize);
    }
  },

  detectPitchFromSamples(data) {
    if (!data || !data.length) return null;
    const sampleRate = this.currentRecorderSampleRate || 16000;
    const processed = this.preprocessAudioFrame(data);
    if (!processed) return null;
    const { floatBuffer, rms } = processed;
    if (rms < 0.0012) {
      return null;
    }

    const pyinResult = this.detectPitchWithPyin(floatBuffer, sampleRate, 45, 1600);
    const wideBand = this.detectPitchWithAutoCorrelation(floatBuffer, sampleRate, 45, 1600);
    const zeroCrossFrequency = this.estimateFrequencyFromZeroCrossings(floatBuffer, sampleRate);

    let rawFrequency = 0;
    let confidence = 0;

    if (pyinResult && pyinResult.frequency > 0) {
      rawFrequency = pyinResult.frequency;
      confidence = Math.max(confidence, pyinResult.confidence || 0);
    }

    if (wideBand && wideBand.frequency > 0) {
      if (!rawFrequency || (wideBand.clarity || 0) > confidence + 0.08) {
        rawFrequency = wideBand.frequency;
      }
      confidence = Math.max(confidence, wideBand.clarity || 0);
    }

    if (!rawFrequency && zeroCrossFrequency > 0) {
      rawFrequency = zeroCrossFrequency;
      confidence = Math.max(confidence, 0.15);
    }

    const volume = Math.min(100, Math.round(rms * 360));
    const stability = rawFrequency > 0
      ? Math.max(12, Math.min(100, Math.round(confidence * 100)))
      : 0;
    const hasStablePitch = rawFrequency > 0 && confidence >= 0.2;

    return {
      hasSignal: true,
      hasStablePitch,
      frequency: rawFrequency,
      volume,
      stability
    };
  },

  consumeQueuedPitchDetection() {
    const queue = this.pendingSampleQueue || [];
    const windowSize = this.currentAnalysisWindowSize || 2048;
    const hopSize = this.currentAnalysisHopSize || Math.floor(windowSize / 2);
    if (queue.length < windowSize) return null;

    let bestDetection = null;
    let processedCount = 0;
    while (this.pendingSampleQueue.length >= windowSize && processedCount < 3) {
      const frame = Int16Array.from(this.pendingSampleQueue.slice(0, windowSize));
      const detection = this.detectPitchFromSamples(frame);
      if (detection && (!bestDetection || (detection.stability || 0) >= (bestDetection.stability || 0))) {
        bestDetection = detection;
      }
      this.pendingSampleQueue.splice(0, hopSize);
      processedCount += 1;
    }
    return bestDetection;
  },

  onFrameRecorded(res) {
    if (!this.data.isListening) return;
    const frameBuffer = res && res.frameBuffer;
    if (!frameBuffer) return;
    if (this.data.workingProfileIndex !== this.data.recorderProfileIndex) {
      this.setData({ workingProfileIndex: this.data.recorderProfileIndex });
      this.persistWorkingProfile(this.data.recorderProfileIndex);
    }
    const now = Date.now();
    const frameInterval = this.lastFrameAt ? (now - this.lastFrameAt) : 0;
    if (this.recorderState) {
      this.recorderState.hasFirstFrame = true;
      this.recorderState.switching = false;
    }
    this.clearStartupTimer();
    const samples = this.toInt16Samples(frameBuffer, this.currentRecorderFormat);
    if (!samples || !samples.length) return;
    this.pushSamplesToQueue(samples);
    const detection = this.consumeQueuedPitchDetection();
    if (!detection) {
      return;
    }

    const { frequency, volume, stability, hasStablePitch } = detection;
    let stringItem = this.data.currentString || this.data.strings[this.data.currentStringIndex];
    if (!hasStablePitch) {
      const estimatedFrequency = frequency ? Number(frequency.toFixed(2)) : 0;
      const targetFrequency = stringItem ? stringItem.frequency : this.data.a4;
      const estimatedCalibratedFrequency = estimatedFrequency
        ? this.calibrateToTargetOctave(estimatedFrequency, targetFrequency)
        : 0;
      const estimatedCents = estimatedCalibratedFrequency
        ? this.frequencyToCents(estimatedCalibratedFrequency, targetFrequency)
        : 0;
      this.lastFrameAt = now;
      this.setData({
        tuningValue: estimatedCents,
        cents: estimatedCents,
        currentFrequency: estimatedFrequency,
        currentFrequencyText: this.formatFrequencyText(estimatedFrequency),
        volume,
        stability,
        pointerPercent: estimatedFrequency ? this.centsToPercent(estimatedCents) : 50,
        frameInterval,
        statusText: estimatedFrequency > 0 ? `已检测到 ${this.formatFrequencyText(estimatedFrequency)} Hz，实时检测中` : '已检测到声音，频率识别中',
        statusLevel: 'listening'
      });
      return;
    }
    const smoothedFrequency = this.smoothFrequency(frequency);
    if (this.data.autoTune) {
      const match = this.findClosestString(smoothedFrequency);
      if (match) {
        const matchedString = this.decorateStringItem(match.string);
        this.setData({
          currentStringIndex: match.index,
          currentString: matchedString,
          targetFrequencyText: matchedString ? matchedString.frequencyText : '--'
        });
        stringItem = matchedString;
      }
    }
    const targetFrequency = stringItem ? stringItem.frequency : this.data.a4;
    const calibratedFrequency = this.calibrateToTargetOctave(smoothedFrequency, targetFrequency);
    const deviation = this.frequencyToCents(calibratedFrequency, targetFrequency);
    const { statusText, statusLevel } = this.getStatusFromDeviation(deviation);
    const currentFrequency = Number(smoothedFrequency.toFixed(2));
    this.lastFrameAt = now;

    this.setData({
      tuningValue: deviation,
      cents: deviation,
      currentFrequency,
      currentFrequencyText: this.formatFrequencyText(currentFrequency),
      volume,
      stability,
      statusText,
      statusLevel,
      needleDeg: this.centsToNeedle(deviation),
      pointerPercent: this.centsToPercent(deviation),
      frameInterval
    });

    if (this.data.autoTune) {
      this.maybeAutoAdvance();
    }
  },


  preprocessAudioFrame(data) {
    if (!data || data.length < 256) return null;
    const size = Math.min(4096, data.length);
    const start = data.length > size ? data.length - size : 0;
    const floatBuffer = new Float32Array(size);
    let mean = 0;
    for (let i = 0; i < size; i += 1) {
      mean += data[start + i];
    }
    mean /= size;

    let rms = 0;
    for (let i = 0; i < size; i += 1) {
      const centered = (data[start + i] - mean) / 32768;
      const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / Math.max(1, size - 1));
      const value = centered * window;
      floatBuffer[i] = value;
      rms += value * value;
    }
    rms = Math.sqrt(rms / size);
    return { floatBuffer, rms };
  },

  detectPitchWithAutoCorrelation(buffer, sampleRate, minFreq = 45, maxFreq = 1600) {
    if (!buffer || buffer.length < 512) return { frequency: 0, clarity: 0 };
    const safeMinFreq = Math.max(35, Number(minFreq) || 45);
    const safeMaxFreq = Math.min(2000, Math.max(safeMinFreq + 10, Number(maxFreq) || 1600));
    let minLag = Math.max(4, Math.floor(sampleRate / safeMaxFreq));
    let maxLag = Math.min(Math.floor(buffer.length / 2), Math.ceil(sampleRate / safeMinFreq));
    if (maxLag <= minLag) {
      minLag = Math.max(4, Math.floor(sampleRate / 1600));
      maxLag = Math.min(Math.floor(buffer.length / 2), Math.ceil(sampleRate / 45));
    }

    let bestLag = -1;
    let bestCorr = 0;
    const corrAt = (lag) => {
      if (lag < minLag || lag > maxLag) return 0;
      let sum = 0;
      let energyA = 0;
      let energyB = 0;
      const limit = buffer.length - lag;
      for (let i = 0; i < limit; i += 1) {
        const a = buffer[i];
        const b = buffer[i + lag];
        sum += a * b;
        energyA += a * a;
        energyB += b * b;
      }
      const denom = Math.sqrt(energyA * energyB);
      return denom ? sum / denom : 0;
    };

    for (let lag = minLag; lag <= maxLag; lag += 1) {
      const corr = corrAt(lag);
      if (corr > bestCorr) {
        bestCorr = corr;
        bestLag = lag;
      }
    }

    if (bestLag < 0 || bestCorr < 0.18) return { frequency: 0, clarity: bestCorr || 0 };

    let betterLag = bestLag;
    if (bestLag > minLag && bestLag < maxLag) {
      const s0 = corrAt(bestLag - 1);
      const s1 = bestCorr;
      const s2 = corrAt(bestLag + 1);
      const denom = s0 + s2 - (2 * s1);
      if (denom !== 0) {
        betterLag = bestLag + ((s0 - s2) / (2 * denom));
      }
    }

    const frequency = sampleRate / betterLag;
    return {
      frequency: frequency >= 35 && frequency <= 2000 ? frequency : 0,
      clarity: bestCorr
    };
  },

  getTargetFrequency() {
    const currentString = this.data.currentString || this.data.strings[this.data.currentStringIndex];
    return currentString ? Number(currentString.frequency || 0) : 0;
  },

  detectPitch(buffer) {
    if (!buffer) return null;
    const data = this.toInt16Samples(buffer, this.currentRecorderFormat);
    if (!data || !data.length) return null;
    return this.detectPitchFromSamples(data);
  },

  estimateFrequencyFromZeroCrossings(buffer, sampleRate) {
    if (!buffer || buffer.length < 64) return 0;
    let zeroCrossings = 0;
    for (let i = 1; i < buffer.length; i += 1) {
      const prev = buffer[i - 1];
      const curr = buffer[i];
      if ((prev <= 0 && curr > 0) || (prev >= 0 && curr < 0)) {
        zeroCrossings += 1;
      }
    }
    const durationSeconds = buffer.length / sampleRate;
    if (!durationSeconds) return 0;
    const frequency = zeroCrossings / (2 * durationSeconds);
    if (frequency < 40 || frequency > 1200) return 0;
    return Number(frequency.toFixed(2));
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

  detectPitchWithPyin(buffer, sampleRate, minFreq = 45, maxFreq = 1600) {
    const size = Math.min(2048, buffer.length);
    if (size < 512) return { frequency: 0, confidence: 0 };

    const halfSize = Math.floor(size / 2);
    const yinBuffer = new Float32Array(halfSize);
    const safeMinFreq = Math.max(35, Number(minFreq) || 45);
    const safeMaxFreq = Math.min(2000, Math.max(safeMinFreq + 10, Number(maxFreq) || 1600));
    const minTau = Math.max(2, Math.floor(sampleRate / safeMaxFreq));
    const maxTau = Math.min(halfSize - 2, Math.ceil(sampleRate / safeMinFreq));

    for (let tau = 1; tau < halfSize; tau += 1) {
      let sum = 0;
      for (let i = 0; i < halfSize; i += 1) {
        const delta = buffer[i] - buffer[i + tau];
        sum += delta * delta;
      }
      yinBuffer[tau] = sum;
    }

    yinBuffer[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < halfSize; tau += 1) {
      runningSum += yinBuffer[tau];
      yinBuffer[tau] = runningSum ? (yinBuffer[tau] * tau) / runningSum : 1;
    }

    const thresholds = [0.05, 0.075, 0.1, 0.125, 0.15, 0.2, 0.25, 0.3];
    const candidates = [];

    thresholds.forEach((threshold, thresholdIndex) => {
      for (let tau = minTau; tau <= maxTau; tau += 1) {
        if (yinBuffer[tau] < threshold) {
          while (tau + 1 <= maxTau && yinBuffer[tau + 1] < yinBuffer[tau]) {
            tau += 1;
          }
          const s0 = yinBuffer[tau - 1] || yinBuffer[tau];
          const s1 = yinBuffer[tau];
          const s2 = yinBuffer[tau + 1] || yinBuffer[tau];
          const denom = s0 + s2 - (2 * s1);
          const betterTau = denom !== 0 ? tau + ((s0 - s2) / (2 * denom)) : tau;
          const weight = (1 - threshold) * (1 - Math.min(1, s1)) * (1 + ((thresholds.length - thresholdIndex) / thresholds.length) * 0.35);
          candidates.push({ tau: betterTau, weight, valley: s1 });
          break;
        }
      }
    });

    if (!candidates.length) {
      let bestTau = -1;
      let bestValley = Infinity;
      for (let tau = minTau; tau <= maxTau; tau += 1) {
        if (yinBuffer[tau] < bestValley) {
          bestValley = yinBuffer[tau];
          bestTau = tau;
        }
      }
      if (bestTau === -1 || bestValley > 0.45) {
        return { frequency: 0, confidence: 0 };
      }
      candidates.push({ tau: bestTau, weight: 1 - Math.min(1, bestValley), valley: bestValley });
    }

    let totalWeight = 0;
    let weightedTau = 0;
    let bestWeight = 0;
    let bestValley = 1;
    candidates.forEach((candidate) => {
      totalWeight += candidate.weight;
      weightedTau += candidate.tau * candidate.weight;
      if (candidate.weight > bestWeight) {
        bestWeight = candidate.weight;
        bestValley = candidate.valley;
      }
    });

    if (!totalWeight) return { frequency: 0, confidence: 0 };
    const finalTau = weightedTau / totalWeight;
    const frequency = sampleRate / finalTau;
    const confidence = Math.max(0, Math.min(1, 1 - bestValley));

    return {
      frequency: frequency >= 35 && frequency <= 2000 ? frequency : 0,
      confidence
    };
  },

  detectPitchWithYin(buffer, sampleRate) {
    return this.detectPitchWithPyin(buffer, sampleRate, 45, 1600);
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


  centsToPercent(cents) {
    const clamped = Math.max(-50, Math.min(50, cents || 0));
    return Number((50 + clamped).toFixed(2));
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
      const boostedSample = Math.tanh(sample * 1.45);
      view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, boostedSample)) * 32767, true);
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
    const h1 = Math.sin(2 * Math.PI * frequency * time) * 0.8;
    const h2 = Math.sin(2 * Math.PI * frequency * 2 * time) * 0.24;
    const h3 = Math.sin(2 * Math.PI * frequency * 3 * time) * 0.11;
    const h4 = Math.sin(2 * Math.PI * frequency * 4 * time) * 0.05;
    return h1 + h2 + h3 + h4;
  },

  pianoEnvelope(time, duration) {
    const attack = 0.008;
    const decay = 0.1;
    const sustainLevel = 0.92;
    const release = 0.22;
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
