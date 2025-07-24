#!/usr/bin/env -S deno run --allow-read --allow-write

import * as stdPath from "jsr:@std/path";
import { getFileTree } from "./utils/fs.ts";

function openHtml(title: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body>
<h1>${title}</h1>
<ul>
`;
}

function closeHtml() {
  return "</ul></body></html>";
}

function liAnchorPosix(filename: string) {
  return `<li><a href="${filename}" title="${filename}">${filename}</a></li>`;
}

function liAnchorWindows(re: RegExp, filename: string) {
  return liAnchorPosix(filename.replaceAll(re, "/"));
}

const liAnchor = stdPath.SEPARATOR === "/"
  ? liAnchorPosix
  : liAnchorWindows.bind(undefined, new RegExp(stdPath.SEPARATOR_PATTERN, "g"));

async function writeIndex(
  outdir: string,
  title: string,
  ...files: stdPath.ParsedPath[]
): Promise<stdPath.ParsedPath> {
  const path = stdPath.resolve(outdir, "index.html");
  const parsed = stdPath.parse(path);
  let content = openHtml(title);
  content += files
    .map((p) => stdPath.format(p))
    .map((p) => liAnchor(stdPath.relative(parsed.dir, p)))
    .join("");
  content += closeHtml();
  console.log(path);
  await Deno.writeTextFile(path, content, {
    createNew: true,
  });
  return parsed;
}

async function main(args: string[]): Promise<number> {
  const distDir = args.shift();
  if (distDir === undefined) {
    console.error(
      "Usage:",
      import.meta.filename ?? import.meta.url,
      "DIST_DIR",
    );
    return 1;
  }
  const infiles = await getFileTree(stdPath.resolve(distDir), {
    exts: [".svg"],
    includeDirs: false,
    includeFiles: true,
    includeSymlinks: false,
  });
  const tasks = infiles.entries()
    .map(([outdir, entries]) =>
      writeIndex(outdir, stdPath.basename(outdir), ...entries)
    );
  const indexes = await Promise.all(tasks);
  await writeIndex(distDir, "index", ...indexes);
  return 0;
}

if (import.meta.main) {
  Deno.exit(await main(Deno.args.slice()));
}
