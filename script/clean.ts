#!/usr/bin/env -S deno run --allow-read --allow-write
import { getDistDir, getFiles, removeFiles } from "./utils/fs.ts";

async function main(args: string[]): Promise<number> {
  const distDir = getDistDir(args);
  const tree = await getFiles(distDir, [".svg", ".html", ".tar"]);
  const files = tree.values()
    .flatMap((v) => v)
    .map((p) => `- ${p}`)
    .toArray();
  console.log(files.join("\n"));
  if (confirm("Removed?")) {
    await removeFiles(tree);
  }
  return 0;
}

if (import.meta.main) {
  Deno.exit(await main(Deno.args.slice()));
}
