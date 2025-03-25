"use client";

import { useEffect, useState } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { createSafeAudioNode } from "@/utils/utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "./ui/label";

export default function MicInput({ index }) {
  const [stream, setStream] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const { audioContext: ctx, addNode } = useAudioContext();
  const [gainNode] = useState(
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx))
  );

  async function scanDevices() {
    return await navigator.mediaDevices
      .enumerateDevices()
      .then((arraymedia) => {
        const validInputs = arraymedia.filter((info) => {
          return info.kind == "audioinput";
        });
        setDevices(validInputs);
      });
  }

  useEffect(() => {
    stream?.getTracks().forEach((track) => track.stop()); // Cleanup
    navigator.mediaDevices
      .getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          deviceId: selectedDevice,
        },
      })
      .then((micStream) => {
        setStream(micStream);
        const source = ctx.createMediaStreamSource(micStream);
        source.connect(gainNode);
        addNode(gainNode, index);
      })
      .catch((err) => console.error("Microphone access denied:", err));

    return () => {
      stream?.getTracks().forEach((track) => track.stop()); // Cleanup on unmount
    };
  }, [index, selectedDevice]);

  return (
    <div className="w-full flex flex-col items-stretch gap-5 border-1 p-6 rounded-3xl shadow-xl">
      <Label>Input Module</Label>
      <Tabs defaultValue="External" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="External">External</TabsTrigger>
          <TabsTrigger value="File">File</TabsTrigger>
          <TabsTrigger value="FreeSound">FreeSound</TabsTrigger>
        </TabsList>
        <TabsContent value="External">
          <div className="w-full flex flex-col items-stretch gap-5 rounded-3xl mt-4">
            <div className="flex gap-3">
              <Select
                onValueChange={setSelectedDevice}
                onOpenChange={scanDevices}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Input" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((d, i) => {
                    return (
                      <SelectItem key={i} value={d.deviceId ? d.deviceId : " "}>
                        {d.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <Label>Volume</Label>
            <Slider
              min={0}
              max={3}
              step={0.001}
              defaultValue={[1]}
              onValueChange={(e) => {
                gainNode.gain.setValueAtTime(e[0], 0);
              }}
            />
          </div>
        </TabsContent>
        <TabsContent value="File">Change your password here.</TabsContent>
        <TabsContent value="FreeSound">Change your password here.</TabsContent>
      </Tabs>
    </div>
  );
}
