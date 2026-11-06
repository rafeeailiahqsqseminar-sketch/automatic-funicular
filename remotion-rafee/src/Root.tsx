import {Composition} from 'remotion';
import {Mukadimah, MukadimahProps} from './Mukadimah';

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

export const Root: React.FC = () => (
  <>
    <Composition id="Cinta" component={Mukadimah} defaultProps={cinta} {...base} />
    <Composition id="Kewangan" component={Mukadimah} defaultProps={kewangan} {...base} />
    {/* Transparent versions (no footage) for overlaying in ffmpeg */}
    <Composition id="CintaOverlay" component={Mukadimah} defaultProps={{...cinta, bg: ''}} {...base} />
    <Composition id="KewanganOverlay" component={Mukadimah} defaultProps={{...kewangan, bg: ''}} {...base} />
  </>
);
