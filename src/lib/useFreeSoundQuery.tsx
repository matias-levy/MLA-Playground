import { SetStateAction, useState } from "react";

export interface FreeSoundResult {
  id: number;
  name: string;
  username: string;
  previews: { "preview-lq-mp3": string };
}

export interface FreeSoundResults {
  next: string | null;
  results: FreeSoundResult[];
}

export interface FreeSoundObjectProps {
  selectedSound: number | null;
  setSelectedSound: React.Dispatch<SetStateAction<number | null>>;
  result: FreeSoundResults | null;
  setResult: React.Dispatch<SetStateAction<FreeSoundResults | null>>;
  query: string;
  setQuery: React.Dispatch<SetStateAction<string>>;
  loading: boolean;
  setLoading: React.Dispatch<SetStateAction<boolean>>;
  downloading: boolean;
  setDownloading: React.Dispatch<SetStateAction<boolean>>;
  fetchingMore: boolean;
  setFetchingMore: React.Dispatch<SetStateAction<boolean>>;
}

export default function useFreeSoundQuery(): FreeSoundObjectProps {
  const [selectedSound, setSelectedSound] = useState<number | null>(null);
  const [result, setResult] = useState<FreeSoundResults | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
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
    fetchingMore,
    setFetchingMore,
  };
}
