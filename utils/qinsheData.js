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


const DISTRICT_MAP = {
  '北京市': ['东城区', '西城区', '朝阳区', '海淀区'],
  '天津市': ['和平区', '河西区', '南开区', '滨海新区'],
  '上海市': ['黄浦区', '徐汇区', '浦东新区', '闵行区'],
  '重庆市': ['渝中区', '江北区', '南岸区', '渝北区'],
  '石家庄市': ['长安区', '桥西区', '新华区', '裕华区'],
  '保定市': ['竞秀区', '莲池区', '满城区', '清苑区'],
  '太原市': ['小店区', '迎泽区', '杏花岭区', '万柏林区'],
  '大同市': ['平城区', '云冈区', '新荣区', '云州区'],
  '沈阳市': ['和平区', '沈河区', '皇姑区', '浑南区'],
  '大连市': ['中山区', '西岗区', '沙河口区', '甘井子区'],
  '长春市': ['南关区', '宽城区', '朝阳区', '二道区'],
  '吉林市': ['船营区', '昌邑区', '丰满区', '龙潭区'],
  '哈尔滨市': ['道里区', '道外区', '南岗区', '香坊区'],
  '齐齐哈尔市': ['龙沙区', '建华区', '铁锋区', '昂昂溪区'],
  '南京市': ['玄武区', '秦淮区', '鼓楼区', '江宁区'],
  '苏州市': ['姑苏区', '虎丘区', '吴中区', '相城区'],
  '杭州市': ['上城区', '拱墅区', '西湖区', '滨江区'],
  '宁波市': ['海曙区', '江北区', '鄞州区', '镇海区'],
  '合肥市': ['庐阳区', '蜀山区', '包河区', '瑶海区'],
  '芜湖市': ['镜湖区', '弋江区', '鸠江区', '湾沚区'],
  '福州市': ['鼓楼区', '台江区', '仓山区', '晋安区'],
  '厦门市': ['思明区', '湖里区', '集美区', '海沧区'],
  '南昌市': ['东湖区', '西湖区', '青云谱区', '红谷滩区'],
  '赣州市': ['章贡区', '南康区', '赣县区', '信丰县'],
  '济南市': ['历下区', '市中区', '槐荫区', '历城区'],
  '青岛市': ['市南区', '市北区', '崂山区', '黄岛区'],
  '郑州市': ['中原区', '二七区', '金水区', '郑东新区'],
  '洛阳市': ['西工区', '老城区', '涧西区', '洛龙区'],
  '武汉市': ['江岸区', '武昌区', '洪山区', '江汉区'],
  '宜昌市': ['西陵区', '伍家岗区', '点军区', '夷陵区'],
  '长沙市': ['芙蓉区', '天心区', '岳麓区', '开福区'],
  '岳阳市': ['岳阳楼区', '云溪区', '君山区', '华容县'],
  '广州市': ['越秀区', '天河区', '海珠区', '白云区'],
  '深圳市': ['福田区', '罗湖区', '南山区', '宝安区'],
  '海口市': ['秀英区', '龙华区', '琼山区', '美兰区'],
  '三亚市': ['海棠区', '吉阳区', '天涯区', '崖州区'],
  '成都市': ['锦江区', '青羊区', '武侯区', '高新区'],
  '绵阳市': ['涪城区', '游仙区', '安州区', '江油市'],
  '贵阳市': ['南明区', '云岩区', '花溪区', '观山湖区'],
  '遵义市': ['红花岗区', '汇川区', '播州区', '仁怀市'],
  '昆明市': ['五华区', '盘龙区', '官渡区', '西山区'],
  '大理市': ['下关街道', '太和街道', '满江街道', '大理镇'],
  '西安市': ['新城区', '碑林区', '莲湖区', '雁塔区'],
  '宝鸡市': ['渭滨区', '金台区', '陈仓区', '凤翔区'],
  '兰州市': ['城关区', '七里河区', '安宁区', '西固区'],
  '天水市': ['秦州区', '麦积区', '甘谷县', '武山县'],
  '西宁市': ['城东区', '城中区', '城西区', '城北区'],
  '海东市': ['乐都区', '平安区', '民和县', '互助县'],
  '台北市': ['中正区', '大安区', '信义区', '士林区'],
  '台中市': ['中区', '西区', '北区', '南屯区'],
  '呼和浩特市': ['新城区', '回民区', '玉泉区', '赛罕区'],
  '南宁市': ['兴宁区', '青秀区', '江南区', '西乡塘区'],
  '拉萨市': ['城关区', '堆龙德庆区', '达孜区', '林周县'],
  '银川市': ['兴庆区', '金凤区', '西夏区', '永宁县'],
  '乌鲁木齐市': ['天山区', '沙依巴克区', '新市区', '水磨沟区'],
  '香港': ['中西区', '湾仔区', '九龙城区', '沙田区'],
  '澳门': ['花地玛堂区', '圣安多尼堂区', '大堂区', '路氹填海区']
};

const QINSHE_DATA_WITH_DISTRICTS = QINSHE_DATA.map((provinceItem) => ({
  ...provinceItem,
  cities: (provinceItem.cities || []).map((cityItem) => ({
    ...cityItem,
    districts: cityItem.districts || DISTRICT_MAP[cityItem.city] || []
  }))
}));

function searchVenues(keyword) {
  const normalized = String(keyword || '').trim().toLowerCase();
  if (!normalized) return [];

  const results = [];
  QINSHE_DATA_WITH_DISTRICTS.forEach((provinceItem) => {
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
  return QINSHE_DATA_WITH_DISTRICTS.map((item) => ({
    province: item.province,
    cityCount: (item.cities || []).length,
    venueCount: (item.cities || []).reduce((sum, city) => sum + ((city.venues || []).length), 0)
  }));
}

function getCitiesByProvince(province) {
  const item = QINSHE_DATA_WITH_DISTRICTS.find(p => p.province === province);
  return item ? item.cities : [];
}

function getVenuesByProvinceAndCity(province, city) {
  const cities = getCitiesByProvince(province);
  const cityItem = cities.find(c => c.city === city);
  return cityItem ? cityItem.venues : [];
}

module.exports = {
  QINSHE_DATA: QINSHE_DATA_WITH_DISTRICTS,
  getProvinceList,
  getCitiesByProvince,
  getVenuesByProvinceAndCity,
  searchVenues
};
