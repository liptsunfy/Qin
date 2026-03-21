// 工具管理器
const ToolsManager = {
  // 所有工具定义
  allTools: [
    {
      id: 'tuner',
      name: '调音器',
      icon: '🎵',
      description: '古琴调音助手',
      enabled: true,
      version: '1.0.0',
      category: '练习工具',
      hasPage: true,
      pagePath: '/pages/tools/tuner/tuner'
    },
    {
      id: 'notation',
      name: '减字谱查询',
      icon: '📖',
      description: '常见减字谱对照表',
      enabled: true,
      version: '1.1.0',
      category: '古琴知识',
      hasPage: true,
      pagePath: '/pages/tools/notation/notation'
    },
    {
      id: 'knowledge',
      name: '琴知识',
      icon: '🎓',
      description: '古琴基础知识库',
      enabled: true,
      version: '1.0.1',
      category: '古琴知识',
      hasPage: true,
      pagePath: '/pages/tools/knowledge/knowledge'
    },
    {
      id: 'qinshe',
      name: '琴馆检索',
      icon: '🏛️',
      description: '按大区检索琴舍与琴馆信息',
      enabled: true,
      version: '0.1.0',
      category: '发现更多',
      hasPage: true,
      pagePath: '/pages/tools/qinshe/qinshe'
    },
    {
      id: 'qinshi',
      name: '琴事',
      icon: '📰',
      description: '古琴圈动态与投稿分享',
      enabled: true,
      version: '0.1.0',
      category: '发现更多',
      hasPage: true,
      pagePath: '/pages/tools/qinshi/qinshi'
    },
    {
      id: 'qinpu',
      name: '琴谱',
      icon: '🎼',
      description: '琴谱内容建设中',
      enabled: false,
      comingSoon: true,
      version: '0.1.0',
      category: '发现更多',
      hasPage: true,
      pagePath: '/pages/tools/qinpu/qinpu'
    },
    {
      id: 'metronome',
      name: '节拍器',
      icon: '🎧',
      description: '练习节拍辅助',
      enabled: true,
      version: '1.1.0',
      category: '练习工具',
      hasPage: true,
      pagePath: '/pages/tools/metronome/metronome'
    },
    {
      id: 'recorder',
      name: '录音',
      icon: '🎤',
      description: '练习录音回放',
      enabled: true,
      version: '1.1.0',
      category: '练习工具',
      hasPage: true,
      pagePath: '/pages/tools/recorder/recorder'
    },
    {
      id: 'ywt',
      name: '音位图',
      icon: '🗺️',
      description: '古琴音位图参考',
      enabled: false,
      version: '0.1.0',
      category: '练习工具',
      hasPage: true,
      pagePath: '/pages/tools/ywt/ywt'
    }
  ],

  // 按分类获取工具
  getToolsByCategory() {
    const categories = {};
    
    this.allTools.forEach(tool => {
      if (!categories[tool.category]) {
        categories[tool.category] = [];
      }
      categories[tool.category].push(tool);
    });
    
    return categories;
  },

  // 获取已启用的工具
  getEnabledTools() {
    return this.allTools.filter(tool => tool.enabled);
  },

  // 根据ID获取工具
  getToolById(id) {
    return this.allTools.find(tool => tool.id === id);
  },

  // 搜索工具
  searchTools(keyword) {
    return this.allTools.filter(tool => 
      tool.name.includes(keyword) || 
      tool.description.includes(keyword) ||
      tool.category.includes(keyword)
    );
  },

  // 获取工具统计
  getToolsStats() {
    const total = this.allTools.length;
    const enabled = this.allTools.filter(t => t.enabled).length;
    const hasPage = this.allTools.filter(t => t.hasPage).length;
    
    return {
      total,
      enabled,
      hasPage,
      enabledPercentage: Math.round((enabled / total) * 100)
    };
  }
};

module.exports = ToolsManager;
