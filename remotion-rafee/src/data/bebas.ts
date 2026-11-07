import {Beat} from '../BebasMasaLalu';

// "Bebas dari Masa Lalu" — the written script, split into beats (text kept word for word).
// d = beat length, r = time until the last word is spoken (from the ElevenLabs VO, public/bebas_vo.mp3).
export const bebasBeats: Beat[] = [
  {d: 2.7, r: 1.04, vis: 'bismillah', text: 'Bismillahirrahmanirrahim...', hl: ['Bismillahirrahmanirrahim...']},
  {d: 3.55, r: 2.74, vis: 'renung', text: 'Pernahkah kita merenung sejenak, wahai sahabat...', hl: ['merenung']},
  {d: 5.9, r: 4.99, vis: 'renung', text: 'di manakah letaknya diri kita yang sebenar di sebalik sibuknya dunia ini?', hl: ['diri kita yang sebenar']},
  {d: 10.1, r: 9.17, vis: 'dna', text: 'Dunia sains hari ini, melalui kajian tentang Efek Fantom DNA, baru sahaja mencakar permukaan sebuah rahsia besar.', hl: ['Efek Fantom DNA', 'rahsia besar.']},
  {d: 6.3, r: 6.03, vis: 'dna', text: 'Saintis terkejut apabila mendapati, walaupun bentuk fizikalnya telah tiada di dalam ruang,', hl: ['telah tiada']},
  {d: 7.55, r: 6.65, vis: 'dna', text: 'gelombang dan jejak tenaga cahaya itu tetap ada, seolah-olah ia masih di situ.', hl: ['jejak tenaga cahaya', 'tetap ada,']},
  {d: 2.35, r: 0.9, vis: 'akbar', text: 'Allahu Akbar...', hl: ['Allahu Akbar...']},
  {d: 4.6, r: 3.59, vis: 'akbar', text: 'Bukankah hakikat ini telah lama diajar oleh para arif billah?', hl: ['arif billah?']},
  {d: 9.15, r: 8.53, vis: 'hati', text: 'Apa sahaja yang pernah hadir, apa sahaja beban, luka, dan sejarah silam yang pernah singgah di ruang hati kita,', hl: ['beban,', 'luka,', 'sejarah silam']},
  {d: 5.3, r: 4.22, vis: 'hati', text: 'ia meninggalkan bayang dan jejak yang tidak nampak pada mata kasar.', hl: ['bayang', 'jejak']},
  {d: 8.25, r: 7.6, vis: 'hati', text: "Sesiapa yang masih memikul saki-baki masa lalu, jiwanya akan terus dihantui oleh 'fantom' emosi itu.", hl: ['masa lalu,', "'fantom' emosi"]},
  {d: 8.95, r: 8.19, vis: 'beban', text: 'Sebab itulah, seribu kali kita berikhtiar dengan akal yang penat, rezeki dan ketenangan tetap terasa jauh.', hl: ['rezeki', 'ketenangan', 'terasa jauh.']},
  {d: 1.25, r: 0.6, vis: 'beban', text: 'Mengapa?', hl: ['Mengapa?']},
  {d: 4.45, r: 3.33, vis: 'beban', text: 'Kerana kita sedang melangkah dengan beban masa semalam.', hl: ['beban masa semalam.']},
  {d: 5.05, r: 4.14, vis: 'mutmainnah', text: "Wahai jiwa yang tenang... An-Nafsu Al-Mutma'innah...", hl: ['jiwa yang tenang...', "An-Nafsu Al-Mutma'innah..."]},
  {d: 4.2, r: 3.39, vis: 'mutmainnah', text: 'Usah disiksa dirimu dengan logik dunia yang sempit.', hl: ['logik dunia yang sempit.']},
  {d: 2.9, r: 2.15, vis: 'zero', text: 'Padamkan sebentar bisingnya kepala.', hl: ['Padamkan']},
  {d: 8.85, r: 8.05, vis: 'klip', text: 'Masuklah ke dalam ruang Zero Thinking—ruang fana di mana engkau melepaskan segala sandaran selain Allah.', hl: ['Zero Thinking—ruang fana', 'selain Allah.'], clip: {src: 'bg_bebas_a.mp4', from: 12}},
  {d: 3.2, r: 2.48, vis: 'klip', text: 'Di situlah terletaknya Radar Jiwa.', hl: ['Radar Jiwa.'], clip: {src: 'bg_bebas_a.mp4', from: 12}},
  {d: 8.6, r: 7.72, vis: 'radar', text: 'Di situlah pintu Privilege DNA yang Allah kurniakan kepada hamba-hamba-Nya yang suci dibuka kembali.', hl: ['Privilege DNA', 'dibuka kembali.']},
  {d: 6.1, r: 5.8, vis: 'kanvas', text: 'Engkau akan melihat, dengan izin-Nya, bahawa masa lalu itu hanyalah bayang-bayang,', hl: ['hanyalah bayang-bayang,']},
  {d: 5.4, r: 4.3, vis: 'kanvas', text: 'dan masa depan adalah kanvas suci yang menunggu takdir-Nya.', hl: ['kanvas suci']},
  {d: 4.85, r: 4.22, vis: 'fitrah', text: 'Jangan biarkan bayang semalam merampas kedamaian hari ini.', hl: ['kedamaian hari ini.']},
  {d: 4.45, r: 3.43, vis: 'klip', text: 'Bersihkan qolbu, kembali kepada fitrah asalmu.', hl: ['Bersihkan qolbu,', 'fitrah asalmu.'], clip: {src: 'bg_bebas_b.mp4', from: 2}},
  {d: 7.6, r: 6.94, vis: 'klip', text: 'Jika hatimu terpanggil untuk merungkai jalan pulang ini, jemputlah sertai majlis ilmu kita secara percuma,', hl: ['jalan pulang', 'percuma,'], clip: {src: 'bg_bebas_b.mp4', from: 2}},
  {d: 17.7, r: 12.44, vis: 'akhir', text: ''},
];
