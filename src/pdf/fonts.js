import { Font } from '@react-pdf/renderer';
import orbitron400 from '../assets/fonts/orbitron-400.woff';
import orbitron700 from '../assets/fonts/orbitron-700.woff';

Font.register({
  family: 'Orbitron',
  fonts: [
    { src: orbitron400, fontWeight: 400 },
    { src: orbitron700, fontWeight: 700 },
  ],
});
Font.registerHyphenationCallback(word => [word]);
