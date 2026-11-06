import {Composition} from 'remotion';
import {Mukadimah, MukadimahProps} from './Mukadimah';
import {FullVideo, FullVideoProps} from './FullVideo';

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

export const Root: React.FC = () => (
  <>
    <Composition id="Memaafkan" component={FullVideo} defaultProps={memaafkan} width={1080} height={1920} fps={30} durationInFrames={3836} />
    <Composition id="Cinta" component={Mukadimah} defaultProps={cinta} {...base} />
    <Composition id="Kewangan" component={Mukadimah} defaultProps={kewangan} {...base} />
    {/* Transparent versions (no footage) for overlaying in ffmpeg */}
    <Composition id="CintaOverlay" component={Mukadimah} defaultProps={{...cinta, bg: ''}} {...base} />
    <Composition id="KewanganOverlay" component={Mukadimah} defaultProps={{...kewangan, bg: ''}} {...base} />
  </>
);
