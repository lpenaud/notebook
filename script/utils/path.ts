import * as stdPath from "jsr:@std/path";

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
