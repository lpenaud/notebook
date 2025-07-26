import { CsvParseStream } from "jsr:@std/csv";

export type MapColumnMapper<T, K extends keyof T = Extract<keyof T, string>> = [K, (v: string) => T[K]];

export interface CsvReadableOptions<T> {
  readable: ReadableStream<Uint8Array>;
  mappers: MapColumnMapper<T>[];
}

export function readableCsvStream<T>(
  options: CsvReadableOptions<T>,
): ReadableStream<T> {
  const { readable, mappers, separator, skipFirstRow } = {
    separator: ";",
    skipFirstRow: true,
    ...options,
  };
  return readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(
      new CsvParseStream({
        separator,
        skipFirstRow,
        fieldsPerRecord: mappers.length,
        columns: mappers.map(([c]) => c),
      }),
    )
    .pipeThrough(
      new TransformStream({
        transform: (r, controller) => {
          const values: T = Object.create(null);
          for (const [key, mapper] of mappers) {
            values[key] = mapper(r[key]);
          }
          controller.enqueue(values);
        },
      }),
    );
}
