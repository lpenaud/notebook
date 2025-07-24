#!/usr/bin/env -S deno run --allow-read --allow-write

import * as stdPath from "jsr:@std/path";
import * as stdFs from "jsr:@std/fs";

interface JupyterNotebookOutput {
  data: {
    "text/html"?: string[];
  };
}

interface JupyterNotebookCell {
  outputs: JupyterNotebookOutput[];
}

interface JupyterNotebook {
  cells: JupyterNotebookCell[];
}

async function getIpynbOutputs(
  ipynb: string,
  outdir: string,
): Promise<Promise<void>[]> {
  const name = stdPath.basename(ipynb, ".ipynb");
  const { cells }: JupyterNotebook = JSON.parse(await Deno.readTextFile(ipynb));
  const anchor = "<svg";
  const endAnchor = "</svg>";
  const svgAttrs = [
    'xmlns="http://www.w3.org/2000/svg"',
    'xmlns:svg="http://www.w3.org/2000/svg"',
  ];
  const outputs = cells.flatMap((v) => v.outputs)
    .map((v) => v.data?.["text/html"])
    .filter((v) => v !== undefined)
    .map((v) => v.join(""))
    .flatMap((v) => {
      const start = v.indexOf(anchor);
      if (start === -1) {
        return [];
      }
      const end = v.lastIndexOf(endAnchor);
      let result =
        '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<svg ';
      result += svgAttrs.join(" ");
      result += v.slice(start + anchor.length, end + endAnchor.length);
      return [result];
    });
  return outputs.map((v, i) => {
    const outfile = stdPath.join(outdir, `${name}.${i}.svg`);
    console.log(outfile);
    return Deno.writeTextFile(outfile, v);
  });
}

async function main(args: string[]): Promise<number> {
  const outdir = args.pop();
  if (outdir === undefined) {
    console.error(
      "Usage:",
      import.meta.filename ?? import.meta.url,
      "[INDIR=.]",
      "OUTDIR",
    );
    return 1;
  }
  const indir = args.shift() ?? ".";
  const walk = stdFs.walk(indir, {
    exts: [".ipynb"],
    includeDirs: false,
    includeFiles: true,
    includeSymlinks: false,
  });
  for await (const { path } of walk) {
    await Promise.all(await getIpynbOutputs(path, outdir));
  }
  return 0;
}

if (import.meta.main) {
  await main(Deno.args.slice());
}
