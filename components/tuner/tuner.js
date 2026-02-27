// 调音器组件（古琴：五度相生律基准）
const A4_FREQUENCY = 440;

// 以 A 为基准的五度步数（每+1为上行纯五度）
const FIFTH_STEPS_FROM_A = {
  Fb: -11,
  Cb: -10,
  Gb: -9,
  Db: -8,
  Ab: -7,
  Eb: -6,
  Bb: -5,
  F: -4,
  C: -3,
  G: -2,
  D: -1,
  A: 0,
  E: 1,
  B: 2,
  'F#': 3,
  'C#': 4,
  'G#': 5,
  'D#': 6,
  'A#': 7,
  'E#': 8,
  'B#': 9
};

const NOTE_LETTER_TO_SEMITONE = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11
};

const ACCIDENTAL_TO_OFFSET = {
  '': 0,
  '#': 1,
  b: -1
};

// 为每个半音位保留至少一种升号与降号写法，并显式包含 E# / Fb、B# / Cb
const ENHARMONIC_GROUPS = [
  ['C', 'B#'],
  ['C#', 'Db'],
  ['D'],
  ['D#', 'Eb'],
  ['E', 'Fb'],
  ['E#', 'F'],
  ['F#', 'Gb'],
  ['G'],
  ['G#', 'Ab'],
  ['A'],
  ['A#', 'Bb'],
  ['B', 'Cb']
];

function getMidiLikeValue(noteName, octave) {
  const letter = noteName[0];
  const accidental = noteName.slice(1);
  return 12 * (octave + 1) + NOTE_LETTER_TO_SEMITONE[letter] + ACCIDENTAL_TO_OFFSET[accidental];
}

// 根据五度相生律计算指定音名的频率（A4 = 440）
function getPythagoreanFrequency(noteName, octave) {
  const fifthSteps = FIFTH_STEPS_FROM_A[noteName];
  if (typeof fifthSteps !== 'number') return null;

  const rawFrequency = A4_FREQUENCY * Math.pow(3 / 2, fifthSteps);
  const targetMidi = getMidiLikeValue(noteName, octave);
  const targetTetFrequency = A4_FREQUENCY * Math.pow(2, (targetMidi - 69) / 12);

  // 通过八度平移，让结果落到目标音区附近
  let bestFrequency = rawFrequency;
  let minDiff = Math.abs(rawFrequency - targetTetFrequency);

  for (let shift = -8; shift <= 8; shift += 1) {
    const candidate = rawFrequency * Math.pow(2, shift);
    const diff = Math.abs(candidate - targetTetFrequency);
    if (diff < minDiff) {
      minDiff = diff;
      bestFrequency = candidate;
    }
  }

  return bestFrequency;
}

function buildReferenceNotes(minOctave = 0, maxOctave = 7) {
  const notes = [];

  for (let octave = minOctave; octave <= maxOctave; octave += 1) {
    ENHARMONIC_GROUPS.forEach((group) => {
      group.forEach((noteName) => {
        const frequency = getPythagoreanFrequency(noteName, octave);
        if (frequency) {
          notes.push({
            label: `${noteName}${octave}`,
            noteName,
            octave,
            frequency
          });
        }
      });
    });
  }

  return notes;
}

Component({
  properties: {
    toolId: {
      type: String,
      value: 'tuner'
    }
  },

  data: {
    title: '古琴调音器',
    currentNote: '',
    frequency: 0,
    deviation: 0,
    isListening: false,
    strings: [
      { name: '一弦', note: 'C1', frequency: 65.19 },
      { name: '二弦', note: 'D1', frequency: 73.33 },
      { name: '三弦', note: 'F1', frequency: 87.09 },
      { name: '四弦', note: 'G1', frequency: 97.78 },
      { name: '五弦', note: 'A2', frequency: 110.0 },
      { name: '六弦', note: 'C2', frequency: 130.37 },
      { name: '七弦', note: 'D2', frequency: 146.67 }
    ],
    selectedString: 0,
    referenceNotes: []
  },

  methods: {
    // 开始调音
    startTuning() {
      if (this.data.isListening) return;

      wx.showLoading({
        title: '启动调音器...'
      });

      // 请求录音权限
      wx.getSetting({
        success: (res) => {
          if (!res.authSetting['scope.record']) {
            wx.authorize({
              scope: 'scope.record',
              success: () => {
                this.startAudioListening();
              },
              fail: () => {
                wx.hideLoading();
                wx.showModal({
                  title: '需要录音权限',
                  content: '请允许使用麦克风以进行调音',
                  success: (modalRes) => {
                    if (modalRes.confirm) {
                      wx.openSetting();
                    }
                  }
                });
              }
            });
          } else {
            this.startAudioListening();
          }
        }
      });
    },

    // 开始音频监听
    startAudioListening() {
      this.setData({ isListening: true });
      wx.hideLoading();

      // 这里应接入真实音频分析；当前保留模拟输入便于联调 UI
      this.startSimulation();
    },

    // 模拟调音（实际项目需用真实音频分析）
    startSimulation() {
      let count = 0;
      this.simulationTimer = setInterval(() => {
        count += 1;
        const targetFreq = this.data.strings[this.data.selectedString].frequency;
        const deviation = Math.sin(count * 0.1) * 10;
        const simulatedFrequency = targetFreq + deviation;

        this.setData({
          frequency: simulatedFrequency,
          deviation,
          currentNote: this.getClosestNote(simulatedFrequency)
        });
      }, 100);
    },

    // 停止调音
    stopTuning() {
      if (this.simulationTimer) {
        clearInterval(this.simulationTimer);
        this.simulationTimer = null;
      }

      this.setData({
        isListening: false,
        frequency: 0,
        deviation: 0,
        currentNote: ''
      });
    },

    // 选择琴弦
    selectString(e) {
      const index = e.currentTarget.dataset.index;
      this.setData({ selectedString: index });

      if (this.data.isListening) {
        this.setData({
          frequency: this.data.strings[index].frequency,
          deviation: 0,
          currentNote: this.getClosestNote(this.data.strings[index].frequency)
        });
      }
    },

    // 在五度相生律参考表中找最接近的音名
    getClosestNote(frequency) {
      const notePool = this.data.referenceNotes || [];
      if (!notePool.length || frequency <= 0) return '';

      let best = notePool[0];
      let minDiff = Math.abs(notePool[0].frequency - frequency);

      for (let i = 1; i < notePool.length; i += 1) {
        const diff = Math.abs(notePool[i].frequency - frequency);
        if (diff < minDiff) {
          minDiff = diff;
          best = notePool[i];
        }
      }

      return best.label;
    },

    // 关闭工具
    onClose() {
      this.stopTuning();
      this.triggerEvent('close');
    }
  },

  lifetimes: {
    attached() {
      this.setData({
        referenceNotes: buildReferenceNotes(0, 7)
      });
    },

    detached() {
      this.stopTuning();
    }
  }
});
