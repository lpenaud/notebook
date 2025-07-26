function pick<T, K extends keyof T>(obj: T, ...keys: K[]): T[K][] {
  return keys.filter(k => obj[k] !== undefined)
    .map(k => obj[k]);
}

const sep = ";"
const info = Deno.systemMemoryInfo();
const avg = Deno.loadavg();
const row = pick(info, "available", "buffers", "cached", "free", "swapFree", "swapTotal", "total")
  .concat(avg)
  .join(sep);

console.log(row);
