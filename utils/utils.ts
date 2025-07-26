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

type Comparator<T> = (a: T, b: T) => number;

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

  flatMap<U>(mapper: (v: T, i: number) => U[]): ArrayHelpers<U> {
    return new ArrayHelpers(this.#data.flatMap(mapper));
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
    return this.#data.reduce((s, v) => s + getNumber(v), 0) / this.#data.length;
  }

  toSet(): Set<T> {
    return new Set(this.#data);
  }

  [Symbol.iterator]() {
    return this.#data.values();
  }

  summary(comparator: Comparator<T>): { min: T; max: T } {
    const sorted = this.#data.toSorted(comparator);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }
}
