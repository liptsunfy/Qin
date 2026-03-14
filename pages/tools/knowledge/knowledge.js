Page({
  data: {
    knowledgeList: [
      {
        id: 1,
        title: '音阶与定弦',
        description: '识别正调与常用调式，掌握定弦步骤',
        tag: '基础',
        sections: [
          {
            title: '常用定弦',
            items: ['正调：五六一二三五六（C调）', '慢角：一二三五六一二', '蕤宾：二三五六一二三']
          },
          {
            title: '定弦流程',
            items: ['先松后紧，逐根校准', '用泛音校对五度关系', '定弦后再回到一弦复核']
          }
        ],
        tips: ['定弦时保持环境安静，避免共振干扰。']
      },
      {
        id: 2,
        title: '右手指法',
        description: '勾、剔、抹、挑、打圆等要点',
        tag: '技巧',
        sections: [
          {
            title: '基本指法',
            items: ['勾：中指向外拨弦', '剔：食指向外拨弦', '抹：无名指向内拨弦', '挑：大指向内拨弦']
          },
          {
            title: '连贯练习',
            items: ['勾剔抹挑四连音', '左右手分离，节拍器慢速练']
          }
        ],
        tips: ['指尖触弦位置保持在徽外一指宽。']
      },
      {
        id: 3,
        title: '左手按音',
        description: '吟、猱、绰、注与按音稳定',
        tag: '技巧',
        sections: [
          {
            title: '基本要求',
            items: ['按音落点精准，对准徽位', '手腕放松，避免挤压弦线']
          },
          {
            title: '常见装饰',
            items: ['吟：小幅左右摆动', '猱：大幅度滑动', '绰注：上滑后回落']
          }
        ],
        tips: ['装饰音以“轻、圆、连”为原则。']
      },
      {
        id: 4,
        title: '减字谱入门',
        description: '读谱规则与节奏理解',
        tag: '读谱',
        sections: [
          {
            title: '符号结构',
            items: ['右手指法 + 左手弦位 + 动作符号', '先读右手，再看左手位置']
          },
          {
            title: '节奏处理',
            items: ['以板眼为基础分句', '先哼唱再入手']
          }
        ],
        tips: ['初学建议配合谱例录音对照。']
      },
      {
        id: 5,
        title: '常见曲目',
        description: '入门曲目与学习目标',
        tag: '曲目',
        sections: [
          {
            title: '入门推荐',
            items: ['《仙翁操》：练指法稳定', '《关山月》：练旋律表达', '《酒狂》：练节奏转换']
          },
          {
            title: '进阶方向',
            items: ['《平沙落雁》：音色层次', '《梅花三弄》：泛音与按音']
          }
        ],
        tips: ['曲目学习建议先拆句，再合段。']
      },
      {
        id: 6,
        title: '养护与保养',
        description: '琴体保护与日常维护',
        tag: '养护',
        sections: [
          {
            title: '环境',
            items: ['湿度保持 45%-65%', '避免阳光直射与空调直吹']
          },
          {
            title: '日常维护',
            items: ['弹后擦拭指印', '弦松紧适度，长时间不弹可略放松']
          }
        ],
        tips: ['使用软布清洁，不建议用化学溶剂。']
      }
    ],
    activeKnowledge: null,
  },

  onLoad() {
    this.setData({
      activeKnowledge: this.data.knowledgeList[0]
    });
  },

  onKnowledgeTap(e) {
    const knowledgeId = e.currentTarget.dataset.id;
    const knowledge = this.data.knowledgeList.find(item => item.id === knowledgeId);
    this.setData({
      activeKnowledge: knowledge
    });
  },
});
