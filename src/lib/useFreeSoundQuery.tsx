import { AudioModule } from "@/components/AudioProvider";
import { useEffect, useState } from "react";

export default function useFreeSoundQuery() {
  const [selectedSound, setSelectedSound] = useState(null);
  const [result, setResult] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  return {
    selectedSound,
    setSelectedSound,
    result,
    setResult,
    query,
    setQuery,
    loading,
    setLoading,
    downloading,
    setDownloading,
  };
}
