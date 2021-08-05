import { Robot } from '../out/lib_class.js';

const roland = new Robot();

await roland.init();

// roland.buzzer({pw:10, ms: 1000});

roland.move();
