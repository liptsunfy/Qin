// 应用配置信息
const AppSettings = {
  // 应用信息
  appName: '琴记',
  appVersion: '1.0.0',
  appDesc: '极简风格的古琴练习打卡工具',
  
  // 默认用户信息
  defaultUserInfo: {
    nickname: '古琴爱好者',
    avatar: '/images/default-avatar.png',
    signature: '日习一操，功不唐捐',
    joinDate: new Date().toISOString().split('T')[0]
  },
  
  // 打卡设置
  checkinSettings: {
    minDuration: 1,      // 最小练习时长（分钟）
    maxDuration: 999,    // 最大练习时长（分钟）
    maxNotesLength: 200, // 笔记最大长度
    defaultDuration: 30  // 默认练习时长
  },
  
  // 统计设置
  statsSettings: {
    // 最近天数统计
    recentDays: 30,
    
    // 分享设置
    share: {
      maxRecordsInPreview: 10,
      defaultRangeDays: 30
    }
  },
  
  // 界面设置
  uiSettings: {
    primaryColor: '#333333',
    secondaryColor: '#f0f0f0',
    textColor: '#333333',
    mutedColor: '#999999',
    borderColor: '#dddddd',
    
    // 字体大小
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '24px'
    }
  },
  
  // 功能开关
  features: {
    enableAvatarChange: true,
    enableDataExport: true,
    enableShare: true,
    enableDonate: true,
    enableDataClear: true
  }
};

module.exports = AppSettings;