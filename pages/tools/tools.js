const ToolsManager = require('../../utils/toolsManager.js');
const { getHeaderSlotText } = require('../../utils/headerSlot.js');

Page({
  data: {
    toolsByCategory: {},
    categories: [],
    activeCategory: 'all',
    categoryKeys: [],

    // 顶部留白承载位（默认展示农历日期；后期可扩展为节日/公告）
    headerSlot: {
      primary: '今日 · 习练',
      secondary: ''
    }
  },

  onLoad() {
    this.refreshHeaderSlot();
    this.loadToolsData();
  },

  onShow() {
    // 返回页面时也刷新一次顶部承载位（工具数据无需每次都强制刷新）
    this.refreshHeaderSlot();
  },

  refreshHeaderSlot() {
    const headerSlot = getHeaderSlotText(new Date());
    this.setData({ headerSlot });
  },

  loadToolsData() {
    const toolsByCategory = ToolsManager.getToolsByCategory();
    const categoryKeys = Object.keys(toolsByCategory);

    this.setData({
      toolsByCategory,
      categories: ['all', ...categoryKeys],
      categoryKeys
    });
  },

  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ activeCategory: category });
  },

  // 搜索/刷新相关入口已移除：
  // 顶部区域改为动态信息展示位（公告/节日祝福等）。

  onToolTap(e) {
    const toolId = e.currentTarget.dataset.id;
    const tool = ToolsManager.getToolById(toolId);

    if (!tool) {
      wx.showToast({ title: '工具不存在', icon: 'error' });
      return;
    }

    if (!tool.enabled) {
      wx.showModal({
        title: '功能开发中',
        content: `${tool.name}功能正在开发中，敬请期待！`,
        showCancel: false
      });
      return;
    }

    if (tool.hasPage) {
      wx.navigateTo({ url: tool.pagePath });
    } else {
      wx.showModal({ title: tool.name, content: tool.description, showCancel: false });
    }
  }
});
