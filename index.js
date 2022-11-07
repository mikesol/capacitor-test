// instantiate our Web Audio context
import mp3Url from "./assets/bitcrusher-24bits-1x-downsampling.mp3";


let context;

// bind to our html component selectors and sliders to handle manipulation events
const startButton = document.querySelector('button[name="start"]');
const stopButton = document.querySelector('button[name="stop"]');
const infoButton = document.querySelector('button[name="info"]');
const downsampling = document.querySelector('input[name="downsampling"]');
const downsamplingValue = document.querySelector(".downsampling-value");
const bits = document.querySelector('input[name="bits"]');
const bitsValue = document.querySelector(".bits-value");
const volume = document.querySelector('input[name="volume"]');
const volumeValue = document.querySelector(".volume-value");
const sourceInputs = document.querySelectorAll('input[name="source-selector"]');
const sourceSelector = document.querySelector(".source-selector");

const parameterData = {
  bitDepth: 2,
  downsampling: 1,
};

startButton.addEventListener("click", init);

bitsValue.innerText = bits.value;
volumeValue.innerText = volume.value;
downsamplingValue.innerText = downsampling.value;

// when the various sliders are adjusted, update their corresponding internal data
volume.addEventListener("input", ({ target }) => {
  volumeValue.innerText = target.value;
});

bits.addEventListener("input", ({ target }) => {
  bitsValue.innerText = target.value;
});

downsampling.addEventListener("input", ({ target }) => {
  downsamplingValue.innerText = target.value;
});

async function init() {
  context =  new AudioContext();
  // when the 'start' button is clicked, reset source corresponding to the selected radio button.
  let source;
  const sourceType = [...sourceInputs].filter((input) => input.checked)[0]
    .value;

  if (sourceType === "audio") {
    const url = mp3Url;
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    source = context.createBufferSource();
    source.buffer = audioBuffer;
  } else {
    source = context.createOscillator();
    source.frequency.value = 440;
    source.type = sourceType;
  }

  // register our bitcrusher audio worklet code globally so it's accessible within the WorkletNode thread
  await context.audioWorklet.addModule("bitcrusher.js");

  // initialize our bitcrusher node to use our 'bitcrusher.js' code
  const bitCrusherNode = new AudioWorkletNode(context, "bitcrusher", {
    parameterData,
  });

  // use the node's getter to get a reference to the parameters we need
  const bitDepthParam = bitCrusherNode.parameters.get("bitDepth");
  const downsamplingParam = bitCrusherNode.parameters.get("downsampling");

  const gainNode = context.createGain();
  gainNode.gain.value = volume.value;

  volume.addEventListener("input", ({ target }) => {
    gainNode.gain.value = parseFloat(target.value);
  });

  downsampling.addEventListener("input", ({ target }) => {
    downsamplingParam.value = parseInt(target.value);
  });

  bits.addEventListener("input", ({ target }) => {
    bitDepthParam.value = parseInt(target.value);
  });

  stopButton.addEventListener("click", () => {
    source.stop();
  });

  // Connect the source audio node to the input of the bitcrusher
  source.connect(bitCrusherNode);

  // connect the bitcrusher's output to the gain node (so we can control the output volume)
  bitCrusherNode.connect(gainNode);

  // connect the gain node's output to the master output
  gainNode.connect(context.destination);

  // since this code is triggered every time the play button is pressed, we want to play the source
  source.start();
}

startButton.addEventListener("click", init);
