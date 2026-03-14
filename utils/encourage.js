// 古琴相关鼓励语句库
const ENCOURAGE_PHRASES = [
  "日习一操，功不唐捐",
  "琴心剑胆，持之以恒",
  "弦歌不辍，金石为开",
  "抚琴养性，静水流深",
  "指法精进，心手相应",
  "今日抚琴，心旷神怡",
  "弦上功夫，贵在坚持",
  "琴声悠扬，心境澄明",
  "指间流淌的是时光，弦上奏响的是坚持",
  "每一次按弦，都是与古人的对话",
  "持之以恒，方得始终",
  "每日进步，未来可期",
  "静心练习，自有收获",
  "琴路漫漫，贵在坚持",
  "今日的努力，明日的进步",
  "琴音绕梁，三日不绝",
  "高山流水，知音难觅",
  "弹指间，岁月静好",
  "琴韵悠长，心境自宽",
  "抚琴一曲，烦恼尽消"
];

// 鼓励语句管理器
const EncourageManager = {
  // 获取随机鼓励语句
  getRandomPhrase() {
    const index = Math.floor(Math.random() * ENCOURAGE_PHRASES.length);
    return ENCOURAGE_PHRASES[index];
  },

  // 根据打卡状态获取鼓励语
  getPhraseByStatus(hasCheckedIn, continuousDays) {
    if (!hasCheckedIn) {
      const phrases = [
        "今日尚未抚琴，快来记录吧",
        "琴在等你，快来练习吧",
        "坚持打卡，养成好习惯"
      ];
      return phrases[Math.floor(Math.random() * phrases.length)];
    }
    
    if (continuousDays >= 7) {
      return "连续练习7天，继续保持！";
    } else if (continuousDays >= 30) {
      return "连续练习30天，真了不起！";
    } else {
      return this.getRandomPhrase();
    }
  },

  // 获取完成打卡的鼓励语
  getCompletionPhrase(duration) {
    if (duration >= 60) {
      return "练习超过1小时，辛苦了！";
    } else if (duration >= 30) {
      return "专注练习半小时，进步看得见";
    } else {
      return "今日打卡完成，继续加油！";
    }
  }
};

module.exports = EncourageManager;