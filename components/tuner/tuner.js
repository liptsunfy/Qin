// 调音器组件
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
      { name: '一弦', note: 'C2', frequency: 65.41 },
      { name: '二弦', note: 'D2', frequency: 73.42 },
      { name: '三弦', note: 'F2', frequency: 87.31 },
      { name: '四弦', note: 'G2', frequency: 98.00 },
      { name: '五弦', note: 'A2', frequency: 110.00 },
      { name: '六弦', note: 'C3', frequency: 130.81 },
      { name: '七弦', note: 'D3', frequency: 146.83 }
    ],
    selectedString: 0
  },

  methods: {
    // 开始调音
    startTuning() {
      if (this.data.isListening) return;
      
      wx.showLoading({
        title: '启动调音器...',
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
                  success: (res) => {
                    if (res.confirm) {
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
      
      // 这里应该使用Web Audio API进行频率分析
      // 由于小程序限制，这里使用模拟数据
      this.startSimulation();
    },

    // 模拟调音（实际项目需用真实音频分析）
    startSimulation() {
      let count = 0;
      this.simulationTimer = setInterval(() => {
        count++;
        const targetFreq = this.data.strings[this.data.selectedString].frequency;
        const deviation = Math.sin(count * 0.1) * 10; // 模拟偏差
        
        this.setData({
          frequency: targetFreq + deviation,
          deviation: deviation,
          currentNote: this.getClosestNote(targetFreq + deviation)
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
      
      // 如果正在调音，重置频率显示
      if (this.data.isListening) {
        this.setData({
          frequency: this.data.strings[index].frequency,
          deviation: 0
        });
      }
    },

    // 获取最接近的音符
    getClosestNote(frequency) {
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const A4 = 440;
      const noteIndex = Math.round(12 * Math.log2(frequency / A4)) + 69;
      const octave = Math.floor(noteIndex / 12) - 1;
      const noteName = notes[noteIndex % 12];
      return noteName + octave;
    },

    // 关闭工具
    onClose() {
      this.stopTuning();
      this.triggerEvent('close');
    }
  },

  lifetimes: {
    detached() {
      this.stopTuning();
    }
  }
});