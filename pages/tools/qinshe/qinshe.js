const { getProvinceList, searchVenues } = require('../../../utils/qinsheData.js');

Page({
  data: {
    keyword: '',
    allProvinces: [],
    provinces: [],
    searchResults: []
  },

  onLoad() {
    const allProvinces = getProvinceList();
    this.setData({
      allProvinces,
      provinces: allProvinces,
      searchResults: []
    });
  },

  onKeywordInput(e) {
    const keyword = (e.detail.value || '').trim();
    if (!keyword) {
      this.setData({
        keyword: '',
        provinces: this.data.allProvinces,
        searchResults: []
      });
      return;
    }

    const lower = keyword.toLowerCase();
    const provinces = this.data.allProvinces.filter(item => item.province.toLowerCase().includes(lower));
    const searchResults = searchVenues(keyword);
    this.setData({ keyword, provinces, searchResults });
  },

  onClearKeyword() {
    this.setData({
      keyword: '',
      provinces: this.data.allProvinces,
      searchResults: []
    });
  },

  onProvinceTap(e) {
    const province = e.currentTarget.dataset.province;
    if (!province) return;
    wx.navigateTo({
      url: `/pages/tools/qinshe-city/qinshe-city?province=${encodeURIComponent(province)}`
    });
  },

  onSearchResultTap(e) {
    const province = e.currentTarget.dataset.province;
    const city = e.currentTarget.dataset.city;
    if (!province || !city) return;
    wx.navigateTo({
      url: `/pages/tools/qinshe-venue/qinshe-venue?province=${encodeURIComponent(province)}&city=${encodeURIComponent(city)}`
    });
  }
});
