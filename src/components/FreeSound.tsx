"use client";

import { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { FreeSoundObjectProps } from "@/lib/useFreeSoundQuery";

import {
  Command,
  CommandEmpty,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export interface FreeSoundProps {
  setCurrentFile: Dispatch<SetStateAction<Blob | null>>;
  setFileIsAudio: Dispatch<SetStateAction<boolean>>;
  freeSoundObjectProps: FreeSoundObjectProps;
  setFileMode: Dispatch<SetStateAction<string>>;
  downloadedSoundId: number;
  setDownloadedSoundId: Dispatch<SetStateAction<number>>;
}

export default function FreeSound({
  setCurrentFile,
  setFileIsAudio,
  freeSoundObjectProps,
  setFileMode,
  downloadedSoundId,
  setDownloadedSoundId,
}: FreeSoundProps) {
  const {
    selectedSound, //id of selectedSound
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
  } = freeSoundObjectProps;

  const loginWithFreesound = () => {
    setLoading(true);
    const clientId = process.env.NEXT_PUBLIC_FREESOUND_CLIENT_ID; // Use a public env var
    const authUrl = `https://freesound.org/apiv2/oauth2/authorize?response_type=code&client_id=${clientId}`;
    window.location.href = authUrl;
  };

  return (
    <div>
      {!sessionStorage.getItem("access_token") ? (
        <div className="flex flex-row gap-2 items-center justify-center mt-4">
          <Button onClick={loginWithFreesound} disabled={loading}>
            {loading ? (
              <Loader2 className="animate-spin text-gray-400" />
            ) : (
              "Login with FreeSound"
            )}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-row gap-2 items-center justify-center mt-4">
            <form className="flex flex-row gap-2 items-center justify-center w-full">
              <Input
                placeholder="Search FreeSound"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button
                disabled={loading}
                onClick={() => {
                  const baseUrl = "https://freesound.org/apiv2/search/text/";
                  const params = {
                    query: query,
                    filter: "filesize:[* TO 30000000]",
                  };
                  const url = new URL(baseUrl);
                  url.search = new URLSearchParams(params).toString();

                  const token = sessionStorage.getItem("access_token");
                  setLoading(true);
                  setSelectedSound(null);

                  fetch(url, {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  })
                    .then((r) => r.json())
                    .then(async (d) => {
                      let data = d;

                      // Create an array of fetch promises
                      const fetchPromises = d.results.map(
                        ({ id }: { id: number }, index: number) =>
                          fetch(`https://freesound.org/apiv2/sounds/${id}/`, {
                            method: "GET",
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          })
                            .then((r) => r.json())
                            .then((d2) => {
                              data.results[index] = d2;
                            })
                      );

                      // Wait for all fetches to complete
                      await Promise.all(fetchPromises);

                      // Set results and loading state once all fetches are done
                      setResult(data);
                      setLoading(false);
                    });
                }}
              >
                {loading ? (
                  <Loader2 className="animate-spin text-gray-400" />
                ) : (
                  "Search"
                )}
              </Button>
            </form>

            <Button
              disabled={
                !selectedSound ||
                loading ||
                downloading ||
                selectedSound == downloadedSoundId
              }
              onClick={() => {
                if (selectedSound) {
                  const token = sessionStorage.getItem("access_token");
                  setDownloading(true);
                  fetch(
                    `https://freesound.org/apiv2/sounds/${selectedSound}/download`,
                    {
                      method: "GET",
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  )
                    .then((r) => {
                      return r.blob();
                    })
                    .then((b) => {
                      const newBlob = new Blob([b], { type: "audio" });
                      setDownloading(false);
                      setCurrentFile(newBlob);
                      setFileIsAudio(true);
                      setFileMode("audio");
                      setDownloadedSoundId(selectedSound);
                      toast("File loaded successfully");
                    });
                }
              }}
            >
              {downloading ? (
                <Loader2 className="animate-spin text-gray-400" />
              ) : (
                "Use sound"
              )}
            </Button>
          </div>
          {result?.results && (
            <Command className="mt-4" shouldFilter={false}>
              {/* <CommandInput placeholder="Filter..." /> */}
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                {result?.results.map((s, i) => {
                  return (
                    <CommandItem key={i}>
                      <div
                        className={
                          selectedSound == s.id
                            ? "font-bold w-full flex flex-col gap-2 py-5 transition-all rounded-3xl"
                            : "w-full flex flex-col gap-2 transition-all rounded-3xl"
                        }
                        onClick={() => {
                          if (!downloading) {
                            setSelectedSound(s.id);
                          }
                        }}
                      >
                        <div>
                          <p>Username: {s.username}</p>
                          <p className="truncate">File name: {s.name}</p>
                        </div>
                        <audio
                          src={s.previews["preview-lq-mp3"]}
                          controls
                          className="grow rounded-md invert"
                        />
                      </div>
                    </CommandItem>
                  );
                })}
                {result.next && (
                  <div className="flex justify-center mt-4">
                    <Button
                      disabled={fetchingMore}
                      onClick={() => {
                        if (result.next) {
                          setFetchingMore(true);
                          setLoading(true);
                          const token = sessionStorage.getItem("access_token");
                          fetch(result.next, {
                            method: "GET",
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          })
                            .then((r) => r.json())
                            .then(async (d) => {
                              let data = d;

                              // Create an array of fetch promises
                              const fetchPromises = d.results.map(
                                ({ id }: { id: number }, index: number) =>
                                  fetch(
                                    `https://freesound.org/apiv2/sounds/${id}/`,
                                    {
                                      method: "GET",
                                      headers: {
                                        Authorization: `Bearer ${token}`,
                                      },
                                    }
                                  )
                                    .then((r) => r.json())
                                    .then((d2) => {
                                      data.results[index] = d2;
                                    })
                              );

                              // Wait for all fetches to complete
                              await Promise.all(fetchPromises);

                              // Set results and loading state once all fetches are done
                              setResult((prevResult) => {
                                const newResults = [
                                  ...(prevResult?.results ?? []),
                                  ...data.results,
                                ];
                                const nextURL = data.next;
                                return { next: nextURL, results: newResults };
                              });

                              setLoading(false);
                              setFetchingMore(false);
                            });
                        }
                      }}
                    >
                      {loading ? (
                        <Loader2 className="animate-spin text-gray-400" />
                      ) : (
                        "Load More"
                      )}
                    </Button>
                  </div>
                )}
              </CommandList>
            </Command>
          )}
        </>
      )}
    </div>
  );
}
