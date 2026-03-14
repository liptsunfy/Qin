Page({
  data: {
    modes: [
      { key: 'anyin', label: '按音图' },
      { key: 'fanyin', label: '泛音图' }
    ],
    tunings: ['F调', 'C调', 'G调'],
    currentModeIndex: 0,
    currentTuningIndex: 0
  },

  onToggleMode() {
    const nextIndex = (this.data.currentModeIndex + 1) % this.data.modes.length;
    this.setData({ currentModeIndex: nextIndex });
  },

  onTuningChange(e) {
    const index = Number(e.detail.value);
    if (Number.isNaN(index)) return;
    this.setData({ currentTuningIndex: index });
  }
});
