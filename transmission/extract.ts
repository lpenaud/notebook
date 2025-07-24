import { CsvParseStream } from "jsr:@std/csv";

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

export function fromReadable(
  readable: ReadableStream<Uint8Array>,
): ReadableStream<StatsRecord> {
  return readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(
      new CsvParseStream({
        separator: ";",
        columns: [
          "date",
          "downloadedBytes",
          "filesAdded",
          "secondsActive",
          "sessionCount",
          "uploadedBytes",
          "activeTorrentCount",
          "downloadSpeed",
          "pausedTorrentCount",
          "torrentCount",
          "uploadSpeed",
        ],
      }),
    )
    .pipeThrough(
      new TransformStream<Record<keyof StatsRecord, string>, StatsRecord>({
        transform: (r, controller) => {
          controller.enqueue({
            date: new Date(parseInt(r.date)),
            uploadSpeed: parseInt(r.uploadSpeed),
            activeTorrentCount: parseInt(r.activeTorrentCount),
            downloadedBytes: parseInt(r.downloadedBytes),
            downloadSpeed: parseInt(r.downloadSpeed),
            filesAdded: parseInt(r.filesAdded),
            pausedTorrentCount: parseInt(r.pausedTorrentCount),
            secondsActive: parseInt(r.secondsActive),
            sessionCount: parseInt(r.sessionCount),
            torrentCount: parseInt(r.torrentCount),
            uploadedBytes: parseInt(r.uploadedBytes),
          });
        },
      }),
    );
}

export type DateTimePartsMap = Map<
  Omit<Intl.DateTimeFormatPartTypes, "literal">,
  string
>;

export class DateTimeFormatWrapper {
  #format: Intl.DateTimeFormat;

  constructor(
    locales?: Intl.LocalesArgument,
    options?: Intl.DateTimeFormatOptions,
  ) {
    this.#format = new Intl.DateTimeFormat(locales, options);
  }

  mapParts(date: Date): DateTimePartsMap {
    return this.#format.formatToParts(date)
      .filter((v) => v.type !== "literal")
      .reduce((m, v) => m.set(v.type, v.value), new Map());
  }

  tickFormat(
    formatter: (map: DateTimePartsMap) => string,
  ): (d: Date) => string {
    return (d) => formatter(this.mapParts(d));
  }
}

export interface DateUploadSpeed {
  date: Date;
  uploadSpeed: number;
}

export function computeIfAbsent<K, V>(
  map: Map<K, V>,
  key: K,
  factory: (key: K) => V,
): V {
  let value = map.get(key);
  if (value === undefined) {
    value = factory(key);
    map.set(key, value);
  }
  return value;
}

export class ArrayHelpers<T> {
  #data: T[];

  constructor(data: T[] = []) {
    this.#data = data;
  }

  getFirst() {
    return this.#data[0];
  }

  add(value: T): this {
    this.#data.push(value);
    return this;
  }

  map<U>(mapper: (v: T, i: number) => U): ArrayHelpers<U> {
    return new ArrayHelpers(this.#data.map(mapper));
  }

  groupBy<K>(keyMapper: (e: T) => K) {
    const factory = () => new ArrayHelpers<T>();
    return this.#data.reduce((m, v) => {
      computeIfAbsent(m, keyMapper(v), factory)
        .add(v);
      return m;
    }, new Map<K, ArrayHelpers<T>>());
  }

  average(getNumber: (v: T) => number) {
    return Math.round(
      this.#data.reduce((s, v) => s + getNumber(v), 0) / this.#data.length,
    );
  }
}
