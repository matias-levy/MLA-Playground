// random-noise-processor.js
class RandomNoiseProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    output.forEach((channel) => {
      for (let i = 0; i < channel.length; i++) {
        channel[i] = (Math.random() * 2 - 1) * parameters["volume"][i];
      }
    });
    return true;
  }

  // define the customGain parameter used in process method
  static get parameterDescriptors() {
    return [
      {
        name: "volume",
        defaultValue: 1,
        minValue: 0,
        maxValue: 1,
        automationRate: "a-rate",
      },
    ];
  }
}

registerProcessor("random-noise-processor", RandomNoiseProcessor);
