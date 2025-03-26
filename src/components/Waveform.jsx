import React, { useRef, useEffect, useState } from "react";

const getWaveformData = (audioBuffer) => {
  const channelData = audioBuffer.getChannelData(0); // Get the first channel
  const data = [];
  const length = channelData.length;
  for (let i = 0; i < length; i++) {
    data.push(channelData[i]);
  }
  return data;
};

const Waveform = ({ audioBuffer, loop, start, end }) => {
  const canvasRef = useRef(null);
  const canvasPlayheadRef = useRef(null);
  const [waveformData, setWaveformData] = useState([]);

  useEffect(() => {
    if (audioBuffer) {
      setWaveformData(getWaveformData(audioBuffer)); // Update waveform data
    }
  }, [audioBuffer]);

  useEffect(() => {
    if (waveformData.length > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Set canvas size
      canvas.width = 800; // You can adjust this to fit your needs
      canvas.height = 100;

      // Clear canvas before redrawing
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the waveform
      const step = Math.ceil(waveformData.length / canvas.width); // Step to scale data across the canvas width
      const amplitude = canvas.height / 2;

      ctx.beginPath();
      ctx.moveTo(0, amplitude);

      for (let i = 0; i < canvas.width; i++) {
        const sample = waveformData[i * step] || 0;
        const y = amplitude + sample * amplitude; // Map sample to canvas height
        ctx.lineTo(i, y);
      }

      ctx.strokeStyle = "black"; // Set color for waveform
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [waveformData, audioBuffer]);

  useEffect(() => {
    const canvas = canvasPlayheadRef.current;
    const ctx = canvas.getContext("2d");

    // Set canvas size
    canvas.width = 800; // You can adjust this to fit your needs
    canvas.height = 100;

    if (loop) {
      // Clear canvas before redrawing
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const startX = (start * canvas.width) / 100;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, canvas.height);
      ctx.strokeStyle = "rgba(0,0,0,0.5)"; // Start color
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, startX, canvas.height);

      const endX = (end * canvas.width) / 100;
      ctx.beginPath();
      ctx.moveTo(endX, 0);
      ctx.lineTo(endX, canvas.height);
      // ctx.strokeStyle = "black"; // Start color
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillRect(endX, 0, canvas.width - endX, canvas.height);
    } else {
      // Clear canvas before redrawing
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const startX = (start * canvas.width) / 100;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, canvas.height);
      ctx.strokeStyle = "rgba(0,0,0,0.5)"; // Start color
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, startX, canvas.height);
    }
  }, [loop, start, end]);

  return (
    <div className="relative w-full h-[75.5px]">
      <canvas ref={canvasRef} className="absolute top-0 left-0 z-0 w-full" />
      <canvas
        ref={canvasPlayheadRef}
        className="absolute top-0 left-0 z-1 w-full"
      />
    </div>
  );
};

export default Waveform;
