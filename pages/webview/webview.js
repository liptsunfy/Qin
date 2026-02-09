Page({
  data: {
    url: ''
  },

  onLoad(options) {
    const rawUrl = options && options.url ? decodeURIComponent(options.url) : '';
    const fallback = 'https://mp.weixin.qq.com/s/li3f_Nb7CN9JjcsnOv717Q';
    this.setData({
      url: rawUrl || fallback
    });
  }
});
