import { readableCsvStream } from "../utils/csv.ts";

export interface StatsRecord {
  date: Date;
  downloadedBytes: number;
  filesAdded: number;
  secondsActive: number;
  sessionCount: number;
  uploadedBytes: number;
  activeTorrentCount: number;
  downloadSpeed: number;
  pausedTorrentCount: number;
  torrentCount: number;
  uploadSpeed: number;
}

export interface DateUploadSpeed {
  date: Date;
  uploadSpeed: number;
}

export async function getRecords(filename: string): Promise<StatsRecord[]> {
  // infile will be closed automatically once all data have been read
  const infile = await Deno.open(filename);
  const readable = readableCsvStream<StatsRecord>({
    readable: infile.readable,
    mappers: [
      ["date", (v) => new Date(parseInt(v))],
      ["downloadedBytes", (v) => parseInt(v)],
      ["filesAdded", (v) => parseInt(v)],
      ["secondsActive", (v) => parseInt(v)],
      ["sessionCount", (v) => parseInt(v)],
      ["uploadedBytes", (v) => parseInt(v)],
      ["activeTorrentCount", (v) => parseInt(v)],
      ["downloadSpeed", (v) => parseInt(v)],
      ["pausedTorrentCount", (v) => parseInt(v)],
      ["torrentCount", (v) => parseInt(v)],
      ["uploadSpeed", (v) => parseInt(v)],
    ],
  });
  return Array.fromAsync(readable);
}
