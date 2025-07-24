#!/usr/bin/env -S deno run --allow-read --allow-write

import * as stdPath from "jsr:@std/path";
import { getFiles } from "./utils/fs.ts";

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

interface WriteIndexOptions {
  title: string;
  path: string;
}

async function writeIndex(
  { title, path }: WriteIndexOptions,
  ...files: string[]
): Promise<string> {
  let content = openHtml(title);
  content += files
    .map((p) => liAnchor(stdPath.basename(p)))
    .join("");
  content += closeHtml();
  console.log(path);
  await Deno.writeTextFile(path, content, {
    createNew: true,
  });
  return path;
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
  const infiles = await getFiles(distDir, [".svg"]);
  const tasks = infiles.entries()
    .map(([title, entries]) => {
      return writeIndex({
        path: stdPath.join(distDir, `${title}.index.html`),
        title,
      }, ...entries);
    });
  const indexes = await Promise.all(tasks);
  await writeIndex({
    path: stdPath.join(distDir, "index.html"),
    title: "index",
  }, ...indexes);
  return 0;
}

if (import.meta.main) {
  Deno.exit(await main(Deno.args.slice()));
}
