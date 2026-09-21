import { Coordinates } from '../types';
import { ALL_WILAYAS_COMPREHENSIVE_PLACES } from './allWilayasPlaces';
import { ALL_58_WILAYAS, WILAYA_NAMES, findNearestAlgerianWilaya, WilayaInfo } from './wilayasData';

export { ALL_58_WILAYAS, WILAYA_NAMES, findNearestAlgerianWilaya };
export type { WilayaInfo };

export interface AlgeriaLocationItem {
  id: string;
  name: string;
  nameFr?: string;
  wilaya: string;
  wilayaCode?: string;
  type?: 'city' | 'municipality' | 'landmark' | 'university' | 'hospital' | 'station' | 'hotspot' | 'market';
  coords: Coordinates;
  aliases?: string[];
}

export const FEATURED_WILAYAS = [
  'الكل',
  'قالمة',
  'الجزائر العاصمة',
  'قسنطينة',
  'عنابة',
  'سطيف',
  'وهران',
  'البليدة',
  'باتنة',
  'بجاية',
  'تيزي وزو',
  'سكيكدة',
  'سوق أهراس',
  'الطارف',
];

const BASE_LOCATIONS: AlgeriaLocationItem[] = [
  // ==========================================
  // 📍 ولاية قالمة (Guelma - 24) - تغطية شاملة ودقيقة
  // ==========================================
  {
    id: 'guelma-centre',
    name: 'قالمة وسط المدينة (Guelma Centre-ville)',
    nameFr: 'Guelma Centre',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'city',
    coords: { lat: 36.4621, lng: 7.4261, name: 'قالمة وسط المدينة', address: 'وسط مدينة قالمة' },
    aliases: ['قالمة', 'وسط قالمة', 'guelma', 'ville de guelma'],
  },
  {
    id: 'guelma-place-1er-novembre',
    name: 'ساحة أول نوفمبر - قالمة',
    nameFr: 'Place 1er Novembre Guelma',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'landmark',
    coords: { lat: 36.4635, lng: 7.4278, name: 'ساحة أول نوفمبر، قالمة', address: 'ساحة أول نوفمبر 1954، قالمة' },
    aliases: ['ساحة قالمة', 'ساحة 1 نوفمبر', 'place 1er mai guelma'],
  },
  {
    id: 'guelma-souidani-boudjemaa',
    name: 'شارع سويداني بوجمعة - قالمة',
    nameFr: 'Avenue Souidani Boudjemaa',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'hotspot',
    coords: { lat: 36.4640, lng: 7.4290, name: 'شارع سويداني بوجمعة', address: 'شارع سويداني بوجمعة، قالمة' },
    aliases: ['سويداني بوجمعة', 'شارع سويداني', 'boulevard souidani'],
  },
  {
    id: 'guelma-bab-essouk',
    name: 'باب السوق - قالمة',
    nameFr: 'Bab Essouk Guelma',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'market',
    coords: { lat: 36.4610, lng: 7.4310, name: 'باب السوق، قالمة', address: 'حي باب السوق التجاري، قالمة' },
    aliases: ['باب السوق', 'سوق قالمة', 'marche guelma'],
  },
  {
    id: 'guelma-theatre-romain',
    name: 'المسرح الروماني الأثري - قالمة (Théâtre Romain)',
    nameFr: 'Théâtre Romain de Guelma',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'landmark',
    coords: { lat: 36.4625, lng: 7.4280, name: 'المسرح الروماني قالمة', address: 'المسرح الروماني والآثار التاريخية، قالمة' },
    aliases: ['المسرح الروماني', 'آثار قالمة', 'theatre romain'],
  },
  {
    id: 'guelma-theatre-regional',
    name: 'المسرح الجهوي محمود تريكي - قالمة',
    nameFr: 'Théâtre Régional Mahmoud Triki',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'landmark',
    coords: { lat: 36.4628, lng: 7.4285, name: 'المسرح الجهوي قالمة', address: 'المسرح الجهوي محمود تريكي، قالمة' },
    aliases: ['المسرح الجهوي', 'مسرح محمود تريكي'],
  },
  {
    id: 'guelma-gare-routiere',
    name: 'محطة نقل المسافرين البرية - قالمة (Gare Routière)',
    nameFr: 'Gare Routière de Guelma',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'station',
    coords: { lat: 36.4550, lng: 7.4330, name: 'محطة الحافلات قالمة', address: 'محطة نقل المسافرين الجديدة، باب قسنطينة، قالمة' },
    aliases: ['محطة الحافلات قالمة', 'قار روتيار قالمة', 'gare routiere guelma', 'باب قسنطينة'],
  },
  {
    id: 'guelma-station-taxis',
    name: 'محطة سيارات الأجرة بين الولايات - قالمة',
    nameFr: 'Station de Taxis Inter-wilayas Guelma',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'station',
    coords: { lat: 36.4565, lng: 7.4315, name: 'محطة الطاكسيات قالمة', address: 'محطة سيارات الأجرة، قالمة' },
    aliases: ['محطة الطاكسي قالمة', 'طاكسيات قالمة', 'station taxi guelma'],
  },
  {
    id: 'guelma-hopital-hakim-okbi',
    name: 'مستشفى الحكيم عقبي - قالمة (Hôpital Hakim Okbi)',
    nameFr: 'Hôpital Hakim Okbi Guelma',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'hospital',
    coords: { lat: 36.4520, lng: 7.4210, name: 'مستشفى الحكيم عقبي', address: 'المؤسسة العمومية الاستشفائية الحكيم عقبي، قالمة' },
    aliases: ['سبيطار عقبي', 'مستشفى عقبي', 'الحكيم عقبي', 'hopital okbi'],
  },
  {
    id: 'guelma-hopital-ibn-zohr',
    name: 'مستشفى ابن زهر - قالمة (Hôpital Ibn Zohr)',
    nameFr: 'Hôpital Ibn Zohr Guelma',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'hospital',
    coords: { lat: 36.4655, lng: 7.4230, name: 'مستشفى ابن زهر قالمة', address: 'مستشفى ابن زهر، طريق حمام الدباغ، قالمة' },
    aliases: ['سبيطار ابن زهر', 'مستشفى ابن زهر', 'hopital ibn zohr'],
  },
  {
    id: 'guelma-univ-souidani',
    name: 'جامعة 8 ماي 1945 - مجمع سويسي (Université Guelma)',
    nameFr: 'Université 8 Mai 1945 - Campus Souidani',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'university',
    coords: { lat: 36.4420, lng: 7.4180, name: 'جامعة قالمة مجمع سويسي', address: 'جامعة 8 ماي 1945، مجمع سويسي بوجمعة، قالمة' },
    aliases: ['جامعة قالمة', 'مجمع سويسي', 'فاك قالمة', 'جامعة 8 ماي 1945', 'univ guelma', 'campus souidani'],
  },
  {
    id: 'guelma-univ-19-juin',
    name: 'جامعة 8 ماي 1945 - مجمع 19 جوان (Campus 19 Juin)',
    nameFr: 'Université 8 Mai 1945 - Campus 19 Juin',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'university',
    coords: { lat: 36.4710, lng: 7.4350, name: 'جامعة قالمة 19 جوان', address: 'جامعة 8 ماي 1945، مجمع 19 جوان، قالمة' },
    aliases: ['مجمع 19 جوان', 'جامعة 19 جوان قالمة', 'campus 19 juin'],
  },
  {
    id: 'guelma-residence-benteboul',
    name: 'الإقامة الجامعية لخضر بن تبول - قالمة',
    nameFr: 'Résidence Universitaire Benteboul',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'university',
    coords: { lat: 36.4450, lng: 7.4200, name: 'إقامة بن تبول قالمة', address: 'الإقامة الجامعية بن تبول، طريق قسنطينة، قالمة' },
    aliases: ['اقامة بن تبول', 'la cite benteboul'],
  },
  {
    id: 'guelma-stade-souidani',
    name: 'الملعب البلدي سويداني بوجمعة - قالمة (Stade)',
    nameFr: 'Stade Souidani Boudjemaa',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'hotspot',
    coords: { lat: 36.4590, lng: 7.4320, name: 'ملعب سويداني بوجمعة', address: 'الملعب البلدي سويداني بوجمعة، قالمة' },
    aliases: ['ملعب قالمة', 'ستاد سويداني', 'stade guelma'],
  },
  {
    id: 'guelma-parc-oued-lmaiz',
    name: 'حديقة التسلية واد المعيز - قالمة (Parc de loisirs)',
    nameFr: 'Parc de loisirs Oued El Maïz',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'hotspot',
    coords: { lat: 36.4680, lng: 7.4410, name: 'حديقة التسلية واد المعيز', address: 'حديقة التسلية والترفيه، واد المعيز، قالمة' },
    aliases: ['بارك واد المعيز', 'حديقة قالمة', 'parc guelma'],
  },
  {
    id: 'guelma-quartier-bouaroura',
    name: 'حي بوعارورة - قالمة',
    nameFr: 'Cité Bouaroura Guelma',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'hotspot',
    coords: { lat: 36.4580, lng: 7.4190, name: 'حي بوعارورة', address: 'حي بوعارورة السكني، قالمة' },
    aliases: ['بوعارورة', 'cite bouaroura'],
  },
  {
    id: 'guelma-quartier-karmat',
    name: 'حي الكرمات - قالمة',
    nameFr: 'Cité Les Karmat Guelma',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'hotspot',
    coords: { lat: 36.4660, lng: 7.4320, name: 'حي الكرمات', address: 'حي الكرمات، قالمة' },
    aliases: ['الكرمات', 'les karmat'],
  },
  {
    id: 'guelma-quartier-19-juin',
    name: 'حي 19 جوان - قالمة',
    nameFr: 'Cité 19 Juin Guelma',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'hotspot',
    coords: { lat: 36.4700, lng: 7.4340, name: 'حي 19 جوان', address: 'حي 19 جوان، قالمة' },
    aliases: ['19 جوان قالمة'],
  },
  {
    id: 'guelma-quartier-berrehal',
    name: 'حي برحال - قالمة',
    nameFr: 'Cité Berrehal Guelma',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'hotspot',
    coords: { lat: 36.4530, lng: 7.4250, name: 'حي برحال', address: 'حي برحال، قالمة' },
    aliases: ['برحال', 'cite berrehal'],
  },
  {
    id: 'guelma-hammam-debagh',
    name: 'حمام الدباغ / مسخوطين والشلالة المعدنية (Hammam Debagh)',
    nameFr: 'Hammam Debagh (Meskoutine - La Cascade)',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'landmark',
    coords: { lat: 36.4594, lng: 7.2725, name: 'حمام الدباغ قالمة', address: 'الشلالة المعدنية، حمام الدباغ (مسخوطين)، قالمة' },
    aliases: ['حمام دباغ', 'حمام مسخوطين', 'الشلالة', 'debagh', 'hammam debagh', 'la cascade'],
  },
  {
    id: 'guelma-hammam-nbail',
    name: 'حمام النبائل (Hammam N\'Bail)',
    nameFr: 'Hammam N\'Bail',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'municipality',
    coords: { lat: 36.3211, lng: 7.6744, name: 'حمام النبائل', address: 'بلدية حمام النبائل، ولاية قالمة' },
    aliases: ['حمام النبايل', 'nbail', 'hammam nbail'],
  },
  {
    id: 'guelma-hammam-berda',
    name: 'حمام برادع - هليوبوليس (Hammam Berda)',
    nameFr: 'Hammam Berda Héliopolis',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'landmark',
    coords: { lat: 36.5050, lng: 7.4420, name: 'حمام برادع', address: 'حمام برادع المعدني، هليوبوليس، قالمة' },
    aliases: ['حمام بردة', 'برادع', 'hammam berda'],
  },
  {
    id: 'guelma-hammam-ouled-ali',
    name: 'حمام أولاد علي المعدني (Hammam Ouled Ali)',
    nameFr: 'Hammam Ouled Ali',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'landmark',
    coords: { lat: 36.5180, lng: 7.3980, name: 'حمام أولاد علي', address: 'المحطة الحموية أولاد علي، قالمة' },
    aliases: ['أولاد علي', 'ouled ali'],
  },
  {
    id: 'guelma-oued-zenati',
    name: 'وادي الزناتي (Oued Zenati)',
    nameFr: 'Oued Zenati',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'municipality',
    coords: { lat: 36.3167, lng: 7.1667, name: 'وادي الزناتي', address: 'دائرة وبلدية وادي الزناتي، ولاية قالمة' },
    aliases: ['واد الزناتي', 'الزناتي', 'oued zenati'],
  },
  {
    id: 'guelma-bouchegouf',
    name: 'بوشقوف (Bouchegouf)',
    nameFr: 'Bouchegouf',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'municipality',
    coords: { lat: 36.4683, lng: 7.7289, name: 'بوشقوف', address: 'دائرة وبلدية بوشقوف، ولاية قالمة' },
    aliases: ['بوشقوف قالمة', 'bouchegouf'],
  },
  {
    id: 'guelma-heliopolis',
    name: 'هليوبوليس (Héliopolis)',
    nameFr: 'Héliopolis',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'municipality',
    coords: { lat: 36.5028, lng: 7.4431, name: 'هليوبوليس قالمة', address: 'دائرة وبلدية هليوبوليس، ولاية قالمة' },
    aliases: ['هيليوبوليس', 'هليوبوليس', 'heliopolis'],
  },
  {
    id: 'guelma-belkheir',
    name: 'بلخير (Belkheir)',
    nameFr: 'Belkheir',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'municipality',
    coords: { lat: 36.4475, lng: 7.4586, name: 'بلخير', address: 'بلدية بلخير، ولاية قالمة' },
    aliases: ['بلخير قالمة', 'belkheir'],
  },
  {
    id: 'guelma-el-fedjoudj',
    name: 'الفجوج (El Fedjoudj)',
    nameFr: 'El Fedjoudj',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'municipality',
    coords: { lat: 36.4917, lng: 7.3917, name: 'الفجوج', address: 'بلدية الفجوج، ولاية قالمة' },
    aliases: ['الفجوج قالمة', 'el fedjoudj'],
  },
  {
    id: 'guelma-ben-djerrah',
    name: 'بن جراح (Ben Djerrah)',
    nameFr: 'Ben Djerrah',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'municipality',
    coords: { lat: 36.4350, lng: 7.4083, name: 'بن جراح', address: 'بلدية بن جراح، سفوح جبل ماونة، قالمة' },
    aliases: ['بن جراح قالمة', 'ben djerrah'],
  },
  {
    id: 'guelma-guelaat-bou-sbaa',
    name: 'قلعة بوصبع (Guelaât Bou Sbaâ)',
    nameFr: 'Guelaât Bou Sbaâ',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'municipality',
    coords: { lat: 36.5417, lng: 7.4583, name: 'قلعة بوصبع', address: 'دائرة وبلدية قلعة بوصبع، ولاية قالمة' },
    aliases: ['قلعة بوصبع', 'guelat bou sbaa'],
  },
  {
    id: 'guelma-medjez-amar',
    name: 'مجاز عمار (Medjez Amar)',
    nameFr: 'Medjez Amar',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'municipality',
    coords: { lat: 36.4417, lng: 7.3167, name: 'مجاز عمار', address: 'بلدية مجاز عمار، ولاية قالمة' },
    aliases: ['مجاز عمار', 'medjez amar'],
  },
  {
    id: 'guelma-ain-makhlouf',
    name: 'عين مخلوف (Ain Makhlouf)',
    nameFr: 'Ain Makhlouf',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'municipality',
    coords: { lat: 36.2417, lng: 7.2417, name: 'عين مخلوف', address: 'دائرة وبلدية عين مخلوف، ولاية قالمة' },
    aliases: ['عين مخلوف', 'ain makhlouf'],
  },
  {
    id: 'guelma-tamlouka',
    name: 'تاملوكة (Tamlouka)',
    nameFr: 'Tamlouka',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'municipality',
    coords: { lat: 36.1750, lng: 7.1417, name: 'تاملوكة', address: 'بلدية تاملوكة، ولاية قالمة' },
    aliases: ['تاملوكة', 'tamlouka'],
  },
  {
    id: 'guelma-roknia',
    name: 'الركنية (Roknia)',
    nameFr: 'Roknia',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'municipality',
    coords: { lat: 36.5500, lng: 7.2333, name: 'الركنية', address: 'بلدية الركنية والأضرحة المغليثية، ولاية قالمة' },
    aliases: ['الركنية', 'roknia'],
  },
  {
    id: 'guelma-bouati-mahmoud',
    name: 'بوعاتي محمود (Bouati Mahmoud)',
    nameFr: 'Bouati Mahmoud',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'municipality',
    coords: { lat: 36.5667, lng: 7.3333, name: 'بوعاتي محمود', address: 'بلدية بوعاتي محمود، ولاية قالمة' },
    aliases: ['بوعاتي محمود', 'bouati mahmoud'],
  },
  {
    id: 'guelma-ain-sandel',
    name: 'عين صندل (Ain Sandel)',
    nameFr: 'Ain Sandel',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'municipality',
    coords: { lat: 36.2750, lng: 7.6083, name: 'عين صندل', address: 'بلدية عين صندل، ولاية قالمة' },
    aliases: ['عين صندل', 'ain sandel'],
  },
  {
    id: 'guelma-ain-larbi',
    name: 'عين العربي (Ain Larbi)',
    nameFr: 'Ain Larbi',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'municipality',
    coords: { lat: 36.2500, lng: 7.4167, name: 'عين العربي', address: 'بلدية عين العربي، ولاية قالمة' },
    aliases: ['عين العربي', 'ain larbi'],
  },
  {
    id: 'guelma-ain-ben-beida',
    name: 'عين بن بيضاء (Ain Ben Beida)',
    nameFr: 'Ain Ben Beida',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'municipality',
    coords: { lat: 36.6500, lng: 7.7500, name: 'عين بن بيضاء', address: 'بلدية عين بن بيضاء، ولاية قالمة' },
    aliases: ['عين بن بيضاء', 'ain ben beida'],
  },
  {
    id: 'guelma-oued-fragha',
    name: 'وادي فراغة (Oued Fragha)',
    nameFr: 'Oued Fragha',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'municipality',
    coords: { lat: 36.5500, lng: 7.7167, name: 'وادي فراغة', address: 'بلدية وادي فراغة، ولاية قالمة' },
    aliases: ['واد فراغة', 'oued fragha'],
  },
  {
    id: 'guelma-oued-cheham',
    name: 'وادي الشحم (Oued Cheham)',
    nameFr: 'Oued Cheham',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'municipality',
    coords: { lat: 36.3833, lng: 7.7667, name: 'وادي الشحم', address: 'بلدية وادي الشحم، ولاية قالمة' },
    aliases: ['واد الشحم', 'oued cheham'],
  },
  {
    id: 'guelma-nechmaya',
    name: 'نشامية (Nechmaya)',
    nameFr: 'Nechmaya',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'municipality',
    coords: { lat: 36.5833, lng: 7.5167, name: 'نشامية', address: 'بلدية نشامية، ولاية قالمة' },
    aliases: ['نشامية', 'nechmaya'],
  },
  {
    id: 'guelma-bouhachana',
    name: 'بوحشانة (Bouhachana)',
    nameFr: 'Bouhachana',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'municipality',
    coords: { lat: 36.3167, lng: 7.5500, name: 'بوحشانة', address: 'بلدية بوحشانة، ولاية قالمة' },
    aliases: ['بوحشانة', 'bouhachana'],
  },
  {
    id: 'guelma-dahouara',
    name: 'الدهوارة (Dahouara)',
    nameFr: 'Dahouara',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'municipality',
    coords: { lat: 36.3333, lng: 7.6000, name: 'الدهوارة', address: 'بلدية الدهوارة، ولاية قالمة' },
    aliases: ['الدهوارة', 'dahouara'],
  },
  {
    id: 'guelma-mont-maouna',
    name: 'جبل ماونة وقمتها الطبيعية (Monts de Maouna)',
    nameFr: 'Monts de Maouna Guelma',
    wilaya: 'قالمة',
    wilayaCode: '24',
    type: 'landmark',
    coords: { lat: 36.4167, lng: 7.3833, name: 'جبل ماونة قالمة', address: 'قمة جبل ماونة السياحية، قالمة' },
    aliases: ['جبل ماونة', 'ماونة', 'mont maouna'],
  },

  // ==========================================
  // 📍 الجزائر العاصمة (Alger - 16)
  // ==========================================
  {
    id: 'alger-place-1er-mai',
    name: 'ساحة أول ماي (Place du 1er Mai)',
    nameFr: 'Place 1er Mai Alger',
    wilaya: 'الجزائر العاصمة',
    wilayaCode: '16',
    type: 'landmark',
    coords: { lat: 36.7561, lng: 3.0543, name: 'ساحة أول ماي', address: 'ساحة أول ماي، سيدي امحمد، الجزائر العاصمة' },
    aliases: ['أول ماي', '1er mai', 'champ de manoeuvre'],
  },
  {
    id: 'alger-grande-poste',
    name: 'البريد المركزي (Grande Poste)',
    nameFr: 'Grande Poste d\'Alger',
    wilaya: 'الجزائر العاصمة',
    wilayaCode: '16',
    type: 'landmark',
    coords: { lat: 36.7725, lng: 3.0592, name: 'البريد المركزي', address: 'ساحة البريد المركزي، الجزائر الوسطى' },
    aliases: ['البريد المركزي', 'وسط العاصمة', 'grande poste'],
  },
  {
    id: 'alger-didouche-mourad',
    name: 'شارع ديدوش مراد (Didouche Mourad)',
    nameFr: 'Rue Didouche Mourad',
    wilaya: 'الجزائر العاصمة',
    wilayaCode: '16',
    type: 'hotspot',
    coords: { lat: 36.7648, lng: 3.0526, name: 'شارع ديدوش مراد', address: 'شارع ديدوش مراد، الجزائر' },
    aliases: ['ديدوش مراد', 'didouche'],
  },
  {
    id: 'alger-bab-ezzouar-usthb',
    name: 'جامعة باب الزوار للعلوم والتكنولوجيا (USTHB)',
    nameFr: 'USTHB Bab Ezzouar',
    wilaya: 'الجزائر العاصمة',
    wilayaCode: '16',
    type: 'university',
    coords: { lat: 36.7118, lng: 3.1813, name: 'جامعة USTHB', address: 'جامعة باب الزوار للعلوم والتكنولوجيا، باب الزوار' },
    aliases: ['جامعة باب الزوار', 'usthb', 'bab ezzouar univ'],
  },
  {
    id: 'alger-centre-commercial-bab-ezzouar',
    name: 'المركز التجاري باب الزوار (Centre Commercial Bab Ezzouar)',
    nameFr: 'Centre Commercial Bab Ezzouar',
    wilaya: 'الجزائر العاصمة',
    wilayaCode: '16',
    type: 'market',
    coords: { lat: 36.7176, lng: 3.1952, name: 'مول باب الزوار', address: 'حي الأعمال، باب الزوار، الجزائر' },
    aliases: ['مول باب الزوار', 'centre commercial bab ezzouar'],
  },
  {
    id: 'alger-aeroport',
    name: 'مطار الجزائر الدولي - هواري بومدين',
    nameFr: 'Aéroport International Houari Boumediene',
    wilaya: 'الجزائر العاصمة',
    wilayaCode: '16',
    type: 'station',
    coords: { lat: 36.6974, lng: 3.2185, name: 'مطار الجزائر الدولي', address: 'مطار هواري بومدين الدولي، الدار البيضاء' },
    aliases: ['مطار الجزائر', 'aeroport alger', 'dar el beida'],
  },
  {
    id: 'alger-hydra',
    name: 'حي حيدرة الدبلوماسي (Hydra)',
    nameFr: 'Hydra Alger',
    wilaya: 'الجزائر العاصمة',
    wilayaCode: '16',
    type: 'city',
    coords: { lat: 36.7441, lng: 3.0298, name: 'حي حيدرة', address: 'ساحة القدس، حيدرة، الجزائر العاصمة' },
    aliases: ['حيدرة', 'hydra'],
  },
  {
    id: 'alger-el-biar',
    name: 'الأبيار (El Biar)',
    nameFr: 'El Biar',
    wilaya: 'الجزائر العاصمة',
    wilayaCode: '16',
    type: 'city',
    coords: { lat: 36.7687, lng: 3.0315, name: 'الأبيار', address: 'شارع بوقرة، الأبيار، الجزائر' },
    aliases: ['الأبيار', 'el biar'],
  },
  {
    id: 'alger-kouba',
    name: 'القبة (Kouba)',
    nameFr: 'Kouba Alger',
    wilaya: 'الجزائر العاصمة',
    wilayaCode: '16',
    type: 'city',
    coords: { lat: 36.7256, lng: 3.0851, name: 'القبة', address: 'وسط القبة، الجزائر العاصمة' },
    aliases: ['القبة', 'kouba'],
  },
  {
    id: 'alger-makam-echahid',
    name: 'مقام الشهيد ورياض الفتح (Makam Echahid)',
    nameFr: 'Makam Echahid - Riadh El Feth',
    wilaya: 'الجزائر العاصمة',
    wilayaCode: '16',
    type: 'landmark',
    coords: { lat: 36.7458, lng: 3.0697, name: 'مقام الشهيد', address: 'رياض الفتح، المدنية، الجزائر العاصمة' },
    aliases: ['مقام الشهيد', 'رياض الفتح', 'makam echahid', 'riadh el feth'],
  },
  {
    id: 'alger-djamaa-el-djazair',
    name: 'جامع الجزائر الأعظم (Djamaâ El-Djazaïr)',
    nameFr: 'Grande Mosquée d\'Alger',
    wilaya: 'الجزائر العاصمة',
    wilayaCode: '16',
    type: 'landmark',
    coords: { lat: 36.7340, lng: 3.1420, name: 'جامع الجزائر الأعظم', address: 'المحمدية، الجزائر العاصمة' },
    aliases: ['جامع الجزائر', 'مسجد الجزائر الاعظم', 'grande mosquee'],
  },
  {
    id: 'alger-sablettes',
    name: 'منتزه الصابلات البحري (Promenade des Sablettes)',
    nameFr: 'Les Sablettes Alger',
    wilaya: 'الجزائر العاصمة',
    wilayaCode: '16',
    type: 'hotspot',
    coords: { lat: 36.7420, lng: 3.1080, name: 'منتزه الصابلات', address: 'منتزه الصابلات، حسين داي، الجزائر' },
    aliases: ['الصابلات', 'sablettes'],
  },
  {
    id: 'alger-bab-el-oued',
    name: 'باب الوادي (Bab El Oued)',
    nameFr: 'Bab El Oued',
    wilaya: 'الجزائر العاصمة',
    wilayaCode: '16',
    type: 'city',
    coords: { lat: 36.7900, lng: 3.0510, name: 'باب الوادي', address: 'ساحة الساعات الثلاث، باب الوادي، الجزائر' },
    aliases: ['باب الواد', 'bab el oued'],
  },
  {
    id: 'alger-cheraga',
    name: 'الشراقة (Chéraga)',
    nameFr: 'Chéraga',
    wilaya: 'الجزائر العاصمة',
    wilayaCode: '16',
    type: 'city',
    coords: { lat: 36.7667, lng: 2.9500, name: 'الشراقة', address: 'وسط الشراقة، الجزائر' },
    aliases: ['الشراقة', 'cheraga'],
  },
  {
    id: 'alger-draria',
    name: 'درارية (Draria)',
    nameFr: 'Draria',
    wilaya: 'الجزائر العاصمة',
    wilayaCode: '16',
    type: 'city',
    coords: { lat: 36.7167, lng: 3.0000, name: 'درارية', address: 'وسط درارية، الجزائر' },
    aliases: ['درارية', 'draria'],
  },
  {
    id: 'alger-ben-aknoun',
    name: 'بن عكنون (Ben Aknoun)',
    nameFr: 'Ben Aknoun',
    wilaya: 'الجزائر العاصمة',
    wilayaCode: '16',
    type: 'city',
    coords: { lat: 36.7550, lng: 3.0120, name: 'بن عكنون', address: 'محطة الحافلات وإقامات بن عكنون' },
    aliases: ['بن عكنون', 'ben aknoun'],
  },
  {
    id: 'alger-zeralda',
    name: 'زرالدة (Zéralda)',
    nameFr: 'Zéralda',
    wilaya: 'الجزائر العاصمة',
    wilayaCode: '16',
    type: 'city',
    coords: { lat: 36.7167, lng: 2.8500, name: 'زرالدة', address: 'المدينة والشاطئ السياحي، زرالدة' },
    aliases: ['زرالدة', 'zeralda'],
  },
  {
    id: 'alger-rouiba',
    name: 'رويبة (Rouïba)',
    nameFr: 'Rouïba',
    wilaya: 'الجزائر العاصمة',
    wilayaCode: '16',
    type: 'city',
    coords: { lat: 36.7333, lng: 3.2833, name: 'رويبة', address: 'المنطقة الصناعية ووسط رويبة' },
    aliases: ['رويبة', 'rouiba'],
  },

  // ==========================================
  // 📍 قسنطينة (Constantine - 25)
  // ==========================================
  {
    id: 'constantine-centre',
    name: 'قسنطينة وسط المدينة (Constantine Centre)',
    nameFr: 'Constantine Centre-ville',
    wilaya: 'قسنطينة',
    wilayaCode: '25',
    type: 'city',
    coords: { lat: 36.3650, lng: 6.6147, name: 'قسنطينة وسط المدينة', address: 'وسط مدينة قسنطينة' },
    aliases: ['قسنطينة', 'constantine'],
  },
  {
    id: 'constantine-place-1er-novembre',
    name: 'ساحة أول نوفمبر / لا بريش (La Brèche)',
    nameFr: 'Place 1er Novembre (La Brèche)',
    wilaya: 'قسنطينة',
    wilayaCode: '25',
    type: 'landmark',
    coords: { lat: 36.3645, lng: 6.6095, name: 'لا بريش قسنطينة', address: 'ساحة أول نوفمبر، قسنطينة' },
    aliases: ['لا بريش', 'la breche', 'place 1er novembre constantine'],
  },
  {
    id: 'constantine-pont-sidi-rached',
    name: 'جسر سيدي راشد العملاق (Pont Sidi Rached)',
    nameFr: 'Pont Sidi Rached',
    wilaya: 'قسنطينة',
    wilayaCode: '25',
    type: 'landmark',
    coords: { lat: 36.3615, lng: 6.6160, name: 'جسر سيدي راشد', address: 'جسر سيدي راشد، قسنطينة' },
    aliases: ['سيدي راشد', 'pont sidi rached'],
  },
  {
    id: 'constantine-pont-sidi-mcid',
    name: 'جسر سيدي مسيد المعلق (Pont Sidi M\'Cid)',
    nameFr: 'Pont Suspendu Sidi M\'Cid',
    wilaya: 'قسنطينة',
    wilayaCode: '25',
    type: 'landmark',
    coords: { lat: 36.3720, lng: 6.6150, name: 'جسر سيدي مسيد المعلق', address: 'جسر سيدي مسيد، قسنطينة' },
    aliases: ['سيدي مسيد', 'الجسر المعلق', 'sidi mcid'],
  },
  {
    id: 'constantine-ali-mendjeli',
    name: 'المدينة الجديدة علي منجلي (Ali Mendjeli)',
    nameFr: 'Nouvelle Ville Ali Mendjeli',
    wilaya: 'قسنطينة',
    wilayaCode: '25',
    type: 'city',
    coords: { lat: 36.2450, lng: 6.5720, name: 'المدينة الجديدة علي منجلي', address: 'علي منجلي، قسنطينة' },
    aliases: ['علي منجلي', 'المدينة الجديدة قسنطينة', 'ali mendjeli'],
  },
  {
    id: 'constantine-el-khroub',
    name: 'الخروب (El Khroub)',
    nameFr: 'El Khroub',
    wilaya: 'قسنطينة',
    wilayaCode: '25',
    type: 'municipality',
    coords: { lat: 36.2625, lng: 6.6942, name: 'الخروب', address: 'مدينة الخروب، قسنطينة' },
    aliases: ['الخروب', 'el khroub'],
  },

  // ==========================================
  // 📍 عنابة (Annaba - 23)
  // ==========================================
  {
    id: 'annaba-centre-cours',
    name: 'عنابة وسط المدينة - الكور (Le Cours de la Révolution)',
    nameFr: 'Annaba Centre (Le Cours)',
    wilaya: 'عنابة',
    wilayaCode: '23',
    type: 'city',
    coords: { lat: 36.9000, lng: 7.7667, name: 'عنابة وسط المدينة', address: 'كور الثورة، وسط مدينة عنابة' },
    aliases: ['عنابة', 'الكور عنابة', 'annaba', 'le cours'],
  },
  {
    id: 'annaba-univ-sidi-amar',
    name: 'جامعة باجي مختار - سيدي عمار (Université Annaba)',
    nameFr: 'Université Badji Mokhtar Sidi Amar',
    wilaya: 'عنابة',
    wilayaCode: '23',
    type: 'university',
    coords: { lat: 36.8167, lng: 7.7167, name: 'جامعة سيدي عمار عنابة', address: 'جامعة باجي مختار، سيدي عمار، عنابة' },
    aliases: ['جامعة عنابة', 'سيدي عمار', 'sidi amar', 'univ badji mokhtar'],
  },
  {
    id: 'annaba-el-hadjar',
    name: 'الحجار (El Hadjar)',
    nameFr: 'El Hadjar',
    wilaya: 'عنابة',
    wilayaCode: '23',
    type: 'municipality',
    coords: { lat: 36.8000, lng: 7.7333, name: 'الحجار', address: 'مركب وبلدية الحجار، عنابة' },
    aliases: ['الحجار', 'el hadjar'],
  },
  {
    id: 'annaba-seraidi',
    name: 'سرايدي وجبال الإيدوغ (Séraïdi)',
    nameFr: 'Séraïdi Annaba',
    wilaya: 'عنابة',
    wilayaCode: '23',
    type: 'landmark',
    coords: { lat: 36.9167, lng: 7.6667, name: 'سرايدي عنابة', address: 'مرتفعات سرايدي، عنابة' },
    aliases: ['سرايدي', 'جبل ايدوغ', 'seraidi'],
  },
  {
    id: 'annaba-plage-chapuis',
    name: 'شاطئ ريزي عمر - شابي (Plage Chapuis)',
    nameFr: 'Plage Chapuis Annaba',
    wilaya: 'عنابة',
    wilayaCode: '23',
    type: 'hotspot',
    coords: { lat: 36.9120, lng: 7.7780, name: 'شاطئ شابي عنابة', address: 'شاطئ ريزي عمر (شابي)، عنابة' },
    aliases: ['شاطئ شابي', 'chapuis'],
  },

  // ==========================================
  // 📍 وهران (Oran - 31)
  // ==========================================
  {
    id: 'oran-centre-1er-novembre',
    name: 'وهران وسط المدينة (Place 1er Novembre - Oran)',
    nameFr: 'Oran Centre-ville',
    wilaya: 'وهران',
    wilayaCode: '31',
    type: 'city',
    coords: { lat: 35.7003, lng: -0.6417, name: 'وهران وسط المدينة', address: 'ساحة أول نوفمبر، وهران' },
    aliases: ['وهران', 'oran', 'place d armes'],
  },
  {
    id: 'oran-es-senia',
    name: 'السانيا ومطار أحمد بن بلة الدولي (Es-Sénia)',
    nameFr: 'Es-Sénia Aéroport',
    wilaya: 'وهران',
    wilayaCode: '31',
    type: 'station',
    coords: { lat: 35.6238, lng: -0.6212, name: 'مطار وهران السانيا', address: 'مطار أحمد بن بلة الدولي، السانيا، وهران' },
    aliases: ['السانيا', 'مطار وهران', 'aeroport oran', 'es senia'],
  },
  {
    id: 'oran-santa-cruz',
    name: 'قلعة سانتا كروز وجبل مرجاجو (Santa Cruz)',
    nameFr: 'Fort Santa Cruz Murdjadjo',
    wilaya: 'وهران',
    wilayaCode: '31',
    type: 'landmark',
    coords: { lat: 35.7100, lng: -0.6650, name: 'سانتا كروز وهران', address: 'جبل مرجاجو، سانتا كروز، وهران' },
    aliases: ['سانتا كروز', 'مرجاجو', 'santa cruz', 'murdjadjo'],
  },
  {
    id: 'oran-bir-el-djir',
    name: 'بئر الجير وإيسطو (Bir El Djir - USTO)',
    nameFr: 'Bir El Djir - USTO',
    wilaya: 'وهران',
    wilayaCode: '31',
    type: 'university',
    coords: { lat: 35.7150, lng: -0.5850, name: 'بئر الجير وإيسطو', address: 'جامعة إيسطو، بئر الجير، وهران' },
    aliases: ['ايسطو', 'بئر الجير', 'usto', 'bir el djir'],
  },
  {
    id: 'oran-ain-el-turck',
    name: 'عين الترك والكورنيش الوهراني (Aïn El Turck)',
    nameFr: 'Aïn El Turck',
    wilaya: 'وهران',
    wilayaCode: '31',
    type: 'hotspot',
    coords: { lat: 35.7444, lng: -0.7556, name: 'عين الترك وهران', address: 'الكورنيش، عين الترك، وهران' },
    aliases: ['عين الترك', 'ain el turck'],
  },

  // ==========================================
  // 📍 سطيف (Sétif - 19)
  // ==========================================
  {
    id: 'setif-centre-ain-fouara',
    name: 'سطيف وسط المدينة - عين الفوارة (Aïn El Fouara)',
    nameFr: 'Sétif Centre (Aïn Fouara)',
    wilaya: 'سطيف',
    wilayaCode: '19',
    type: 'landmark',
    coords: { lat: 36.1900, lng: 5.4100, name: 'عين الفوارة سطيف', address: 'عين الفوارة، وسط مدينة سطيف' },
    aliases: ['سطيف', 'عين الفوارة', 'setif', 'ain fouara'],
  },
  {
    id: 'setif-park-mall',
    name: 'بارك مول سطيف (Park Mall Sétif)',
    nameFr: 'Park Mall Sétif',
    wilaya: 'سطيف',
    wilayaCode: '19',
    type: 'market',
    coords: { lat: 36.1880, lng: 5.4050, name: 'بارك مول سطيف', address: 'بارك مول، وسط مدينة سطيف' },
    aliases: ['بارك مول', 'park mall setif'],
  },
  {
    id: 'setif-el-eulma',
    name: 'العلمة وسوق دبي التجاري (El Eulma)',
    nameFr: 'El Eulma (Souk Dubai)',
    wilaya: 'سطيف',
    wilayaCode: '19',
    type: 'market',
    coords: { lat: 36.1528, lng: 5.6903, name: 'العلمة سوق دبي', address: 'الشارع التجاري سوق دبي، العلمة، سطيف' },
    aliases: ['العلمة', 'سوق دبي العلمة', 'el eulma'],
  },

  // ==========================================
  // 📍 البليدة (Blida - 09)
  // ==========================================
  {
    id: 'blida-centre-bab-dzair',
    name: 'البليدة وسط المدينة - باب الدزاير (Bab Dzair)',
    nameFr: 'Blida Centre (Bab Dzair)',
    wilaya: 'البليدة',
    wilayaCode: '09',
    type: 'city',
    coords: { lat: 36.4702, lng: 2.8288, name: 'البليدة باب الدزاير', address: 'باب الدزاير، ساحة التوت، البليدة' },
    aliases: ['البليدة', 'باب الدزاير', 'blida'],
  },
  {
    id: 'blida-chrea',
    name: 'مرتفعات الشريعة الثلجية (Chréa)',
    nameFr: 'Chréa Blida',
    wilaya: 'البليدة',
    wilayaCode: '09',
    type: 'landmark',
    coords: { lat: 36.4267, lng: 2.8767, name: 'الشريعة البليدة', address: 'المحطة المناخية الشريعة، البليدة' },
    aliases: ['الشريعة', 'chrea'],
  },
  {
    id: 'blida-boufarik',
    name: 'بوفاريك (Boufarik)',
    nameFr: 'Boufarik',
    wilaya: 'البليدة',
    wilayaCode: '09',
    type: 'city',
    coords: { lat: 36.5750, lng: 2.9125, name: 'بوفاريك', address: 'مدينة بوفاريك، البليدة' },
    aliases: ['بوفاريك', 'boufarik'],
  },

  // ==========================================
  // 📍 باتنة (Batna - 05)
  // ==========================================
  {
    id: 'batna-centre',
    name: 'باتنة وسط المدينة وممرات بن بولعيد',
    nameFr: 'Batna Centre-ville',
    wilaya: 'باتنة',
    wilayaCode: '05',
    type: 'city',
    coords: { lat: 35.5559, lng: 6.1741, name: 'باتنة وسط المدينة', address: 'ممرات مصطفى بن بولعيد، باتنة' },
    aliases: ['باتنة', 'batna'],
  },
  {
    id: 'batna-timgad',
    name: 'تيمقاد الأثرية الرومانية (Timgad)',
    nameFr: 'Ruines Romaines de Timgad',
    wilaya: 'باتنة',
    wilayaCode: '05',
    type: 'landmark',
    coords: { lat: 35.4842, lng: 6.4675, name: 'تيمقاد الأثرية', address: 'مدينة تيمقاد الأثرية، باتنة' },
    aliases: ['تيمقاد', 'timgad'],
  },

  // ==========================================
  // 📍 بجاية (Béjaïa - 06)
  // ==========================================
  {
    id: 'bejaia-centre',
    name: 'بجاية وسط المدينة والميناء (Béjaïa Centre)',
    nameFr: 'Béjaïa Centre-ville',
    wilaya: 'بجاية',
    wilayaCode: '06',
    type: 'city',
    coords: { lat: 36.7511, lng: 5.0567, name: 'بجاية وسط المدينة', address: 'وسط مدينة بجاية' },
    aliases: ['بجاية', 'bejaia'],
  },
  {
    id: 'bejaia-cap-carbon',
    name: 'كاب كربون وقمة قورايا (Cap Carbon - Gouraya)',
    nameFr: 'Cap Carbon Béjaïa',
    wilaya: 'بجاية',
    wilayaCode: '06',
    type: 'landmark',
    coords: { lat: 36.7750, lng: 5.1050, name: 'كاب كربون بجاية', address: 'رأس كربون، الحظيرة الوطنية لقورايا، بجاية' },
    aliases: ['كاب كربون', 'قورايا', 'cap carbon', 'gouraya'],
  },
  {
    id: 'bejaia-tichy',
    name: 'تيشي والشواطئ الشرقية (Tichy)',
    nameFr: 'Tichy Béjaïa',
    wilaya: 'بجاية',
    wilayaCode: '06',
    type: 'hotspot',
    coords: { lat: 36.6667, lng: 5.1667, name: 'تيشي بجاية', address: 'الشريط الساحلي، تيشي، بجاية' },
    aliases: ['تيشي', 'tichy'],
  },

  // ==========================================
  // 📍 تيزي وزو (Tizi Ouzou - 15)
  // ==========================================
  {
    id: 'tizi-ouzou-centre',
    name: 'تيزي وزو وسط المدينة (Tizi Ouzou Centre)',
    nameFr: 'Tizi Ouzou Centre-ville',
    wilaya: 'تيزي وزو',
    wilayaCode: '15',
    type: 'city',
    coords: { lat: 36.7119, lng: 4.0459, name: 'تيزي وزو وسط المدينة', address: 'وسط مدينة تيزي وزو' },
    aliases: ['تيزي وزو', 'tizi ouzou'],
  },

  // ==========================================
  // 📍 سكيكدة (Skikda - 21)
  // ==========================================
  {
    id: 'skikda-centre-port',
    name: 'سكيكدة وسط المدينة والميناء (Skikda Centre)',
    nameFr: 'Skikda Centre & Port',
    wilaya: 'سكيكدة',
    wilayaCode: '21',
    type: 'city',
    coords: { lat: 36.8787, lng: 6.9069, name: 'سكيكدة وسط المدينة', address: 'وسط مدينة سكيكدة' },
    aliases: ['سكيكدة', 'روسيكادا', 'skikda'],
  },
  {
    id: 'skikda-stora',
    name: 'سطورة وشواطئ الكورنيش (Stora)',
    nameFr: 'Stora Skikda',
    wilaya: 'سكيكدة',
    wilayaCode: '21',
    type: 'hotspot',
    coords: { lat: 36.9000, lng: 6.8833, name: 'سطورة سكيكدة', address: 'شاطئ وميناء سطورة، سكيكدة' },
    aliases: ['سطورة', 'stora'],
  },

  // ==========================================
  // 📍 سوق أهراس (Souk Ahras - 41)
  // ==========================================
  {
    id: 'souk-ahras-centre',
    name: 'سوق أهراس وسط المدينة (Souk Ahras Centre)',
    nameFr: 'Souk Ahras Centre',
    wilaya: 'سوق أهراس',
    wilayaCode: '41',
    type: 'city',
    coords: { lat: 36.2864, lng: 7.9511, name: 'سوق أهراس وسط المدينة', address: 'وسط مدينة سوق أهراس' },
    aliases: ['سوق اهراس', 'طاغاست', 'souk ahras'],
  },
  {
    id: 'souk-ahras-sedrata',
    name: 'سدراتة (Sedrata)',
    nameFr: 'Sedrata',
    wilaya: 'سوق أهراس',
    wilayaCode: '41',
    type: 'municipality',
    coords: { lat: 36.1283, lng: 7.5303, name: 'سدراتة', address: 'مدينة سدراتة، سوق أهراس' },
    aliases: ['سدراتة', 'sedrata'],
  },

  // ==========================================
  // 📍 الطارف (El Tarf - 36)
  // ==========================================
  {
    id: 'el-tarf-centre',
    name: 'الطارف وسط المدينة (El Tarf Centre)',
    nameFr: 'El Tarf Centre',
    wilaya: 'الطارف',
    wilayaCode: '36',
    type: 'city',
    coords: { lat: 36.7667, lng: 8.3167, name: 'الطارف وسط المدينة', address: 'وسط مدينة الطارف' },
    aliases: ['الطارف', 'el tarf'],
  },
  {
    id: 'el-tarf-el-kala',
    name: 'القالة والشواطئ المرجانية (El Kala)',
    nameFr: 'El Kala (La Calle)',
    wilaya: 'الطارف',
    wilayaCode: '36',
    type: 'hotspot',
    coords: { lat: 36.8956, lng: 8.4433, name: 'القالة', address: 'ميناء وشواطئ القالة، الطارف' },
    aliases: ['القالة', 'الكالة', 'el kala'],
  },

  // ==========================================
  // 📍 تلمسان (Tlemcen - 13)
  // ==========================================
  {
    id: 'tlemcen-centre-mechouar',
    name: 'تلمسان وسط المدينة وقصر المشور (Tlemcen Centre)',
    nameFr: 'Tlemcen (Palais El Mechouar)',
    wilaya: 'تلمسان',
    wilayaCode: '13',
    type: 'landmark',
    coords: { lat: 34.8783, lng: -1.3150, name: 'قصر المشور تلمسان', address: 'قصر المشور، وسط مدينة تلمسان' },
    aliases: ['تلمسان', 'المشور', 'tlemcen', 'mechouar'],
  },
  {
    id: 'tlemcen-lalla-setti',
    name: 'هضبة لالة ستي السياحية (Lalla Setti)',
    nameFr: 'Plateau Lalla Setti',
    wilaya: 'تلمسان',
    wilayaCode: '13',
    type: 'landmark',
    coords: { lat: 34.8650, lng: -1.3120, name: 'لالة ستي تلمسان', address: 'هضبة لالة ستي والتلفريك، تلمسان' },
    aliases: ['لالة ستي', 'lalla setti'],
  },

  // ==========================================
  // 📍 مستغانم (Mostaganem - 27)
  // ==========================================
  {
    id: 'mostaganem-centre',
    name: 'مستغانم وسط المدينة وصابلات (Mostaganem)',
    nameFr: 'Mostaganem Centre',
    wilaya: 'مستغانم',
    wilayaCode: '27',
    type: 'city',
    coords: { lat: 35.9333, lng: 0.0900, name: 'مستغانم وسط المدينة', address: 'وسط مدينة مستغانم' },
    aliases: ['مستغانم', 'mostaganem'],
  },

  // ==========================================
  // 📍 جيجل (Jijel - 18)
  // ==========================================
  {
    id: 'jijel-centre-kotama',
    name: 'جيجل وسط المدينة وكورنيش كتامة (Jijel Centre)',
    nameFr: 'Jijel (Plage Kotama)',
    wilaya: 'جيجل',
    wilayaCode: '18',
    type: 'city',
    coords: { lat: 36.8206, lng: 5.7667, name: 'جيجل وسط المدينة', address: 'وسط مدينة جيجل' },
    aliases: ['جيجل', 'كتامة', 'jijel'],
  },

  // ==========================================
  // 📍 ميلة (Mila - 43)
  // ==========================================
  {
    id: 'mila-chelghoum-laid',
    name: 'شلغوم العيد (Chelghoum Laïd - Mila)',
    nameFr: 'Chelghoum Laïd',
    wilaya: 'ميلة',
    wilayaCode: '43',
    type: 'city',
    coords: { lat: 36.1667, lng: 6.1667, name: 'شلغوم العيد ميلة', address: 'وسط مدينة شلغوم العيد، ميلة' },
    aliases: ['شلغوم العيد', 'ميلة', 'chelghoum laid', 'mila'],
  },
  {
    id: 'mila-tadjenanet',
    name: 'تاجنانت وسوق الجملة الأسبوعي (Tadjenanet)',
    nameFr: 'Tadjenanet',
    wilaya: 'ميلة',
    wilayaCode: '43',
    type: 'market',
    coords: { lat: 36.1167, lng: 5.9833, name: 'تاجنانت سوق السيارات والجملة', address: 'تاجنانت، ميلة' },
    aliases: ['تاجنانت', 'سوق تاجنانت', 'tadjenanet'],
  },

  // ==========================================
  // 📍 بسكرة (Biskra - 07)
  // ==========================================
  {
    id: 'biskra-centre',
    name: 'بسكرة عروس الزيبان (Biskra Centre)',
    nameFr: 'Biskra Centre',
    wilaya: 'بسكرة',
    wilayaCode: '07',
    type: 'city',
    coords: { lat: 34.8500, lng: 5.7333, name: 'بسكرة وسط المدينة', address: 'وسط مدينة بسكرة' },
    aliases: ['بسكرة', 'عروس الزيبان', 'biskra'],
  },

  // ==========================================
  // 📍 ورقلة (Ouargla - 30)
  // ==========================================
  {
    id: 'ouargla-hassi-messaoud',
    name: 'حاسي مسعود وورقلة (Hassi Messaoud)',
    nameFr: 'Hassi Messaoud Ouargla',
    wilaya: 'ورقلة',
    wilayaCode: '30',
    type: 'city',
    coords: { lat: 31.6804, lng: 6.0728, name: 'حاسي مسعود', address: 'حاسي مسعود، ورقلة' },
    aliases: ['حاسي مسعود', 'ورقلة', 'hassi messaoud', 'ouargla'],
  },
];

export const COMPREHENSIVE_ALGERIA_LOCATIONS: AlgeriaLocationItem[] = [
  ...BASE_LOCATIONS,
  ...ALL_WILAYAS_COMPREHENSIVE_PLACES,
];

/**
 * Normalizes an Arabic/Latin query string for flexible matching
 * Converts:
 * - [أ إ آ] -> ا
 * - ة -> ه
 * - [ى ي] -> ي
 * - ؤ -> و
 * - ئ -> ي
 * - Strips Arabic diacritics (tashkeel)
 * - Lowercases and trims
 */
export function normalizeSearchString(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove latin accents (é -> e, etc.)
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // remove tashkeel
    .replace(/\s+/g, ' ');
}

/**
 * Instant local search with 0ms delay across all Algerian locations
 * Supports matching any letter or partial word in Arabic and French
 */
export function searchLocalLocations(
  query: string,
  wilayaFilter: string = 'الكل'
): AlgeriaLocationItem[] {
  const normQuery = normalizeSearchString(query);

  let pool = COMPREHENSIVE_ALGERIA_LOCATIONS;

  // Filter by Wilaya if selected and not 'الكل'
  if (wilayaFilter && wilayaFilter !== 'الكل') {
    const normWilaya = normalizeSearchString(wilayaFilter);
    pool = pool.filter(item => {
      const itemWilaya = normalizeSearchString(item.wilaya);
      return itemWilaya.includes(normWilaya) || normWilaya.includes(itemWilaya);
    });
  }

  if (!normQuery) {
    return pool;
  }

  return pool.filter(item => {
    const normName = normalizeSearchString(item.name);
    const normNameFr = item.nameFr ? normalizeSearchString(item.nameFr) : '';
    const normWilaya = normalizeSearchString(item.wilaya);
    const normAddress = item.coords.address ? normalizeSearchString(item.coords.address) : '';
    const normAliases = item.aliases ? item.aliases.map(normalizeSearchString).join(' ') : '';
    const codeMatch =
      item.wilayaCode === normQuery ||
      (item.wilayaCode && !isNaN(Number(normQuery)) && Number(item.wilayaCode) === Number(normQuery));

    return (
      codeMatch ||
      normName.includes(normQuery) ||
      normNameFr.includes(normQuery) ||
      normWilaya.includes(normQuery) ||
      normAddress.includes(normQuery) ||
      normAliases.includes(normQuery)
    );
  });
}

function calculateSimpleDistanceKm(p1: Coordinates, p2: Coordinates): number {
  const R = 6371;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) * Math.cos((p2.lat * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Finds the nearest known Algerian location landmark across all 58 Wilayas
 */
export function findNearestLocalLocation(
  lat: number,
  lng: number
): { item: AlgeriaLocationItem; distKm: number } {
  let bestItem = COMPREHENSIVE_ALGERIA_LOCATIONS[0];
  let bestDist = calculateSimpleDistanceKm({ lat, lng }, bestItem.coords);

  for (const item of COMPREHENSIVE_ALGERIA_LOCATIONS) {
    const d = calculateSimpleDistanceKm({ lat, lng }, item.coords);
    if (d < bestDist) {
      bestDist = d;
      bestItem = item;
    }
  }

  return { item: bestItem, distKm: bestDist };
}
