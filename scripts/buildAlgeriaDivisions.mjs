import fs from 'fs';
import path from 'path';

// 58 Official Algerian Wilayas Metadata
const WILAYAS_META = [
  { code: '01', codeNumber: 1, name: 'أدرار', nameFr: 'Adrar', lat: 27.8742, lng: -0.2939, radiusKm: 40 },
  { code: '02', codeNumber: 2, name: 'الشلف', nameFr: 'Chlef', lat: 36.1652, lng: 1.3345, radiusKm: 35 },
  { code: '03', codeNumber: 3, name: 'الأغواط', nameFr: 'Laghouat', lat: 33.8000, lng: 2.8651, radiusKm: 35 },
  { code: '04', codeNumber: 4, name: 'أم البواقي', nameFr: 'Oum El Bouaghi', lat: 35.8755, lng: 7.1136, radiusKm: 35 },
  { code: '05', codeNumber: 5, name: 'باتنة', nameFr: 'Batna', lat: 35.5558, lng: 6.1741, radiusKm: 35 },
  { code: '06', codeNumber: 6, name: 'بجاية', nameFr: 'Béjaïa', lat: 36.7559, lng: 5.0843, radiusKm: 35 },
  { code: '07', codeNumber: 7, name: 'بسكرة', nameFr: 'Biskra', lat: 34.8504, lng: 5.7281, radiusKm: 35 },
  { code: '08', codeNumber: 8, name: 'بشار', nameFr: 'Béchar', lat: 31.6167, lng: -2.2167, radiusKm: 35 },
  { code: '09', codeNumber: 9, name: 'البليدة', nameFr: 'Blida', lat: 36.4702, lng: 2.8288, radiusKm: 30 },
  { code: '10', codeNumber: 10, name: 'البويرة', nameFr: 'Bouira', lat: 36.3749, lng: 3.9020, radiusKm: 35 },
  { code: '11', codeNumber: 11, name: 'تمنراست', nameFr: 'Tamanrasset', lat: 22.7850, lng: 5.5228, radiusKm: 45 },
  { code: '12', codeNumber: 12, name: 'تبسة', nameFr: 'Tébessa', lat: 35.4042, lng: 8.1242, radiusKm: 35 },
  { code: '13', codeNumber: 13, name: 'تلمسان', nameFr: 'Tlemcen', lat: 34.8828, lng: -1.3167, radiusKm: 35 },
  { code: '14', codeNumber: 14, name: 'تيارت', nameFr: 'Tiaret', lat: 35.3710, lng: 1.3170, radiusKm: 35 },
  { code: '15', codeNumber: 15, name: 'تيزي وزو', nameFr: 'Tizi Ouzou', lat: 36.7118, lng: 4.0459, radiusKm: 35 },
  { code: '16', codeNumber: 16, name: 'الجزائر العاصمة', nameFr: 'Alger', lat: 36.7538, lng: 3.0588, radiusKm: 40 },
  { code: '17', codeNumber: 17, name: 'الجلفة', nameFr: 'Djelfa', lat: 34.6728, lng: 3.2630, radiusKm: 35 },
  { code: '18', codeNumber: 18, name: 'جيجل', nameFr: 'Jijel', lat: 36.8206, lng: 5.7667, radiusKm: 35 },
  { code: '19', codeNumber: 19, name: 'سطيف', nameFr: 'Sétif', lat: 36.1911, lng: 5.4137, radiusKm: 35 },
  { code: '20', codeNumber: 20, name: 'سعيدة', nameFr: 'Saïda', lat: 34.8303, lng: 0.1517, radiusKm: 30 },
  { code: '21', codeNumber: 21, name: 'سكيكدة', nameFr: 'Skikda', lat: 36.8762, lng: 6.9092, radiusKm: 35 },
  { code: '22', codeNumber: 22, name: 'سيدي بلعباس', nameFr: 'Sidi Bel Abbès', lat: 35.1899, lng: -0.6308, radiusKm: 35 },
  { code: '23', codeNumber: 23, name: 'عنابة', nameFr: 'Annaba', lat: 36.9000, lng: 7.7667, radiusKm: 35 },
  { code: '24', codeNumber: 24, name: 'قالمة', nameFr: 'Guelma', lat: 36.4621, lng: 7.4261, radiusKm: 35 },
  { code: '25', codeNumber: 25, name: 'قسنطينة', nameFr: 'Constantine', lat: 36.3650, lng: 6.6147, radiusKm: 35 },
  { code: '26', codeNumber: 26, name: 'المدية', nameFr: 'Médéa', lat: 36.2642, lng: 2.7539, radiusKm: 35 },
  { code: '27', codeNumber: 27, name: 'مستغانم', nameFr: 'Mostaganem', lat: 35.9311, lng: 0.0892, radiusKm: 35 },
  { code: '28', codeNumber: 28, name: 'المسيلة', nameFr: 'M\'Sila', lat: 35.7058, lng: 4.5419, radiusKm: 35 },
  { code: '29', codeNumber: 29, name: 'معسكر', nameFr: 'Mascara', lat: 35.3944, lng: 0.1403, radiusKm: 35 },
  { code: '30', codeNumber: 30, name: 'ورقلة', nameFr: 'Ouargla', lat: 31.9493, lng: 5.3250, radiusKm: 40 },
  { code: '31', codeNumber: 31, name: 'وهران', nameFr: 'Oran', lat: 35.6971, lng: -0.6308, radiusKm: 40 },
  { code: '32', codeNumber: 32, name: 'البيض', nameFr: 'El Bayadh', lat: 33.6832, lng: 1.0193, radiusKm: 35 },
  { code: '33', codeNumber: 33, name: 'إليزي', nameFr: 'Illizi', lat: 26.4833, lng: 8.4667, radiusKm: 45 },
  { code: '34', codeNumber: 34, name: 'برج بوعريريج', nameFr: 'Bordj Bou Arréridj', lat: 36.0732, lng: 4.7611, radiusKm: 35 },
  { code: '35', codeNumber: 35, name: 'بومرداس', nameFr: 'Boumerdès', lat: 36.7664, lng: 3.4772, radiusKm: 30 },
  { code: '36', codeNumber: 36, name: 'الطارف', nameFr: 'El Tarf', lat: 36.7672, lng: 8.3139, radiusKm: 35 },
  { code: '37', codeNumber: 37, name: 'تندوف', nameFr: 'Tindouf', lat: 27.6711, lng: -8.1478, radiusKm: 40 },
  { code: '38', codeNumber: 38, name: 'تسمسيلت', nameFr: 'Tissemsilt', lat: 35.6072, lng: 1.8108, radiusKm: 30 },
  { code: '39', codeNumber: 39, name: 'الوادي', nameFr: 'El Oued', lat: 33.3683, lng: 6.8675, radiusKm: 35 },
  { code: '40', codeNumber: 40, name: 'خنشلة', nameFr: 'Khenchela', lat: 35.4358, lng: 7.1433, radiusKm: 35 },
  { code: '41', codeNumber: 41, name: 'سوق أهراس', nameFr: 'Souk Ahras', lat: 36.2864, lng: 7.9511, radiusKm: 35 },
  { code: '42', codeNumber: 42, name: 'تيبازة', nameFr: 'Tipaza', lat: 36.5925, lng: 2.4475, radiusKm: 35 },
  { code: '43', codeNumber: 43, name: 'ميلة', nameFr: 'Mila', lat: 36.4503, lng: 6.2644, radiusKm: 35 },
  { code: '44', codeNumber: 44, name: 'عين الدفلى', nameFr: 'Aïn Defla', lat: 36.2650, lng: 1.9686, radiusKm: 35 },
  { code: '45', codeNumber: 45, name: 'النعامة', nameFr: 'Naâma', lat: 33.2667, lng: -0.3167, radiusKm: 35 },
  { code: '46', codeNumber: 46, name: 'عين تموشنت', nameFr: 'Aïn Témouchent', lat: 35.2975, lng: -1.1403, radiusKm: 30 },
  { code: '47', codeNumber: 47, name: 'غرداية', nameFr: 'Ghardaïa', lat: 32.4909, lng: 3.6736, radiusKm: 35 },
  { code: '48', codeNumber: 48, name: 'غليزان', nameFr: 'Relizane', lat: 35.7372, lng: 0.5558, radiusKm: 35 },
  { code: '49', codeNumber: 49, name: 'تيميمون', nameFr: 'Timimoun', lat: 29.2639, lng: 0.2311, radiusKm: 40 },
  { code: '50', codeNumber: 50, name: 'برج باجي مختار', nameFr: 'Bordj Badji Mokhtar', lat: 21.3278, lng: 0.9542, radiusKm: 45 },
  { code: '51', codeNumber: 51, name: 'أولاد جلال', nameFr: 'Ouled Djellal', lat: 34.4333, lng: 5.0667, radiusKm: 35 },
  { code: '52', codeNumber: 52, name: 'بني عباس', nameFr: 'Béni Abbès', lat: 30.1333, lng: -2.1667, radiusKm: 40 },
  { code: '53', codeNumber: 53, name: 'عين صالح', nameFr: 'In Salah', lat: 27.1936, lng: 2.4608, radiusKm: 40 },
  { code: '54', codeNumber: 54, name: 'عين قزام', nameFr: 'In Guezzam', lat: 19.5722, lng: 5.7694, radiusKm: 45 },
  { code: '55', codeNumber: 55, name: 'تقرت', nameFr: 'Touggourt', lat: 33.1053, lng: 6.0581, radiusKm: 35 },
  { code: '56', codeNumber: 56, name: 'جانت', nameFr: 'Djanet', lat: 24.5531, lng: 9.4847, radiusKm: 45 },
  { code: '57', codeNumber: 57, name: 'المغير', nameFr: 'El M\'Ghair', lat: 33.9500, lng: 5.9167, radiusKm: 35 },
  { code: '58', codeNumber: 58, name: 'المنيعة', nameFr: 'El Meniaa', lat: 30.5842, lng: 2.8797, radiusKm: 35 },
];

function cleanCoord(val) {
  if (typeof val === 'number') return val;
  if (!val) return null;
  const cleaned = String(val).replace(/^[^\d.-]+/, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function normAr(s) {
  if (!s) return '';
  return s.trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[-_\s]/g, '');
}

function normFr(s) {
  if (!s) return '';
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
}

async function generate() {
  const loc = (await import('algeria-locations')).default || (await import('algeria-locations'));
  const coordsData = JSON.parse(fs.readFileSync('/tmp/communes_coords.json', 'utf8'));

  // Pre-index coordsData
  const coordsByWilayaAndArName = new Map();
  const coordsByWilayaAndFrName = new Map();
  const coordsByPostCode = new Map();
  const coordsByArName = new Map();
  const coordsByFrName = new Map();

  coordsData.forEach(c => {
    let lat = cleanCoord(c.longitude); // longitude field in dataset contains latitude
    let lng = cleanCoord(c.latitude);  // latitude field contains longitude
    if (lat < 18 || lat > 38 || lng < -9 || lng > 13) {
      let swLat = cleanCoord(c.latitude);
      let swLng = cleanCoord(c.longitude);
      if (swLat >= 18 && swLat <= 38 && swLng >= -9 && swLng <= 13) {
        lat = swLat;
        lng = swLng;
      }
    }

    const item = {
      id: c.id,
      postCode: c.post_code,
      nameFr: c.name,
      nameAr: c.ar_name,
      wilayaId: parseInt(c.wilaya_id),
      lat,
      lng
    };

    const arKey = normAr(c.ar_name);
    const frKey = normFr(c.name);

    coordsByWilayaAndArName.set(`${c.wilaya_id}_${arKey}`, item);
    coordsByWilayaAndFrName.set(`${c.wilaya_id}_${frKey}`, item);
    if (c.post_code) coordsByPostCode.set(c.post_code, item);
    if (!coordsByArName.has(arKey)) coordsByArName.set(arKey, item);
    if (!coordsByFrName.has(frKey)) coordsByFrName.set(frKey, item);
  });

  const structuredWilayas = [];
  let grandTotalDairas = 0;
  let grandTotalCommunes = 0;
  const processedCoordsIds = new Set();

  for (const meta of WILAYAS_META) {
    const locW = loc.wilayas.find(w => w.id === meta.codeNumber);
    const dairasForW = loc.dairas.filter(d => d.wilaya_id === meta.codeNumber);
    grandTotalDairas += dairasForW.length;

    const dairasStructured = [];
    let wilayaCommuneCount = 0;

    for (const d of dairasForW) {
      const communesForD = loc.communes.filter(c => c.daira_id === d.id);
      wilayaCommuneCount += communesForD.length;
      grandTotalCommunes += communesForD.length;

      const communesStructured = communesForD.map(c => {
        const arKey = normAr(c.name_ar);
        const frKey = normFr(c.name);

        const match = coordsByWilayaAndArName.get(`${meta.codeNumber}_${arKey}`) ||
                      coordsByWilayaAndFrName.get(`${meta.codeNumber}_${frKey}`) ||
                      coordsByPostCode.get(c.code) ||
                      coordsByArName.get(arKey) ||
                      coordsByFrName.get(frKey);

        if (match && match.id) {
          processedCoordsIds.add(String(match.id));
        }

        const lat = match?.lat || meta.lat;
        const lng = match?.lng || meta.lng;
        const postCode = match?.postCode || c.code;

        return {
          id: c.id,
          code: postCode,
          name: c.name,
          nameAr: c.name_ar,
          dairaName: d.name_ar,
          dairaNameFr: d.name,
          wilayaName: meta.name,
          wilayaNameFr: meta.nameFr,
          wilayaCode: meta.code,
          fullName: `بلدية ${c.name_ar} (دائرة ${d.name_ar} - ولاية ${meta.name})`,
          fullNameFr: `Commune de ${c.name} (Daïra de ${d.name} - Wilaya de ${meta.nameFr})`,
          coords: {
            lat: Math.round(lat * 1000000) / 1000000,
            lng: Math.round(lng * 1000000) / 1000000,
            name: c.name_ar,
            address: `بلدية ${c.name_ar}، دائرة ${d.name_ar}، ولاية ${meta.name}`
          }
        };
      });

      dairasStructured.push({
        id: d.id,
        code: d.code,
        name: d.name,
        nameAr: d.name_ar,
        communesCount: communesStructured.length,
        communes: communesStructured
      });
    }

    structuredWilayas.push({
      code: meta.code,
      codeNumber: meta.codeNumber,
      name: meta.name,
      nameFr: meta.nameFr,
      center: { lat: meta.lat, lng: meta.lng },
      radiusKm: meta.radiusKm,
      dairasCount: dairasStructured.length,
      communesCount: wilayaCommuneCount,
      dairas: dairasStructured
    });
  }

  // Also include any leftover communes from coordsData (if any exist) into the main wilaya daira
  let extraCommunesAdded = 0;
  coordsData.forEach(cd => {
    if (!processedCoordsIds.has(String(cd.id))) {
      const wId = parseInt(cd.wilaya_id);
      if (wId >= 1 && wId <= 58) {
        const wilaya = structuredWilayas.find(w => w.codeNumber === wId);
        if (wilaya && wilaya.dairas.length > 0) {
          const mainDaira = wilaya.dairas[0];
          let lat = cleanCoord(cd.longitude);
          let lng = cleanCoord(cd.latitude);
          if (lat < 18 || lat > 38 || lng < -9 || lng > 13) {
            lat = cleanCoord(cd.latitude) || wilaya.center.lat;
            lng = cleanCoord(cd.longitude) || wilaya.center.lng;
          }
          mainDaira.communes.push({
            id: 20000 + parseInt(cd.id),
            code: cd.post_code || `${wilaya.code}000`,
            name: cd.name,
            nameAr: cd.ar_name,
            dairaName: mainDaira.nameAr,
            dairaNameFr: mainDaira.name,
            wilayaName: wilaya.name,
            wilayaNameFr: wilaya.nameFr,
            wilayaCode: wilaya.code,
            fullName: `بلدية ${cd.ar_name} (دائرة ${mainDaira.nameAr} - ولاية ${wilaya.name})`,
            fullNameFr: `Commune de ${cd.name} (Daïra de ${mainDaira.name} - Wilaya de ${wilaya.nameFr})`,
            coords: {
              lat: Math.round(lat * 1000000) / 1000000,
              lng: Math.round(lng * 1000000) / 1000000,
              name: cd.ar_name,
              address: `بلدية ${cd.ar_name}، ولاية ${wilaya.name}`
            }
          });
          mainDaira.communesCount = mainDaira.communes.length;
          wilaya.communesCount++;
          grandTotalCommunes++;
          extraCommunesAdded++;
        }
      }
    }
  });

  const outputData = {
    metadata: {
      title: 'قاعدة بيانات التقسيم الإداري الرسمي الشامل للجمهورية الجزائرية الديمقراطية الشعبية',
      titleFr: 'Base de données officielle complète des divisions administratives de la République Algérienne',
      country: 'الجزائر - Algérie',
      countryCode: 'DZ',
      version: '2026.1',
      totalWilayas: structuredWilayas.length,
      totalDairas: grandTotalDairas,
      totalCommunes: grandTotalCommunes,
      generatedFor: 'MotoDrive Taxi & Delivery Platform'
    },
    wilayas: structuredWilayas
  };

  // Ensure directories exist
  fs.mkdirSync('src/data', { recursive: true });
  fs.mkdirSync('public/data', { recursive: true });

  const targetPathSrc = 'src/data/algeria_administrative_divisions.json';
  const targetPathPub = 'public/data/algeria_administrative_divisions.json';

  fs.writeFileSync(targetPathSrc, JSON.stringify(outputData, null, 2), 'utf8');
  fs.writeFileSync(targetPathPub, JSON.stringify(outputData, null, 2), 'utf8');

  console.log('✅ Generated JSON files successfully:');
  console.log(`- ${targetPathSrc} (${(fs.statSync(targetPathSrc).size / 1024).toFixed(1)} KB)`);
  console.log(`- ${targetPathPub} (${(fs.statSync(targetPathPub).size / 1024).toFixed(1)} KB)`);
  console.log(`- Wilayas: ${structuredWilayas.length}`);
  console.log(`- Dairas: ${grandTotalDairas}`);
  console.log(`- Total Communes: ${grandTotalCommunes}`);
  console.log(`- Extra communes merged: ${extraCommunesAdded}`);

  // Test Chlef specifically
  const chlef = structuredWilayas.find(w => w.codeNumber === 2);
  const allChlefCommunes = chlef.dairas.flatMap(d => d.communes);
  const abou = allChlefCommunes.find(c => c.nameAr.includes('أبو الحسن') || c.name.toLowerCase().includes('abou'));
  console.log('\n--- Chlef Test ---');
  console.log('Found Abou El Hassane:', abou);
  const tenes = allChlefCommunes.find(c => c.nameAr.includes('تنس') || c.name.toLowerCase().includes('tenes'));
  console.log('Found Tenes:', tenes);
}

generate().catch(err => {
  console.error('Error generating divisions:', err);
  process.exit(1);
});
