import { readableCsvStream } from "../utils/csv.ts";
import { ArrayHelpers } from "../utils/utils.ts";

export interface SysLoadAverage {
  date: Date;
  avg1min: number;
  avg5min: number;
  avg15min: number;
}

export interface SysMetrics extends SysLoadAverage {
  available: number;
  buffers: number;
  cached: number;
  free: number;
  swapFree: number;
  swapTotal: number;
  total: number;
}

interface SummarySysMetrics {
  SYS_THREAD: number;
  SYS_DATA: SysMetrics[];
  MIN_DATE: Date;
  MAX_DATE: Date;
  MIN_AVG: number;
  MAX_AVG: number;
  SYS_BY_DAYS: SysLoadAverage[];
  SYS_AVG_BY_HOURS: SysLoadAverage[];
}

export async function getRecords(filename: string): Promise<SummarySysMetrics> {
  // infile will be closed automatically once all data have been read
  const infile = await Deno.open(filename);
  const readable = readableCsvStream<SysMetrics>({
    readable: infile.readable,
    mappers: [
      ["date", (v) => new Date(parseInt(v))],
      ["available", (v) => parseInt(v)],
      ["buffers", (v) => parseInt(v)],
      ["cached", (v) => parseInt(v)],
      ["free", (v) => parseInt(v)],
      ["swapFree", (v) => parseInt(v)],
      ["swapTotal", (v) => parseInt(v)],
      ["total", (v) => parseInt(v)],
      ["avg1min", (v) => parseFloat(v)],
      ["avg5min", (v) => parseFloat(v)],
      ["avg15min", (v) => parseFloat(v)],
    ],
  });
  const data = await Array.fromAsync(readable);
  const loadAvg = new ArrayHelpers(data)
    .flatMap((v) => [v.avg1min, v.avg5min, v.avg15min])
    .summary((a, b) => a - b);
  const summaryDate = new ArrayHelpers(data)
    .summary(sortByDate);
  const byDays = new ArrayHelpers(data)
    .groupBy(({ date }) => new Date(date).setHours(0, 0, 0, 0))
    .values()
    .map((v) => mapLoadAverage(v))
    .toArray();
  const avgByHours = new ArrayHelpers(data)
    .groupBy(({ date }) => new Date(summaryDate.min.date).setHours(date.getHours()))
    .entries()
    .map(([k, v]) => {
      const result: SysLoadAverage = Object.create(null);
      result.date = new Date(k);
      result.avg1min = v.average(v => v.avg1min);
      result.avg5min = v.average(v => v.avg5min);
      result.avg15min = v.average(v => v.avg15min);
      return result;
    })
    .toArray()
    .toSorted(sortByDate);
  return {
    SYS_THREAD: 4,
    SYS_DATA: data,
    MIN_DATE: summaryDate.min.date,
    MAX_DATE: summaryDate.max.date,
    MIN_AVG: loadAvg.min,
    MAX_AVG: loadAvg.max,
    SYS_BY_DAYS: byDays,
    SYS_AVG_BY_HOURS: avgByHours,
  };
}

function sortByDate<T extends { date: Date }>({ date: a }: T, { date: b }: T): number {
  return a.getTime() - b.getTime();
}

function mapLoadAverage(values: ArrayHelpers<SysMetrics>): SysLoadAverage {
  const result: SysLoadAverage = Object.create(null);
  result.date = values.getFirst().date;
  result.avg15min = values.average(({ avg15min }) => avg15min);
  result.avg5min = values.average(({ avg5min }) => avg5min);
  result.avg1min = values.average(({ avg1min }) => avg1min);
  return result;
}
