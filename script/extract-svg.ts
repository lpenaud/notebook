import * as stdPath from "jsr:@std/path";

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

function getHtmlOutput(ipynb: string) {
  const notebook: JupyterNotebook = JSON.parse(Deno.readTextFileSync(ipynb));
  return notebook.cells
    .values()
    .flatMap((v) => v.outputs)
    .map((v) => v.data?.["text/html"])
    .filter((v) => v !== undefined)
    .map((v) => v.join(""));
}

async function main(args: string[]): Promise<number> {
  if (args.length !== 2) {
    console.error(
      "Usage:",
      import.meta.filename ?? import.meta.url,
      "IPYNB",
      "OUTDIR",
    );
    return 1;
  }
  const anchor = "<svg";
  const endAnchor = "</svg>";
  const svgAttrs = [
    'xmlns="http://www.w3.org/2000/svg"',
    'xmlns:svg="http://www.w3.org/2000/svg"',
  ];
  const [ipynb, outdir] = args;
  const content = getHtmlOutput(ipynb)
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
  const promises: Promise<void>[] = [];
  let count = 0;
  for (const svg of content) {
    count++;
    const outfile = stdPath.join(outdir, `${count}.svg`);
    promises.push(Deno.writeTextFile(outfile, svg));
    console.log(outfile);
  }
  await Promise.all(promises);
  return 0;
}

if (import.meta.main) {
  await main(Deno.args.slice());
}
