const { getVenuesByProvinceAndCity } = require('../../../utils/qinsheData.js');

Page({
  data: {
    province: '',
    city: '',
    venues: []
  },

  onLoad(options) {
    const province = decodeURIComponent(options.province || '');
    const city = decodeURIComponent(options.city || '');

    this.setData({
      province,
      city,
      venues: getVenuesByProvinceAndCity(province, city)
    });
    wx.setNavigationBarTitle({ title: `${city} · 琴馆信息` });
  },

  onCopyLink(e) {
    const link = e.currentTarget.dataset.link;
    if (!link) return;
    wx.setClipboardData({
      data: link,
      success: () => {
        wx.showToast({ title: '详情链接已复制', icon: 'none' });
      }
    });
  }
});
