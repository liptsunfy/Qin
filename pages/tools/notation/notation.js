// pages/tools/notation/notation.js
const { CATEGORIES, ITEMS } = require('../../../utils/notationData');

function normalize(str) {
  return (str || '').toString().trim().toLowerCase();
}

function matchItem(item, q) {
  if (!q) return true;
  const nQ = normalize(q);
  const hay = [
    item.symbol,
    item.name,
    item.category,
    ...(item.keywords || []),
    item.desc,
    item.tips
  ]
    .filter(Boolean)
    .map(s => normalize(s))
    .join(' ');
  return hay.includes(nQ);
}

Page({
  data: {
    categories: CATEGORIES,
    activeCategory: '全部',
    query: '',
    results: [],
    total: 0,
    // 详情弹层
    detailVisible: false,
    detailItem: null,
    // 推荐快速入口
    quickSymbols: ['勾', '剔', '抹', '挑', '托', '吟', '猱', '绰', '注', '泛', '散', '按']
  },

  onLoad() {
    // 为每个条目挂载本地图像（占位图/后续可替换为真实减字谱图）
    // 约定路径：/images/jianzipu/<id>.png
    this._allItems = ITEMS.map(it => ({
      ...it,
      imgSrc: `/images/jianzipu/${it.id}.png`
    }));
    this.applyFilter();
  },

  onCategoryTap(e) {
    const cat = e.currentTarget.dataset.cat;
    if (!cat) return;
    this.setData({ activeCategory: cat }, () => this.applyFilter());
  },

  onInput(e) {
    const query = e.detail.value || '';
    this.setData({ query }, () => {
      // 简单防抖：上一次未到就取消
      if (this._searchTimer) clearTimeout(this._searchTimer);
      this._searchTimer = setTimeout(() => this.applyFilter(), 120);
    });
  },

  onClear() {
    this.setData({ query: '' }, () => this.applyFilter());
  },

  onQuickTap(e) {
    const sym = e.currentTarget.dataset.sym;
    if (!sym) return;
    this.setData({ query: sym }, () => this.applyFilter());
  },

  applyFilter() {
    const { activeCategory, query } = this.data;
    const list = this._allItems.filter(it => {
      const catOk = activeCategory === '全部' ? true : it.category === activeCategory;
      return catOk && matchItem(it, query);
    });

    this.setData({
      results: list,
      total: list.length
    });
  },

  onItemTap(e) {
    const id = e.currentTarget.dataset.id;
    const item = this._allItems.find(x => x.id === id);
    if (!item) return;
    this.setData({
      detailVisible: true,
      detailItem: item
    });
  },

  closeDetail() {
    this.setData({ detailVisible: false, detailItem: null });
  },

  // 阻止遮罩点击穿透
  noop() {},

  onShareAppMessage() {
    return {
      title: '减字谱查询 · 古琴习练助手',
      path: '/pages/tools/notation/notation'
    };
  }
});
