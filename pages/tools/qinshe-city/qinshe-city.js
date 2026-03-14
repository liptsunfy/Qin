const { getCitiesByProvince } = require('../../../utils/qinsheData.js');

Page({
  data: {
    province: '',
    cities: []
  },

  onLoad(options) {
    const province = decodeURIComponent(options.province || '');
    this.setData({
      province,
      cities: getCitiesByProvince(province)
    });
    wx.setNavigationBarTitle({ title: `${province} · 城市目录` });
  },

  onCityTap(e) {
    const city = e.currentTarget.dataset.city;
    const { province } = this.data;
    if (!province || !city) return;
    wx.navigateTo({
      url: `/pages/tools/qinshe-venue/qinshe-venue?province=${encodeURIComponent(province)}&city=${encodeURIComponent(city)}`
    });
  }
});
