import * as stdPath from "jsr:@std/path";

export type FileByTitle = Map<string, string[]>;

export async function getFiles(
  root: string,
  exts: string[],
): Promise<FileByTitle> {
  const sep = /\./g;
  const map = new Map<string, string[]>();
  for await (const { name, isFile } of Deno.readDir(root)) {
    if (!isFile || !exts.some((e) => name.endsWith(e))) {
      continue;
    }
    const [key] = name.split(sep, 1);
    let values = map.get(key);
    if (values === undefined) {
      values = [];
      map.set(key, values);
    }
    values.push(stdPath.join(root, name));
  }
  return map;
}

export function removeVerbose(path: string): Promise<void> {
  console.log("rm", path);
  return Deno.remove(path);
}

export async function removeFiles(tree: FileByTitle): Promise<void> {
  await Promise.all(
    tree.values().flatMap((v) => v).map((v) => removeVerbose(v)),
  );
}

export function getDistDir(args: string[]) {
  let distDir = args.shift();
  if (distDir !== undefined) {
    return distDir;
  }
  distDir = import.meta.dirname;
  if (distDir !== undefined) {
    return stdPath.resolve(distDir, "../dist");
  }
  return stdPath.resolve(Deno.cwd(), "dist");
}
