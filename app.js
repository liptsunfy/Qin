/*
 * Copyright (c) 2026 BA4SGP, SFY
 */
App({
  onLaunch(options) {
    console.log('小程序初始化', options);
    
    // 检查隐私协议
    if (wx.getPrivacySetting) {
      wx.getPrivacySetting({
        success: (res) => {
          console.log('隐私协议状态:', res);
          if (res.needAuthorization) {
            // 需要用户同意隐私协议
            wx.requirePrivacyAuthorize({
              success: () => {
                console.log('用户同意了隐私协议');
              },
              fail: () => {
                console.log('用户拒绝了隐私协议');
              }
            });
          }
        },
        fail: () => {
          console.log('获取隐私协议设置失败');
        }
      });
    }
  },
  
  onShow(options) {
    console.log('小程序显示', options);
  },
  
  onHide() {
    console.log('小程序隐藏');
  },
  
  onError(msg) {
    console.error('小程序错误:', msg);
  },
  
  globalData: {
    userInfo: null,
    systemInfo: null
  }
});