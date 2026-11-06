import {Composition} from 'remotion';
import {Mukadimah, MukadimahProps} from './Mukadimah';
import {FullVideo, FullVideoProps} from './FullVideo';
import duitData from './data/duit.json';
import {Quantum, QuantumProps} from './Quantum';

const FPS = 30;
const base = {width: 1080, height: 1920, fps: FPS, durationInFrames: Math.round(5.6 * FPS)};

const cinta: MukadimahProps = {
  scene: 'cinta',
  bg: 'bg_cinta.mp4',
  top: 'PSIKOLOGI CINTA',
  title: ['KENAPA KITA', 'JATUH CINTA?'],
  sub: 'Otak yang pilih, bukan hati',
  accent: '#FF3D6E',
  sceneY: 1040,
  cardY: 1230,
};
const kewangan: MukadimahProps = {
  scene: 'kewangan',
  bg: 'bg_kewangan.mp4',
  top: 'PSIKOLOGI KEWANGAN',
  title: ['KENAPA DUIT', 'CEPAT HABIS?'],
  sub: 'Bukan gaji kecil, tapi tabiat',
  accent: '#E8312A',
  sceneY: 1225,
  cardY: 1220,
};

// 3 Tanda Kau Memaafkan: card times from the SRT (_Tanda_Memaafkan__ind.srt)
const memaafkan: FullVideoProps = {
  src: 'bg_memaafkan.mov',
  scene: 'maaf',
  sceneY: 1130,
  cardY: 1190,
  intro: {t: 2.45, d: 2.9, top: '3 TANDA KAU', title: ['MEMAAFKAN'], sub: 'atau sekadar melupakan?'},
  cards: [
    {t: 17.3, d: 3.3, top: 'TANDA PERTAMA', title: ['HATI RASA', 'TAK SEDAP'], hl: 'SEDAP'},
    {t: 41.0, d: 4.6, top: 'TANDA KEDUA', title: ['TUBUH TAK', 'PERNAH LUPA'], hl: 'LUPA'},
    {t: 59.3, d: 3.6, top: 'TANDA KETIGA', title: ['JUJUR DENGAN', 'DIRI SENDIRI'], hl: 'JUJUR'},
    {t: 84.9, d: 2.6, top: 'TANDA KEEMPAT', title: ['RAMAI TAK', 'PERASAN'], hl: 'PERASAN'},
    {t: 93.9, d: 5.0, top: 'JAWAB DALAM HATI', title: ['LEGA ATAU', 'TAK PUAS HATI?'], hl: 'LEGA'},
    {t: 103.0, d: 4.4, top: 'TANDA KEEMPAT DALAM GROUP', title: ['KLIK', 'LINK BIO'], hl: 'BIO', accent: '#E8312A'},
    {t: 114.0, d: 5.0, top: 'KALAU DAH BERSEDIA', title: ['KOMEN', 'SEDIA'], hl: 'SEDIA'},
  ],
};

// Kenapa Duit Cepat Habis: no burned captions -> karaoke captions from the SRT; long pauses cut (tools/prep_srt.py)
const R = '#E8312A';
const duit: FullVideoProps = {
  src: 'bg_duit.mp4',
  scene: 'kewangan',
  sceneY: 390,
  cardY: 380,
  zoomY: 590,
  cuts: duitData.cuts,
  words: duitData.words,
  captionY: 1470,
  fg: 'fg_duit.webm',
  header: {top: 'PSIKOLOGI KEWANGAN', title: ['KENAPA DUIT', 'CEPAT HABIS?'], y: 655, fs: 128, stepLabel: 'PERANGKAP', steps: [24.6, 41.0, 57.5], accent: R},
  intro: {t: 2.45, d: 2.9, top: 'PSIKOLOGI KEWANGAN', title: ['KENAPA DUIT', 'CEPAT HABIS?'], sub: 'Bukan gaji kecil, tapi tabiat', accent: R},
  cards: [
    {t: 17.6, d: 3.6, top: 'BUKAN GAJI KECIL', title: ['OTAK KITA', 'TIPU KITA'], hl: 'TIPU', accent: R},
    {t: 21.9, d: 2.5, top: 'AWAS', title: ['3 PERANGKAP'], hl: 'PERANGKAP', accent: R},
    {t: 24.6, d: 4.2, top: 'PERANGKAP PERTAMA', title: ['OTAK SUKA', 'SEKARANG'], hl: 'SEKARANG', accent: R},
    {t: 41.0, d: 5.2, top: 'PERANGKAP KEDUA', title: ['DUIT KECIL', 'TAK RASA DUIT'], hl: 'KECIL', accent: R},
    {t: 54.2, d: 3.2, top: 'KECIL-KECIL, TAPI SEBULAN', title: ['CECAH', 'RATUSAN'], hl: 'RATUSAN', accent: R},
    {t: 57.5, d: 4.3, top: 'PERANGKAP KETIGA', title: ['BELANJA UNTUK', 'ORANG LAIN'], hl: 'LAIN', accent: R},
    {t: 67.8, d: 4.5, top: 'BUKAN KEPERLUAN', title: ['ITU', 'NAFSU'], hl: 'NAFSU', accent: R},
    {t: 75.1, d: 4.7, top: 'BILA GAJI MASUK', title: ['ASINGKAN DULU', 'SIMPANAN'], hl: 'ASINGKAN', accent: '#16A34A'},
    {t: 84.0, d: 5.6, top: 'DUIT TAK LARI', title: ['TABIAT KITA', 'YANG HALAU'], hl: 'TABIAT', accent: R},
    {t: 90.3, d: 7.9, top: 'BERGABUNG BERSAMA', title: ['KOMUNITI KAMI'], sub: 'Klik link bio', hl: 'KAMI', accent: R},
  ],
};

// Selamat Datang ke Dunia Quantum: stage times read from the clip's own labels
const quantum: QuantumProps = {
  src: 'bg_quantum.mp4',
  badge: 'SAINS · FIZIK QUANTUM',
  titleTop: 'SELAMAT DATANG KE',
  title: 'DUNIA QUANTUM',
  endT: 116.8,
  stages: [
    {t: 0, name: 'JOM ZOOM', note: 'masuk ke dalam sehelai rambut', exp: 0},
    {t: 14.5, name: 'RAMBUT', size: '100 µm', note: 'Setebal 0.1 milimeter sahaja', exp: -4},
    {t: 21.5, name: 'SEL', size: '10 µm', note: '10 kali lebih kecil daripada rambut', exp: -5},
    {t: 29.5, name: 'MAKROFIBRIL', size: '1 µm', note: 'Gentian halus dalam setiap sel', exp: -6},
    {t: 36.5, name: 'MIKROFIBRIL', size: '10 nm', note: '100 kali lebih halus lagi', exp: -8},
    {t: 44.0, name: 'PROTOFIBRIL', size: '2.8 nm', note: 'Lilitan protein yang bersambung', exp: -8.55},
    {t: 51.5, name: 'KERATIN', size: '2 nm', note: 'Protein utama yang membina rambut', exp: -8.7},
    {t: 59.0, name: 'ATOM', size: '50–90 pm', note: 'Karbon, oksigen, nitrogen dan sulfur', exp: -10.1},
    {t: 69.0, name: 'KARBON', size: '67 pm', note: 'Asas kepada semua kehidupan', exp: -10.2},
    {t: 74.0, name: 'ORBITAL ELEKTRON', note: 'Elektron bukan bola, tapi awan kebarangkalian', exp: -10.4},
    {t: 80.5, name: 'RUANG KOSONG', note: 'Atom hampir 100% ruang kosong', exp: -11.5},
    {t: 87.0, name: 'NUKLEUS', note: '100,000 kali lebih kecil daripada atom', exp: -14},
    {t: 94.5, name: 'PROTON & NEUTRON', note: 'Penghuni nukleus atom', exp: -14.6},
    {t: 100.0, name: 'PROTON', size: '1 fm', note: '0.000 000 000 000 001 meter', exp: -15},
    {t: 112.0, name: 'KUARK', note: '2 Up + 1 Down. Inilah dunia quantum!', exp: -15},
  ],
};

export const Root: React.FC = () => (
  <>
    <Composition id="DuniaQuantum" component={Quantum} defaultProps={quantum} width={1080} height={1920} fps={25} durationInFrames={3030} />
    <Composition id="DuitCepatHabis" component={FullVideo} defaultProps={duit} width={1080} height={1920} fps={30} durationInFrames={Math.floor(duitData.duration * 30)} />
    <Composition id="Memaafkan" component={FullVideo} defaultProps={memaafkan} width={1080} height={1920} fps={30} durationInFrames={3836} />
    <Composition id="Cinta" component={Mukadimah} defaultProps={cinta} {...base} />
    <Composition id="Kewangan" component={Mukadimah} defaultProps={kewangan} {...base} />
    {/* Transparent versions (no footage) for overlaying in ffmpeg */}
    <Composition id="CintaOverlay" component={Mukadimah} defaultProps={{...cinta, bg: ''}} {...base} />
    <Composition id="KewanganOverlay" component={Mukadimah} defaultProps={{...kewangan, bg: ''}} {...base} />
  </>
);
