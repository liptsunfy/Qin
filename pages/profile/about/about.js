const AppSettings = require('../../../components/config/settings.js');

Page({
  data: {
    version: AppSettings.appVersion,
    sections: [
      {
        title: '我们的初衷',
        paragraphs: [
          '古琴助手希望把古琴日常练习中最常用的小工具整合到同一个小程序里，让你在练习前、练习中和练习后都能快速找到顺手可用的功能。',
          '相比一次性堆很多复杂功能，我们更关注高频、轻量、可持续扩展的体验。'
        ]
      },
      {
        title: '相关功能',
        bullets: [
          '调音器、节拍器、练习录音等高频辅助工具。',
          '打卡、练习记录、周/月习练回顾等成长记录能力。',
          '琴馆检索、减字谱查询、琴知识等内容辅助模块。'
        ]
      },
    ]
  }
});
