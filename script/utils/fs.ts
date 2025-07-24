import * as stdPath from "jsr:@std/path";
import * as stdFs from "jsr:@std/fs";

export type FileTree = Map<string, stdPath.ParsedPath[]>;

export async function getFileTree(
  indir: string,
  options?: stdFs.WalkOptions,
): Promise<FileTree> {
  const walk = stdFs.walk(indir, options);
  const map = new Map<string, stdPath.ParsedPath[]>();
  for await (const { path } of walk) {
    const relative = stdPath.relative(indir, path);
    const key = stdPath.resolve(indir, stdPath.dirname(relative));
    let values = map.get(key);
    if (values === undefined) {
      values = [];
      map.set(key, values);
    }
    values.push(stdPath.parse(path));
  }
  return map;
}

export function removeVerbose(path: string): Promise<void> {
  console.log("rm", path);
  return Deno.remove(path);
}

export async function removeFileTree(tree: FileTree): Promise<void> {
  await Promise.all(
    tree.values()
      .flatMap((v) => v)
      .map((v) => removeVerbose(stdPath.format(v))),
  );
  await Promise.all(
    tree.keys()
      .map((v) => removeVerbose(v)),
  );
}
