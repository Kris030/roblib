import { init, stop } from './lib';

await init(process.env['ROBLIB_IP'] || '192.168.0.1:5000');

stop();

console.log('STOPPING ROBOT');
