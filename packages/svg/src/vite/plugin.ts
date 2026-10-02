import { readdir, readFile } from "node:fs/promises";
import { resolve, relative, sep } from "node:path";
import type { Plugin } from "vite";

export type LocalSvgOptions = {
  dirs?: string[];
};

export const localSvgs = (options: LocalSvgOptions = {}): Plugin => {
  const dirs = options.dirs ?? ["src/assets/svg", "app/assets/svg"];
  if (
    dirs.some(
      (dir) =>
        !dir ||
        dir.startsWith("/") ||
        dir.includes("\\") ||
        dir.split("/").includes("..") ||
        /[*?{}[\]]/.test(dir),
    )
  ) {
    throw new Error(
      "SVG directories must be paths relative to the project root without globs or '..'.",
    );
  }
  let root = "";
  const containsSvg = (file: string) =>
    file.endsWith(".svg") && dirs.some((dir) => file.startsWith(`${resolve(root, dir)}${sep}`));

  return {
    name: "@mhaadi/svg/local",
    enforce: "pre",
    config: () => ({
      ssr: { noExternal: ["@mhaadi/svg"] },
      optimizeDeps: { exclude: ["@mhaadi/svg"] },
    }),
    configResolved(config) {
      root = config.root;
    },
    configureServer(server) {
      const refresh = (file: string) => {
        if (!containsSvg(file)) return;
        server.moduleGraph.invalidateAll();
        server.ws.send({ type: "full-reload" });
      };
      for (const dir of dirs) server.watcher.add(resolve(root, dir));
      server.watcher.on("add", refresh).on("change", refresh).on("unlink", refresh);
      server.httpServer?.once("close", () => {
        server.watcher.off("add", refresh).off("change", refresh).off("unlink", refresh);
      });
    },
    async transform(code, id) {
      const path = id.split("?")[0]?.replace(/\\/g, "/");
      if (
        !path ||
        !/(?:\/@mhaadi\/svg|\/packages\/svg)\/(?:dist|src)\/core\/local\.(?:js|ts)$/.test(path)
      )
        return;
      const entries = new Map<string, string>();
      const visit = async (directory: string, base: string) => {
        let files;
        try {
          files = await readdir(directory, { withFileTypes: true });
        } catch (cause) {
          if (cause instanceof Error && "code" in cause && cause.code === "ENOENT") return;
          throw cause;
        }
        for (const file of files.sort((a, b) => a.name.localeCompare(b.name))) {
          const path = resolve(directory, file.name);
          if (file.isDirectory()) await visit(path, base);
          else if (file.isFile() && file.name.endsWith(".svg")) {
            const name = relative(base, path).split(sep).join("/").slice(0, -4);
            this.addWatchFile(path);
            if (!entries.has(name)) entries.set(name, await readFile(path, "utf8"));
          }
        }
      };
      for (const dir of dirs) {
        const base = resolve(root, dir);
        await visit(base, base);
      }
      return {
        code: `${code}\nregisterLocalSvgs(${JSON.stringify(Object.fromEntries(entries))}, { override: false });\n`,
        map: null,
      };
    },
  };
};

export default localSvgs;
