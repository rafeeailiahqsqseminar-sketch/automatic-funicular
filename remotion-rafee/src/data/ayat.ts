import {AyatProps} from '../Ayat';
import ubunVo from './ubun_vo.json';
import dengarVo from './dengar_vo.json';
import sulbiVo from './sulbi_vo.json';
import tubuh1Vo from './tubuh1_vo.json';
import tubuh2Vo from './tubuh2_vo.json';
import tubuh3Vo from './tubuh3_vo.json';

// Siri "Keajaiban Al-Quran": teks terjemahan & keterangan ikut nota Cikgu Rafee.
export const ubun: AyatProps = {
  part: '1/3',
  hookTop: 'KENAPA AL-QURAN SEBUT',
  hook: ['UBUN-UBUN?'],
  hl: 'UBUN-UBUN',
  hookSub: 'orang yang membohongi lagi berdosa',
  arab: 'كَلَّا لَئِن لَّمْ يَنتَهِ لَنَسْفَعًا بِالنَّاصِيَةِ ﴿١٥﴾ نَاصِيَةٍ كَاذِبَةٍ خَاطِئَةٍ ﴿١٦﴾',
  surah: 'Surah Al-Alaq, Ayat 15–16',
  terjemahan: '"Ketahuilah, sungguh jika dia tidak berhenti (maka) nescaya Kami tarik ubun-ubunnya (nasiyah), (iaitu) ubun-ubun orang yang membohongi lagi berdosa."',
  anim: 'otak',
  points: [
    {top: 'DI BAWAH DAHI / UBUN-UBUN', title: ['LOBUS', 'FRONTAL'], hl: 'FRONTAL', note: 'Bahagian hadapan otak, tepat di bawah ubun-ubun'},
    {top: 'KHUSUSNYA', title: ['PREFRONTAL', 'CORTEX'], hl: 'PREFRONTAL', note: 'Pusat perancangan & pembuatan keputusan moral'},
    {top: 'DORONGAN BAIK ATAU JAHAT', title: ['PUSAT KAWALAN', 'PENIPUAN'], hl: 'PENIPUAN', note: 'Kawalan pembohongan & membuat keputusan'},
    {top: 'SAINTIS NEUROANATOMI MENDAPATI', title: ['BAHAGIAN INI', 'AKTIF'], hl: 'AKTIF', note: 'Bila seseorang merancang jenayah atau pembohongan'},
  ],
  endLine: 'Al-Quran menyebut "ubun-ubun yang menipu" 1400 tahun dahulu',
};

export const dengar: AyatProps = {
  part: '2/3',
  hookTop: 'KENAPA AL-QURAN SENTIASA SEBUT',
  hook: ['PENDENGARAN', 'DULU?'],
  hl: 'DULU',
  hookSub: 'sebelum penglihatan',
  arab: '...وَجَعَلَ لَكُمُ السَّمْعَ وَالْأَبْصَارَ وَالْأَفْئِدَةَ...',
  surah: 'Surah As-Sajdah, Ayat 9',
  surah2: 'Surah Al-Mulk, Ayat 23',
  terjemahan: '"Dan Dia yang telah menciptakan bagi kamu pendengaran, penglihatan dan hati..."',
  anim: 'janin',
  points: [
    {top: 'AS-SAM‘ MENDAHULUI AL-ABSAR', title: ['PENDENGARAN', 'DULU'], hl: 'DULU', note: 'Bukan kebetulan sastera semata-mata'},
    {top: 'SEMASA DALAM RAHIM', title: ['TELINGA', 'TERBENTUK AWAL'], hl: 'TELINGA', note: 'Telinga dalam terbentuk & berfungsi lebih awal daripada mata'},
    {top: 'TRIMESTER KEDUA', title: ['BAYI SUDAH', 'MENDENGAR'], hl: 'MENDENGAR', note: 'Bunyi dari luar rahim sudah boleh didengar'},
    {top: 'MANAKALA MATA', title: ['KEKAL', 'TERTUTUP'], hl: 'TERTUTUP', note: 'Penglihatan hanya matang sepenuhnya selepas kelahiran'},
  ],
  endLine: 'Susunan Al-Quran selari dengan kronologi biologi janin',
};

export const sulbi: AyatProps = {
  part: '3/3',
  hookTop: 'ASAL KEJADIAN MANUSIA',
  hook: ['ANTARA SULBI', "& TARA'IB?"],
  hl: 'SULBI',
  hookSub: 'rahsia embriologi dalam Surah At-Tariq',
  arab: 'خُلِقَ مِن مَّاءٍ دَافِقٍ ﴿٦﴾ يَخْرُجُ مِن بَيْنِ الصُّلْبِ وَالتَّرَائِبِ ﴿٧﴾',
  surah: 'Surah At-Tariq, Ayat 6–7',
  terjemahan: '"Dia diciptakan dari air yang memancar, yang keluar dari antara tulang sulbi (tulang belakang) dan tulang dada (tara\'ib)."',
  anim: 'sulbi',
  points: [
    {top: 'RUJUKAN ANATOMI', title: ["SULBI &", "TARA'IB"], hl: 'SULBI', note: 'Tulang belakang dan tulang dada'},
    {top: 'PERINGKAT AWAL EMBRIO', title: ['TESTIS &', 'OVARI'], hl: 'OVARI', note: 'Mula terbentuk di bahagian belakang, berhampiran tulang belakang'},
    {top: 'SALURAN DARAH UTAMA', title: ['DARI ANTARA', 'SULBI & DADA'], hl: 'SULBI', note: 'Membekalkan darah ke organ pembiakan'},
    {top: 'KEMUDIAN', title: ['TURUN KE', 'KEDUDUKAN KEKAL'], hl: 'KEKAL', note: 'Titik asal biologi manusia yang sangat tersembunyi'},
  ],
  endLine: 'Perincian embriologi yang tersembunyi, disebut dalam Al-Quran',
};

// Ubun-Ubun dengan suara ElevenLabs (ubun_ubun.mp3, 66.7 s): babak ikut masa perkataan dalam SRT
export const ubunVO: AyatProps = {
  ...ubun,
  words: ubunVo.words,
  timing: {ayat: 7.3, tr0: 11.7, tr1: 23.4, points: [23.9, 30.75, 38.2, 45.1], end: 55.0, total: 66.7},
};

// Pendengaran dengan suara ElevenLabs (pendengaran.mp3, 80.1 s)
export const dengarVO: AyatProps = {
  ...dengar,
  words: dengarVo.words,
  timing: {ayat: 5.9, tr0: 13.1, tr1: 20.0, points: [20.4, 32.9, 44.4, 51.5], end: 59.6, total: 80.1},
};

// Sulbi & Tara'ib dengan suara ElevenLabs (Tulang_Sulbi.mp3, 78.3 s)
export const sulbiVO: AyatProps = {
  ...sulbi,
  words: sulbiVo.words,
  timing: {ayat: 4.4, tr0: 10.7, tr1: 20.6, points: [21.5, 29.55, 45.8, 54.85], end: 58.3, total: 78.3},
};

// Siri "Tubuh & Tanda" (peta emosi tubuh), gaya Keajaiban: teks ikut skrip VO Cikgu Rafee
export const tubuh1VO: AyatProps = {
  part: '1/3',
  badge: 'TUBUH & TANDA',
  hookTop: 'PERNAH TAK KAU BANGUN PAGI',
  hook: ['BADAN RASA', 'PENAT?'],
  hl: 'PENAT?',
  hookSub: 'macam tak tidur langsung',
  arab: '',
  surah: 'Peta Emosi Tubuh',
  kadLabel: 'PETA EMOSI TUBUH',
  image: 'peta_emosi.jpg',
  terjemahan: '"Mungkin bukan badan kau yang letih, tapi hati kau yang dah terlalu lama menahan."',
  anim: 'tubuh',
  points: [
    {top: 'KEPALA BERAT', title: ['TERTEKAN'], hl: 'TERTEKAN', note: 'Fikiran yang tak pernah berhenti'},
    {top: 'LEHER TEGANG', title: ['SUKAR', 'MEMAAFKAN'], hl: 'MEMAAFKAN', note: 'Ada nama yang belum mampu dimaafkan'},
    {top: 'BAHU SAKIT', title: ['BEBAN', 'EMOSI'], hl: 'EMOSI', note: 'Memikul semuanya sorang-sorang'},
    {top: 'BELAKANG LENGUH', title: ['KURANG', 'PERHATIAN'], hl: 'PERHATIAN', note: 'Terlalu lama rasa tak dihargai'},
  ],
  endBig: 'BADAN KAU TAK MENIPU',
  endLine: 'Dia cuma sedang bercakap.',
  words: tubuh1Vo.words,
  timing: {ayat: 3.2, tr0: 7.18, tr1: 12.96, points: [14.2, 25.02, 35.84, 48.91], end: 54.05, total: 61.15},
};

// Tubuh & Tanda 2 (badan & tangan). Tanpa suara dahulu; tambah words + timing bila MP3 + SRT ElevenLabs sampai.
export const tubuh2: AyatProps = {
  part: '2/3',
  badge: 'TUBUH & TANDA',
  hookTop: 'ADA SAKIT YANG DOKTOR',
  hook: ['TAK JUMPA', 'PUNCANYA?'],
  hl: 'PUNCANYA?',
  hookSub: 'sebab puncanya… dalam hati',
  arab: '',
  surah: 'Peta Emosi Tubuh',
  kadLabel: 'PETA EMOSI TUBUH',
  image: 'peta_emosi.jpg',
  terjemahan: '"Sebab puncanya bukan dalam darah, tapi dalam hati."',
  anim: 'tubuh2',
  points: [
    {top: 'PINGGANG SAKIT', title: ['KEBIMBANGAN', 'KEWANGAN'], hl: 'KEWANGAN', note: 'Risau duit, hutang, masa depan anak-anak'},
    {top: 'PINGGUL TEGANG', title: ['TAKUT', 'BERUBAH'], hl: 'BERUBAH', note: 'Takut melangkah walau tempat dah tak sesuai'},
    {top: 'SIKU & LENGAN', title: ['SUKAR', 'BERADAPTASI'], hl: 'BERADAPTASI', note: 'Terpaksa ikut arus yang hati tak setuju'},
    {top: 'PERGELANGAN TANGAN', title: ['RASA', 'TERKONGKONG'], hl: 'TERKONGKONG', note: 'Macam tangan yang diikat'},
  ],
  endBig: 'KAU BUKAN LEMAH',
  endLine: 'Kau cuma terlalu lama jadi kuat.',
};

// Tubuh & Tanda 2 dengan suara ElevenLabs (Peta_Emosi_2.mp3, 52.6 s)
export const tubuh2VO: AyatProps = {
  ...tubuh2,
  words: tubuh2Vo.words,
  timing: {ayat: 3.6, tr0: 4.14, tr1: 8.92, points: [9.62, 21.64, 31.46, 38.77], end: 46.04, total: 52.61},
};

// Tubuh & Tanda 3 (kaki) dengan suara ElevenLabs (Peta_emosi_3.mp3, 63.0 s)
export const tubuh3VO: AyatProps = {
  part: '3/3',
  badge: 'TUBUH & TANDA',
  hookTop: 'KAKI NI YANG BAWA KAU',
  hook: ['SEJAUH', 'INI'],
  hl: 'SEJAUH',
  hookSub: 'dari lutut hingga tapak kaki',
  arab: '',
  surah: 'Peta Emosi Tubuh',
  kadLabel: 'PETA EMOSI TUBUH',
  image: 'peta_emosi.jpg',
  terjemahan: '"Tapi pernah tak kau tanya apa yang dia tanggung?"',
  anim: 'tubuh3',
  points: [
    {top: 'LUTUT SAKIT', title: ['TERLAMPAU', 'EGO'], hl: 'EGO', note: 'Susah nak tunduk, susah mengaku salah'},
    {top: 'PAHA & BETIS TEGANG', title: ['TEKANAN', 'CEMBURU'], hl: 'CEMBURU', note: 'Asyik bandingkan diri dengan orang'},
    {top: 'BUKU LALI SAKIT', title: ['TEKANAN HIDUP', 'TERLAMPAU'], hl: 'TERLAMPAU', note: 'Beban hidup terlalu berat'},
    {top: 'TAPAK KAKI', title: ['DEPRESI'], hl: 'DEPRESI', note: 'Sedih yang tak pernah diceritakan'},
  ],
  endBig: 'PELUK DIRI SENDIRI',
  endLine: '"Terima kasih sebab tak pernah tinggalkan aku." Jaga badan, jaga hati.',
  words: tubuh3Vo.words,
  timing: {ayat: 3.1, tr0: 3.54, tr1: 6.64, points: [7.44, 17.38, 27.62, 35.34], end: 45.6, total: 63.01},
};
