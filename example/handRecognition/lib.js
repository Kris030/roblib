let socket;
export const init = (ip) => {
    const man = new io.Manager(ip);
    socket = man.socket('/io', {});
    socket.on('connect', () => {
        console.log('Connected!');
    });
    return new Promise(res => socket.on('connect', res));
};
export const getSensorData = () => {
    socket.emit('tracksensor');
    return new Promise(res => socket.once('return-tracksensor', ({ data }) => res(data)));
};
export const move = ({ left = 0, right = 0 } = {}) => {
    if (left < -100 || left > 100 || right < -100 || right > 100)
        throw `Values should be between -100 and 100`;
    socket.emit('move', { left, right });
};
export const LED = ({ r = false, g = false, b = false } = {}) => {
    socket.emit('led', { r, g, b });
};
export const buzzer = ({ pw = 0, ms = 0 } = {}) => {
    if (pw < 0 || pw > 100)
        throw 'PW values should be between 0 and 100';
    if (ms <= 0)
        throw 'MS values should be greater than 0';
    socket.emit('buzzer', { pw, ms });
};
export const stop = () => void socket.emit('stop');
export const sleep = (ms) => new Promise(res => setTimeout(res, ms));
export const servo = (absoluteDegree) => {
    if (absoluteDegree < -90 || absoluteDegree > 90)
        throw 'Values should be between -90 and 90';
    socket.emit('servo', { degree: absoluteDegree });
};
export const exit = (stops = false) => {
    if (stops)
        stop();
    socket.close();
};
//# sourceMappingURL=lib.js.map