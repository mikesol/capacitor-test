  // bitcrusher.js 

  class BitCrusher extends AudioWorkletProcessor {

    // implement static getters so we can access and update them from our bitcrusher instance in the app code (the main thread)
    static get parameterDescriptors () {
        return [{
          name: 'bitDepth',
          defaultValue: 12,
          minValue: 1,
          maxValue: 16
        }, {
          name: 'downsampling',
          defaultValue: 1,
          minValue: 1,
          maxValue: 40
        }];
      }

    constructor(options) {
      super()
      this._lastSampleValue = 0
    }

    process(inputs, outputs, parameters) {

      const input = inputs[0]
      const output = outputs[0]
      const bits = parameters.bitDepth[0]
      const downsampling = parameters.downsampling[0]

      for (let channelIndex = 0; channelIndex < output.length; ++channelIndex) {
        for (let sampleIndex = 0; sampleIndex < output[channelIndex].length; ++sampleIndex) {

          if (!input[channelIndex]) return false

          // sample and hold: update last sample value every <downsample>th sample 
          if (sampleIndex % downsampling === 0) {
            const step = Math.pow(0.5, bits)
            this._lastSampleValue = step * Math.floor(input[channelIndex][sampleIndex]/step)
          }

          output[channelIndex][sampleIndex] = this._lastSampleValue

        }
      }

      return true
    }

  }
  registerProcessor("bitcrusher", BitCrusher);
