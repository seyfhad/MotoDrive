const fs = require('fs');

const hierarchy = JSON.parse(fs.readFileSync('/tmp/wilaya_daira_commune.json', 'utf8'));
const coords = JSON.parse(fs.readFileSync('/tmp/communes_coords.json', 'utf8'));

const wilayasDataContent = fs.readFileSync('./src/data/wilayasData.ts', 'utf8');
const wilayasDataMatch = wilayasDataContent.match(/export const ALL_58_WILAYAS: WilayaInfo\[\] = (\[[\s\S]*?\]);/);
const existingWilayas = eval(wilayasDataMatch[1]);
const wilayaCenterMap = new Map();
existingWilayas.forEach(w => wilayaCenterMap.set(w.codeNumber, w));

const map59to58 = {
  59: 3, 60: 5, 61: 7, 62: 12, 63: 13, 64: 14, 65: 17, 66: 17, 67: 26, 68: 28, 69: 32
};
const oldParentWilaya = {
  49: 1, 50: 1, 51: 7, 52: 8, 53: 11, 54: 11, 55: 30, 56: 33, 57: 39, 58: 47
};

function cleanCoord(val) {
  if (typeof val === 'number') return val;
  if (!val) return null;
  const cleaned = String(val).replace(/^[,\s]+/, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function normAr(s) {
  if (!s) return '';
  return s.trim()
    .replace(/ـ/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ڨگ]/g, 'ق')
    .replace(/[ذظ]/g, 'د')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[\s\-_']/g, '');
}

function normEn(s) {
  if (!s) return '';
  return s.toLowerCase().trim()
    .replace(/[éèêë]/g, 'e')
    .replace(/[àâ]/g, 'a')
    .replace(/[ïî]/g, 'i')
    .replace(/[ôö]/g, 'o')
    .replace(/[ùûü]/g, 'u')
    .replace(/[\s\-_']/g, '');
}

function similarity(s1, s2) {
  let longer = s1.toLowerCase();
  let shorter = s2.toLowerCase();
  if (longer.length < shorter.length) {
    let tmp = longer; longer = shorter; shorter = tmp;
  }
  let longerLength = longer.length;
  if (longerLength === 0) return 1.0;
  let costs = [];
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (longer.charAt(i - 1) !== shorter.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[shorter.length] = lastValue;
  }
  return (longerLength - costs[shorter.length]) / longerLength;
}

const specialCoords = {
  'Djebilet Rosfa': { lat: 34.7833, lng: 1.0833, post_code: '14028' },
  'جبيلات الرصفاء': { lat: 34.7833, lng: 1.0833, post_code: '14028' },
  'Abdelkader Azil': { lat: 35.323352, lng: 4.6952399, post_code: '05015' },
  'عبد القادر عزيز': { lat: 35.323352, lng: 4.6952399, post_code: '05015' }
};

let globalCommuneId = 1;
let globalDairaId = 1;

const wilayas58 = [];
for (let code = 1; code <= 58; code++) {
  const hWilaya = hierarchy.find(h => h.code === code);
  const centerInfo = wilayaCenterMap.get(code);
  wilayas58.push({
    code: String(code).padStart(2, '0'),
    codeNumber: code,
    name: centerInfo ? centerInfo.name : (hWilaya ? hWilaya.arabic : ''),
    nameFr: centerInfo ? centerInfo.nameFr : (hWilaya ? hWilaya.ascii : ''),
    center: centerInfo ? centerInfo.center : { lat: 36.7538, lng: 3.0588 },
    radiusKm: centerInfo ? centerInfo.radiusKm : 30,
    dairasCount: 0,
    communesCount: 0,
    dairas: []
  });
}

hierarchy.forEach(hw => {
  const targetCode = map59to58[hw.code] || hw.code;
  const wObj = wilayas58.find(w => w.codeNumber === targetCode);
  if (!wObj) return;

  const searchWilayaIds = [hw.code, targetCode, oldParentWilaya[hw.code], oldParentWilaya[targetCode]].filter(Boolean);
  const pool = coords.filter(co => searchWilayaIds.includes(parseInt(co.wilaya_id)));

  hw.dairas.forEach(d => {
    let dairaObj = wObj.dairas.find(od => normAr(od.nameAr) === normAr(d.arabic) || normEn(od.name) === normEn(d.ascii));
    if (!dairaObj) {
      dairaObj = {
        id: globalDairaId++,
        code: wObj.code + '-' + String(wObj.dairas.length + 1).padStart(2, '0'),
        name: d.ascii,
        nameAr: d.arabic,
        communesCount: 0,
        communes: []
      };
      wObj.dairas.push(dairaObj);
    }

    d.communes.forEach(c => {
      const cAr = normAr(c.arabic);
      const cEn = normEn(c.ascii);

      let lat = null;
      let lng = null;
      let post_code = '';

      if (specialCoords[c.ascii] || specialCoords[c.arabic]) {
        const sc = specialCoords[c.ascii] || specialCoords[c.arabic];
        lat = sc.lat;
        lng = sc.lng;
        post_code = sc.post_code;
      } else {
        let best = null;
        let bestScore = 0;

        for (const co of pool) {
          const coAr = normAr(co.ar_name);
          const coEn = normEn(co.name);
          if (coAr === cAr || coEn === cEn || coAr.includes(cAr) || cAr.includes(coAr) || coEn.includes(cEn) || cEn.includes(coEn)) {
            best = co;
            bestScore = 2.0;
            break;
          }
        }

        if (!best) {
          for (const co of pool) {
            const coAr = normAr(co.ar_name);
            const coEn = normEn(co.name);
            const maxS = Math.max(similarity(coAr, cAr), similarity(coEn, cEn));
            if (maxS > bestScore && maxS >= 0.50) {
              bestScore = maxS;
              best = co;
            }
          }
        }

        if (!best) {
          for (const co of coords) {
            const coAr = normAr(co.ar_name);
            const coEn = normEn(co.name);
            if (coAr === cAr || coEn === cEn) {
              best = co;
              break;
            }
          }
        }

        if (best) {
          lat = cleanCoord(best.longitude);
          lng = cleanCoord(best.latitude);
          post_code = best.post_code || '';
        }
      }

      if (!lat || !lng) {
        lat = wObj.center.lat;
        lng = wObj.center.lng;
      }

      const communeItem = {
        id: globalCommuneId++,
        code: post_code || (wObj.code + String(dairaObj.communes.length + 1).padStart(3, '0')),
        name: c.ascii,
        nameAr: c.arabic,
        dairaName: dairaObj.nameAr,
        dairaNameFr: dairaObj.name,
        wilayaName: wObj.name,
        wilayaNameFr: wObj.nameFr,
        wilayaCode: wObj.code,
        fullName: 'بلدية ' + c.arabic + ' - دائرة ' + dairaObj.nameAr + ' - ولاية ' + wObj.name,
        fullNameFr: 'Commune de ' + c.ascii + ' - Daïra de ' + dairaObj.name + ' - Wilaya de ' + wObj.nameFr,
        coords: {
          lat: lat,
          lng: lng,
          name: c.arabic,
          address: c.arabic + '، دائرة ' + dairaObj.nameAr + '، ولاية ' + wObj.name
        }
      };

      dairaObj.communes.push(communeItem);
    });
  });
});

let totalWilayas = wilayas58.length;
let totalDairas = 0;
let totalCommunes = 0;

wilayas58.forEach(w => {
  w.dairasCount = w.dairas.length;
  let wCommunes = 0;
  w.dairas.forEach(d => {
    d.communesCount = d.communes.length;
    wCommunes += d.communes.length;
    totalCommunes += d.communes.length;
  });
  w.communesCount = wCommunes;
  totalDairas += w.dairasCount;
});

const finalDataset = {
  metadata: {
    title: 'التقسيم الإداري الكامل للجمهورية الجزائرية الديمقراطية الشعبية',
    titleFr: 'Divisions Administratives Complètes de l Algérie',
    country: 'الجزائر',
    countryCode: 'DZ',
    version: '2026.1',
    totalWilayas: totalWilayas,
    totalDairas: totalDairas,
    totalCommunes: totalCommunes,
    generatedFor: 'MotoDrive Algerie'
  },
  wilayas: wilayas58
};

fs.mkdirSync('./public/data', { recursive: true });
fs.writeFileSync('./src/data/algeria_administrative_divisions.json', JSON.stringify(finalDataset, null, 2), 'utf8');
fs.writeFileSync('./public/data/algeria_administrative_divisions.json', JSON.stringify(finalDataset, null, 2), 'utf8');
console.log('Successfully written complete JSON file!');
console.log('Wilayas:', totalWilayas, 'Dairas:', totalDairas, 'Communes:', totalCommunes);
