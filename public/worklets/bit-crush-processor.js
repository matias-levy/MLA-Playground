class BitCrushProcessor extends AudioWorkletProcessor {
  holdValue = 0;
  count = 0;

  scale(number, inMin, inMax, outMin, outMax) {
    // if you need an integer value use Math.floor or Math.ceil here
    return ((number - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
  }

  process(inputs, outputs, parameters) {
    const inputChannels = inputs[0];
    const outputChannels = outputs[0];
    const reduction = parameters["reduction"].length
      ? parameters["reduction"][0]
      : 1;
    const bits = parameters["bits"].length ? parameters["bits"][0] : 31;

    for (let c = 0; c < outputChannels.length; c++) {
      let input = inputChannels[c] || new Float32Array(128); // Default to silence if no input
      let output = outputChannels[c];

      for (let i = 0; i < input.length; i++) {
        // Actual proccesing block
        if (this.count >= reduction) {
          this.count = 0;
          let bit32int = Math.floor(this.scale(input[i], -1, 1, 0, 2 ** 31));
          bit32int = (bit32int | 0) >> (32 - bits);
          let float = this.scale(bit32int, 0, 2 ** (bits - 1), -1, 1);
          this.holdValue = float;
        }
        this.count++;

        output[i] = this.holdValue;
      }
    }

    return true;
  }

  static get parameterDescriptors() {
    return [
      {
        name: "reduction",
        defaultValue: 1,
        minValue: 0,
        maxValue: 88,
        automationRate: "a-rate",
      },
      {
        name: "bits",
        defaultValue: 31,
        minValue: 1,
        maxValue: 31,
        automationRate: "a-rate",
      },
    ];
  }
}

registerProcessor("bit-crush-processor", BitCrushProcessor);
