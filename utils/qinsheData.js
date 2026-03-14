const QINSHE_DATA = [
  { province: '北京市', cities: [{ city: '北京市', venues: [{ name: '京华琴馆', contact: '示例电话（请以官方发布为准）', intro: '以传统古琴启蒙与雅集为主。', link: 'https://example.com/venues/jinghua' }] }] },
  { province: '天津市', cities: [{ city: '天津市', venues: [{ name: '津门琴舍', contact: '示例电话（请以官方发布为准）', intro: '兼顾成人与少儿古琴课程。', link: 'https://example.com/venues/jinmen' }] }] },
  { province: '上海市', cities: [{ city: '上海市', venues: [{ name: '海上听琴馆', contact: '示例电话（请以官方发布为准）', intro: '古琴教学与艺术沙龙并行。', link: 'https://example.com/venues/haishang' }] }] },
  { province: '重庆市', cities: [{ city: '重庆市', venues: [{ name: '山城琴馆', contact: '示例电话（请以官方发布为准）', intro: '山城古琴文化推广与课程教学。', link: 'https://example.com/venues/shancheng' }] }] },

  { province: '河北省', cities: [
    { city: '石家庄市', venues: [{ name: '燕赵清音琴馆', contact: '示例电话（请以官方发布为准）', intro: '提供古琴基础、进阶与斫琴体验。', link: 'https://example.com/venues/yanzhao' }] },
    { city: '保定市', venues: [{ name: '保定琴社', contact: '示例电话（请以官方发布为准）', intro: '古琴入门与进阶课程。', link: 'https://example.com/venues/baoding' }] }
  ] },
  { province: '山西省', cities: [
    { city: '太原市', venues: [{ name: '晋阳琴社', contact: '示例电话（请以官方发布为准）', intro: '传统琴曲研习与打谱交流。', link: 'https://example.com/venues/jinyang' }] },
    { city: '大同市', venues: [{ name: '云冈琴馆', contact: '示例电话（请以官方发布为准）', intro: '以古琴文化普及为主。', link: 'https://example.com/venues/yungang' }] }
  ] },
  { province: '辽宁省', cities: [
    { city: '沈阳市', venues: [{ name: '盛京琴庐', contact: '示例电话（请以官方发布为准）', intro: '注重基础指法与吟猱训练。', link: 'https://example.com/venues/shengjing' }] },
    { city: '大连市', venues: [{ name: '滨城琴舍', contact: '示例电话（请以官方发布为准）', intro: '常设雅集与公开课。', link: 'https://example.com/venues/bincheng' }] }
  ] },
  { province: '吉林省', cities: [
    { city: '长春市', venues: [{ name: '北国琴馆', contact: '示例电话（请以官方发布为准）', intro: '定期举办古琴讲座。', link: 'https://example.com/venues/beiguo' }] },
    { city: '吉林市', venues: [{ name: '松江琴社', contact: '示例电话（请以官方发布为准）', intro: '古琴曲目精修课程。', link: 'https://example.com/venues/songjiang' }] }
  ] },
  { province: '黑龙江省', cities: [
    { city: '哈尔滨市', venues: [{ name: '松花江琴社', contact: '示例电话（请以官方发布为准）', intro: '主打传统曲目与合奏排练。', link: 'https://example.com/venues/songhua' }] },
    { city: '齐齐哈尔市', venues: [{ name: '鹤城琴馆', contact: '示例电话（请以官方发布为准）', intro: '成人古琴兴趣班。', link: 'https://example.com/venues/hecheng' }] }
  ] },
  { province: '江苏省', cities: [
    { city: '南京市', venues: [{ name: '金陵琴院', contact: '示例电话（请以官方发布为准）', intro: '传统师承体系与考级辅导。', link: 'https://example.com/venues/jinling' }] },
    { city: '苏州市', venues: [{ name: '姑苏琴馆', contact: '示例电话（请以官方发布为准）', intro: '琴歌与古琴并修。', link: 'https://example.com/venues/gusu' }] }
  ] },
  { province: '浙江省', cities: [
    { city: '杭州市', venues: [{ name: '西湖琴舍', contact: '示例电话（请以官方发布为准）', intro: '古琴、香道、茶会融合活动。', link: 'https://example.com/venues/xihu' }] },
    { city: '宁波市', venues: [{ name: '甬城琴社', contact: '示例电话（请以官方发布为准）', intro: '古琴基础与雅集。', link: 'https://example.com/venues/yongcheng' }] }
  ] },
  { province: '安徽省', cities: [
    { city: '合肥市', venues: [{ name: '庐州琴馆', contact: '示例电话（请以官方发布为准）', intro: '古琴启蒙与兴趣班。', link: 'https://example.com/venues/luzhou' }] },
    { city: '芜湖市', venues: [{ name: '皖江琴舍', contact: '示例电话（请以官方发布为准）', intro: '青年学员古琴训练。', link: 'https://example.com/venues/wanjiang' }] }
  ] },
  { province: '福建省', cities: [
    { city: '福州市', venues: [{ name: '闽都琴社', contact: '示例电话（请以官方发布为准）', intro: '文人琴歌与经典曲目讲解。', link: 'https://example.com/venues/mindu' }] },
    { city: '厦门市', venues: [{ name: '鹭岛琴馆', contact: '示例电话（请以官方发布为准）', intro: '常规课程与短训班。', link: 'https://example.com/venues/ludao' }] }
  ] },
  { province: '江西省', cities: [
    { city: '南昌市', venues: [{ name: '豫章琴院', contact: '示例电话（请以官方发布为准）', intro: '古琴与传统文化课程并设。', link: 'https://example.com/venues/yuzhang' }] },
    { city: '赣州市', venues: [{ name: '赣南琴舍', contact: '示例电话（请以官方发布为准）', intro: '古琴基础与进阶教学。', link: 'https://example.com/venues/gannan' }] }
  ] },
  { province: '山东省', cities: [
    { city: '济南市', venues: [{ name: '泉城琴馆', contact: '示例电话（请以官方发布为准）', intro: '注重实操演练与舞台展示。', link: 'https://example.com/venues/quancheng' }] },
    { city: '青岛市', venues: [{ name: '琴海雅舍', contact: '示例电话（请以官方发布为准）', intro: '海滨城市古琴文化沙龙。', link: 'https://example.com/venues/qinhai' }] }
  ] },
  { province: '河南省', cities: [
    { city: '郑州市', venues: [{ name: '中州琴舍', contact: '示例电话（请以官方发布为准）', intro: '初阶到高阶系统课程。', link: 'https://example.com/venues/zhongzhou' }] },
    { city: '洛阳市', venues: [{ name: '洛邑琴馆', contact: '示例电话（请以官方发布为准）', intro: '古琴与传统文化结合教学。', link: 'https://example.com/venues/luoyi' }] }
  ] },
  { province: '湖北省', cities: [
    { city: '武汉市', venues: [{ name: '江城琴社', contact: '示例电话（请以官方发布为准）', intro: '琴曲赏析与打谱交流。', link: 'https://example.com/venues/jiangcheng' }] },
    { city: '宜昌市', venues: [{ name: '峡江琴馆', contact: '示例电话（请以官方发布为准）', intro: '古琴入门及雅集。', link: 'https://example.com/venues/xiajiang' }] }
  ] },
  { province: '湖南省', cities: [
    { city: '长沙市', venues: [{ name: '潇湘琴馆', contact: '示例电话（请以官方发布为准）', intro: '常设古琴公开课与雅集活动。', link: 'https://example.com/venues/xiaoxiang' }] },
    { city: '岳阳市', venues: [{ name: '洞庭琴社', contact: '示例电话（请以官方发布为准）', intro: '古琴初中级课程。', link: 'https://example.com/venues/dongting' }] }
  ] },
  { province: '广东省', cities: [
    { city: '广州市', venues: [{ name: '岭南琴院', contact: '示例电话（请以官方发布为准）', intro: '岭南文化与古琴融合教学。', link: 'https://example.com/venues/lingnan' }] },
    { city: '深圳市', venues: [{ name: '鹏城琴舍', contact: '示例电话（请以官方发布为准）', intro: '上班族晚间古琴课程。', link: 'https://example.com/venues/pengcheng' }] }
  ] },
  { province: '海南省', cities: [
    { city: '海口市', venues: [{ name: '琼州琴舍', contact: '示例电话（请以官方发布为准）', intro: '度假短训与常规班。', link: 'https://example.com/venues/qiongzhou' }] },
    { city: '三亚市', venues: [{ name: '南海琴馆', contact: '示例电话（请以官方发布为准）', intro: '古琴文化体验课程。', link: 'https://example.com/venues/nanhai' }] }
  ] },
  { province: '四川省', cities: [
    { city: '成都市', venues: [{ name: '蜀韵琴社', contact: '示例电话（请以官方发布为准）', intro: '古琴与琴歌课程并重。', link: 'https://example.com/venues/shuyun' }] },
    { city: '绵阳市', venues: [{ name: '绵州琴馆', contact: '示例电话（请以官方发布为准）', intro: '古琴入门与演奏训练。', link: 'https://example.com/venues/mianzhou' }] }
  ] },
  { province: '贵州省', cities: [
    { city: '贵阳市', venues: [{ name: '黔音琴馆', contact: '示例电话（请以官方发布为准）', intro: '少儿与成人课程均有设置。', link: 'https://example.com/venues/qianyin' }] },
    { city: '遵义市', venues: [{ name: '遵义琴社', contact: '示例电话（请以官方发布为准）', intro: '古琴基础课程。', link: 'https://example.com/venues/zunyi' }] }
  ] },
  { province: '云南省', cities: [
    { city: '昆明市', venues: [{ name: '滇池琴舍', contact: '示例电话（请以官方发布为准）', intro: '强调传统审美与乐理基础。', link: 'https://example.com/venues/dianchi' }] },
    { city: '大理市', venues: [{ name: '苍洱琴馆', contact: '示例电话（请以官方发布为准）', intro: '古琴与在地文化交流。', link: 'https://example.com/venues/canger' }] }
  ] },
  { province: '陕西省', cities: [
    { city: '西安市', venues: [{ name: '长安琴馆', contact: '示例电话（请以官方发布为准）', intro: '传统琴曲与舞台实践课程。', link: 'https://example.com/venues/changan' }] },
    { city: '宝鸡市', venues: [{ name: '宝鸡琴舍', contact: '示例电话（请以官方发布为准）', intro: '古琴启蒙与提高课程。', link: 'https://example.com/venues/baoji' }] }
  ] },
  { province: '甘肃省', cities: [
    { city: '兰州市', venues: [{ name: '金城琴舍', contact: '示例电话（请以官方发布为准）', intro: '古琴启蒙与基本功训练。', link: 'https://example.com/venues/jincheng' }] },
    { city: '天水市', venues: [{ name: '陇上琴馆', contact: '示例电话（请以官方发布为准）', intro: '古琴传统曲目课程。', link: 'https://example.com/venues/longshang' }] }
  ] },
  { province: '青海省', cities: [
    { city: '西宁市', venues: [{ name: '青海湖琴馆', contact: '示例电话（请以官方发布为准）', intro: '公益讲座和入门课见长。', link: 'https://example.com/venues/qinghaihu' }] },
    { city: '海东市', venues: [{ name: '海东琴社', contact: '示例电话（请以官方发布为准）', intro: '古琴基础与雅集。', link: 'https://example.com/venues/haidong' }] }
  ] },
  { province: '台湾地区', cities: [
    { city: '台北市', venues: [{ name: '台北琴院', contact: '示例电话（请以官方发布为准）', intro: '传统曲目与师承教学。', link: 'https://example.com/venues/taipei' }] },
    { city: '台中市', venues: [{ name: '台中古琴社', contact: '示例电话（请以官方发布为准）', intro: '古琴兴趣与进阶课程。', link: 'https://example.com/venues/taichung' }] }
  ] },

  { province: '内蒙古自治区', cities: [{ city: '呼和浩特市', venues: [{ name: '青城琴馆', contact: '示例电话（请以官方发布为准）', intro: '古琴与传统礼乐课程。', link: 'https://example.com/venues/qingcheng' }] }] },
  { province: '广西壮族自治区', cities: [{ city: '南宁市', venues: [{ name: '邕城琴馆', contact: '示例电话（请以官方发布为准）', intro: '古琴基础课程与演奏训练。', link: 'https://example.com/venues/yongcheng' }] }] },
  { province: '西藏自治区', cities: [{ city: '拉萨市', venues: [{ name: '雪域琴社', contact: '示例电话（请以官方发布为准）', intro: '组织小型雅集与曲目共学。', link: 'https://example.com/venues/xueyu' }] }] },
  { province: '宁夏回族自治区', cities: [{ city: '银川市', venues: [{ name: '塞上琴社', contact: '示例电话（请以官方发布为准）', intro: '古琴体验与系统课程。', link: 'https://example.com/venues/saishang' }] }] },
  { province: '新疆维吾尔自治区', cities: [{ city: '乌鲁木齐市', venues: [{ name: '天山琴馆', contact: '示例电话（请以官方发布为准）', intro: '不同基础学员分层教学。', link: 'https://example.com/venues/tianshan' }] }] },

  { province: '香港特别行政区', cities: [{ city: '香港', venues: [{ name: '香江琴舍', contact: '示例电话（请以官方发布为准）', intro: '古琴课程与文化交流并重。', link: 'https://example.com/venues/hk' }] }] },
  { province: '澳门特别行政区', cities: [{ city: '澳门', venues: [{ name: '濠江琴馆', contact: '示例电话（请以官方发布为准）', intro: '提供古琴基础与雅集活动。', link: 'https://example.com/venues/macau' }] }] }
];



function searchVenues(keyword) {
  const normalized = String(keyword || '').trim().toLowerCase();
  if (!normalized) return [];

  const results = [];
  QINSHE_DATA.forEach((provinceItem) => {
    const province = provinceItem.province;
    (provinceItem.cities || []).forEach((cityItem) => {
      const city = cityItem.city;
      (cityItem.venues || []).forEach((venue) => {
        const venueName = venue.name || '';
        if (
          province.toLowerCase().includes(normalized)
          || city.toLowerCase().includes(normalized)
          || venueName.toLowerCase().includes(normalized)
        ) {
          results.push({
            province,
            city,
            venueName,
            contact: venue.contact,
            intro: venue.intro,
            link: venue.link
          });
        }
      });
    });
  });
  return results;
}

function getProvinceList() {
  return QINSHE_DATA.map(item => ({ province: item.province, cityCount: (item.cities || []).length }));
}

function getCitiesByProvince(province) {
  const item = QINSHE_DATA.find(p => p.province === province);
  return item ? item.cities : [];
}

function getVenuesByProvinceAndCity(province, city) {
  const cities = getCitiesByProvince(province);
  const cityItem = cities.find(c => c.city === city);
  return cityItem ? cityItem.venues : [];
}

module.exports = {
  QINSHE_DATA,
  getProvinceList,
  getCitiesByProvince,
  getVenuesByProvinceAndCity,
  searchVenues
};
