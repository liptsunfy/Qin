
Page({
  data: {
    knowledgeList: [
      { id: 1, title: '琴音阶', description: '了解琴的音阶和指法' },
      { id: 2, title: '琴调弦', description: '学习琴的调弦技巧' },
      { id: 3, title: '常见曲目', description: '一些常见的琴曲及其技巧' },
      { id: 4, title: '练习技巧', description: '提高弹奏技巧的建议' },
    ],
    activeKnowledge: null,
  },

  onLoad() {
    // 初始化时，可以加载一些默认的琴知识，或者从云数据库获取数据
    this.setData({
      activeKnowledge: this.data.knowledgeList[0] // 默认展示第一个知识点
    });
  },

  // 点击知识项时，展示具体内容
  onKnowledgeTap(e) {
    const knowledgeId = e.currentTarget.dataset.id;
    const knowledge = this.data.knowledgeList.find(item => item.id === knowledgeId);
    this.setData({
      activeKnowledge: knowledge
    });
  },
});
