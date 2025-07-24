#!/usr/bin/env -S deno run --allow-read --allow-write
import * as stdPath from "jsr:@std/path";
import { getFileTree, removeFileTree } from "./utils/fs.ts";
import { getDistDir } from "./utils/path.ts";

async function main(args: string[]): Promise<number> {
  const distDir = getDistDir(args);
  const tree = await getFileTree(distDir, {
    exts: [".svg", ".html"],
    includeDirs: false,
  });
  const files = tree.entries()
    .flatMap(([k, v]) => {
      const paths = v.map((f) => stdPath.format(f));
      if (k !== distDir) {
        paths.push(k);
      }
      return paths;
    })
    .map((p) => `- ${p}`)
    .toArray();
  console.log(files.join("\n"));
  if (confirm("Removed?")) {
    await removeFileTree(tree);
  }
  return 0;
}

if (import.meta.main) {
  Deno.exit(await main(Deno.args.slice()));
}
