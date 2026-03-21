// utils/notationData.js
// 减字谱查询（离线对照）- 先覆盖常见基础符号，后续可逐步扩充

const CATEGORIES = [
  '全部',
  '右手指法',
  '左手指法',
  '音位与弦序',
  '记谱提示'
];

const ITEMS = [
  // 右手指法（常见）
  {
    id: 'rh-gou',
    symbol: '勾',
    name: '勾',
    category: '右手指法',
    keywords: ['gou', '右手', '勾弦', '勾挑', '勾剔'],
    desc: '右手向内拨弦（常用于内向发音）。',
    tips: '注意控制指尖出弦角度，避免杂音。'
  },
  {
    id: 'rh-ti',
    symbol: '剔',
    name: '剔',
    category: '右手指法',
    keywords: ['ti', '右手', '剔弦'],
    desc: '右手向外拨弦（外向发音）。'
  },
  {
    id: 'rh-mo',
    symbol: '抹',
    name: '抹',
    category: '右手指法',
    keywords: ['mo', '右手', '抹弦'],
    desc: '以食指向外拨弦（常见基础法）。'
  },
  {
    id: 'rh-tiao',
    symbol: '挑',
    name: '挑',
    category: '右手指法',
    keywords: ['tiao', '右手', '挑弦'],
    desc: '以拇指向外挑弦。'
  },
  {
    id: 'rh-tuo',
    symbol: '托',
    name: '托',
    category: '右手指法',
    keywords: ['tuo', '右手', '托弦'],
    desc: '以拇指向内托弦。'
  },
  {
    id: 'rh-bo',
    symbol: '擘',
    name: '擘',
    category: '右手指法',
    keywords: ['bo', '右手', '擘弦'],
    desc: '多指或拇指外向较强拨弦（力度相对更大）。'
  },
  {
    id: 'rh-da',
    symbol: '打',
    name: '打',
    category: '右手指法',
    keywords: ['da', '右手', '打圆', '打弦'],
    desc: '用指关节或指面轻击弦（多作装饰或强调）。'
  },
  {
    id: 'rh-zhai',
    symbol: '摘',
    name: '摘',
    category: '右手指法',
    keywords: ['zhai', '右手', '摘弦'],
    desc: '指尖快速摘拨，音头清晰。'
  },
  {
    id: 'rh-gun',
    symbol: '滚',
    name: '滚',
    category: '右手指法',
    keywords: ['gun', '右手', '滚拂', '滚奏'],
    desc: '多指连续拨弦形成连贯音流。',
    tips: '注意节奏均匀与音量一致。'
  },
  {
    id: 'rh-fu',
    symbol: '拂',
    name: '拂',
    category: '右手指法',
    keywords: ['fu', '右手', '拂弦'],
    desc: '多指外向拂扫（常与滚对用）。'
  },
  {
    id: 'rh-cuo',
    symbol: '撮',
    name: '撮',
    category: '右手指法',
    keywords: ['cuo', '右手', '撮弦', '双声'],
    desc: '两弦或多弦同时拨奏，形成和声音响。'
  },
  {
    id: 'rh-lun',
    symbol: '轮',
    name: '轮',
    category: '右手指法',
    keywords: ['lun', '右手', '轮指'],
    desc: '手指轮番拨弦形成连续音型。'
  },

  // 左手指法（常见）
  {
    id: 'lh-yin',
    symbol: '吟',
    name: '吟',
    category: '左手指法',
    keywords: ['yin', '左手', '揉', '颤'],
    desc: '左手在按音处做细微往返动作，使音微颤。'
  },
  {
    id: 'lh-nao',
    symbol: '猱',
    name: '猱',
    category: '左手指法',
    keywords: ['nao', '左手', '大揉', '宽吟'],
    desc: '左手较大幅度揉动，音高起伏更明显。'
  },
  {
    id: 'lh-chuo',
    symbol: '绰',
    name: '绰',
    category: '左手指法',
    keywords: ['chuo', '左手', '上滑'],
    desc: '左手向上（靠近岳山方向）滑动至目标音。'
  },
  {
    id: 'lh-zhu',
    symbol: '注',
    name: '注',
    category: '左手指法',
    keywords: ['zhu', '左手', '下滑'],
    desc: '左手向下（靠近龙龈方向）滑动至目标音。'
  },
  {
    id: 'lh-shang',
    symbol: '上',
    name: '上',
    category: '左手指法',
    keywords: ['shang', '左手', '上滑', '上行'],
    desc: '表示左手上行（滑向高音区）。'
  },
  {
    id: 'lh-xia',
    symbol: '下',
    name: '下',
    category: '左手指法',
    keywords: ['xia', '左手', '下滑', '下行'],
    desc: '表示左手下行（滑向低音区）。'
  },

  // 音位与弦序
  {
    id: 'pos-san',
    symbol: '散',
    name: '散音',
    category: '音位与弦序',
    keywords: ['san', '散音', '空弦'],
    desc: '不按弦直接弹奏空弦之音。'
  },
  {
    id: 'pos-an',
    symbol: '按',
    name: '按音',
    category: '音位与弦序',
    keywords: ['an', '按音', '实音'],
    desc: '左手按弦取音。'
  },
  {
    id: 'pos-fan',
    symbol: '泛',
    name: '泛音',
    category: '音位与弦序',
    keywords: ['fan', '泛音', '徽音', 'harmonic'],
    desc: '在徽位轻触取泛音。'
  },
  {
    id: 'pos-string',
    symbol: '一二三四五六七',
    name: '弦序',
    category: '音位与弦序',
    keywords: ['弦序', '一弦', '二弦', '三弦', '四弦', '五弦', '六弦', '七弦'],
    desc: '减字谱常以“一～七”表示第几弦。'
  },
  {
    id: 'pos-hui',
    symbol: '徽位（如七徽、九徽半）',
    name: '徽位',
    category: '音位与弦序',
    keywords: ['徽位', '几徽', '半徽', 'hui'],
    desc: '在琴面徽点处取音（泛音/按音定位）。'
  },

  // 记谱提示
  {
    id: 'hint-read',
    symbol: '结构',
    name: '读谱提示',
    category: '记谱提示',
    keywords: ['读法', '怎么读', '结构', '提示'],
    desc: '减字谱多由“左手信息 + 右手指法 + 弦序/徽位”等部件组合而成。',
    tips: '查询时可先看右手字（勾剔抹挑等），再结合弦序与徽位理解。'
  },
  {
    id: 'hint-example',
    symbol: '示例：勾七',
    name: '示例',
    category: '记谱提示',
    keywords: ['示例', '勾七', '例子'],
    desc: '“勾七”通常可理解为：右手用“勾”法弹第七弦（具体音位仍需结合上下文）。'
  }
];

module.exports = {
  CATEGORIES,
  ITEMS
};
