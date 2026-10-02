import { copyFile, mkdir } from "node:fs/promises";

const root = new URL("../", import.meta.url);
await mkdir(new URL("dist/astro/", root), { recursive: true });
for (const file of ["SVG.astro", "SVG.astro.d.ts"]) {
  await copyFile(new URL(`src/astro/${file}`, root), new URL(`dist/astro/${file}`, root));
}
