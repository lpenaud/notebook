import * as stdPath from "jsr:@std/path";

function openHtml(title: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body>
<ul>
`
}

function closeHtml() {
  return "</ul></body></html>";
}

async function* readDir(dirpath: string, ...exts: string[]) {
  for await (const { name } of Deno.readDir(dirpath)) {
    if (exts.some(e => name.endsWith(e))) {
      yield name;
    }
  }
}

async function main(args: string[]): Promise<number> {
  if (args.length !== 1) {
    console.error("Usage:", import.meta.filename ?? import.meta.url, "DIST_DIR");
    return 1;
  }
  const [distDir] = args;
  const outfile = stdPath.resolve(distDir, "index.html");
  const list: string[] = [];
  for await (const filename of readDir(distDir, ".svg")) {
    console.log(stdPath.resolve(distDir, filename));
    list.push(`<li><a href="${filename}" title="${filename}">${filename}</a></li>`);
  }
  let html = openHtml("SVG files");
  html += list.join("\n")
  html += closeHtml();
  await Deno.writeTextFile(outfile, html, {
    createNew: true,
  });
  return 0;
}

if (import.meta.main) {
  Deno.exit(await main(Deno.args.slice()));
}
