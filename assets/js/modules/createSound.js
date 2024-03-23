export function CreateSound(pan = 0, fr = 4000, _type = "triangle", vol = .45, time = 15) {
  var context = new (AudioContext || webkitAudioContext)();
  var osc = context.createOscillator(),
    gain = context.createGain();
  const panner = new StereoPannerNode(context, { pan: pan });

  osc.connect(gain);
  gain.connect(panner);
  panner.connect(context.destination);
  osc.type = _type;
  osc.start();
  osc.frequency.value = fr;
  gain.gain.value = vol;
  setTimeout(() => {
    osc.stop();
  }, time);
}
