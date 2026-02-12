/**
 * 曲目统计相关的纯函数抽取。
 * 目标：不改变业务逻辑/交互，仅降低 pages/profile/profile.js 的体积与复杂度。
 */

/**
 * 统计每个曲目的练习情况，并按次数/总时长排序，补充百分比等字段。
 * @param {Array<any>} records
 * @returns {Array<any>}
 */
function computeSongStats(records) {
  const songMap = {};

  records.forEach(record => {
    const songName = record.song || '未命名曲目';

    if (!songMap[songName]) {
      songMap[songName] = {
        name: songName,
        count: 0,
        totalDuration: 0,
        firstDate: record.date,
        lastDate: record.date,
        records: []
      };
    }

    songMap[songName].count += (record.repeatCount || 1);
    songMap[songName].totalDuration += record.duration || 0;

    if (record.date < songMap[songName].firstDate) {
      songMap[songName].firstDate = record.date;
    }
    if (record.date > songMap[songName].lastDate) {
      songMap[songName].lastDate = record.date;
    }

    songMap[songName].records.push(record);
  });

  // 转换为数组并排序
  let songStats = Object.values(songMap);

  // 按练习次数降序排序；次数相同再按总时长降序
  songStats.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.totalDuration - a.totalDuration;
  });

  // 计算百分比和补充统计信息
  const totalRecords = records.reduce((sum, record) => sum + (record.repeatCount || 1), 0);
  songStats = songStats.map((song, idx) => {
    const percentage = totalRecords > 0 ? Math.round((song.count / totalRecords) * 100) : 0;
    const totalHours = Math.round((song.totalDuration / 60) * 10) / 10;
    const avgDuration = song.count > 0 ? Math.round(song.totalDuration / song.count) : 0;

    return {
      ...song,
      percentage,
      totalHours,
      avgDuration,
      rank: idx + 1
    };
  });

  return songStats;
}

/**
 * 用于 wx.showModal 的练习记录字符串（保持原实现：最多展示前 10 条）。
 * @param {Array<any>} records
 * @returns {string}
 */
function formatSongRecordsContent(records) {
  if (!records || records.length === 0) return '暂无记录';

  const totalSessions = records.reduce((sum, record) => sum + (record.repeatCount || 1), 0);
  let content = `共${totalSessions}次练习：\n\n`;

  const max = Math.min(records.length, 10);
  for (let i = 0; i < max; i++) {
    const r = records[i];
    const duration = r.duration || 0;
    const repeatText = (r.repeatCount || 1) > 1 ? ` ×${r.repeatCount}` : '';
    const notes = r.notes ? `（${r.notes}）` : '';
    content += `${r.date}  ${duration}分钟${repeatText}${notes}\n`;
  }

  if (records.length > 10) {
    content += `\n...还有${records.length - 10}条记录未显示`;
  }

  return content;
}

module.exports = {
  computeSongStats,
  formatSongRecordsContent
};
