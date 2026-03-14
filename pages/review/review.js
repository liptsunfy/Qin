const storage = require('../../utils/storage.js');
const DateUtil = require('../../utils/dateUtil.js');

const { CheckinManager } = storage;

function pad2(n){return n.toString().padStart(2,'0');}

function getMonthRange(dateStr){
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth()+1;
  const start = `${y}-${pad2(m)}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${pad2(m)}-${pad2(lastDay)}`;
  return { y, m, start, end, daysInRange: lastDay };
}

function getWeekRange(dateStr){
  const d = new Date(dateStr);
  const weekDates = DateUtil.getWeekDates(d); // 周一到周日
  const start = weekDates[0];
  const end = weekDates[6];
  return { start, end, daysInRange: 7 };
}

function aggregateTopSongs(records, limit=5){
  const map = {};
  records.forEach(r=>{
    const name = (r.song || '').trim() || '未命名曲目';
    if(!map[name]) map[name] = { name, count:0, totalMinutes:0 };
    map[name].count += (r.repeatCount || 1);
    map[name].totalMinutes += (r.duration || 0);
  });
  return Object.values(map)
    .sort((a,b)=> (b.totalMinutes - a.totalMinutes) || (b.count-a.count))
    .slice(0, limit);
}

Page({
  data: {
    mode: 'week',
    titleText: '本周习练回顾',
    rangeText: '',
    startDate: '',
    endDate: '',
    totalMinutes: 0,
    totalHours: 0,
    practiceDays: 0,
    totalRecords: 0,
    avgMinutes: 0,
    topSongs: []
  },

  onLoad(options){
    const mode = options && options.mode ? options.mode : 'week';
    this.setData({ mode });
    this.refresh();
  },

  onShow(){
    // 数据可能在其它页更新
    this.refresh();
  },

  switchToWeek(){
    if(this.data.mode === 'week') return;
    this.setData({ mode: 'week' });
    this.refresh();
  },

  switchToMonth(){
    if(this.data.mode === 'month') return;
    this.setData({ mode: 'month' });
    this.refresh();
  },

  refresh(){
    const today = DateUtil.getToday();
    let startDate='', endDate='', daysInRange=0, titleText='';
    if(this.data.mode === 'month'){
      const r = getMonthRange(today);
      startDate = r.start; endDate = r.end; daysInRange = r.daysInRange;
      titleText = '本月习练回顾';
    }else{
      const r = getWeekRange(today);
      startDate = r.start; endDate = r.end; daysInRange = r.daysInRange;
      titleText = '本周习练回顾';
    }

    const records = CheckinManager.getRecordsByRange(startDate, endDate);
    const totalMinutes = records.reduce((sum,r)=>sum+(r.duration||0),0);
    const totalHours = Math.round((totalMinutes/60)*10)/10;

    const dateSet = new Set(records.map(r=>r.date));
    const practiceDays = dateSet.size;
    const totalRecords = records.reduce((sum, r) => sum + (r.repeatCount || 1), 0);
    const avgMinutes = daysInRange>0 ? Math.round((totalMinutes/daysInRange)) : 0;

    const topSongs = aggregateTopSongs(records, 6);

    const rangeText = `${startDate} ~ ${endDate}`;

    this.setData({
      titleText,
      rangeText,
      startDate,
      endDate,
      totalMinutes,
      totalHours,
      practiceDays,
      totalRecords,
      avgMinutes,
      topSongs
    });
  }
});
