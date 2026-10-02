import type { AstroIntegration } from "astro";
import { localSvgs, type LocalSvgOptions } from "../vite/plugin.js";

export const svg = (options: LocalSvgOptions = {}): AstroIntegration => ({
  name: "@mhaadi/svg",
  hooks: {
    "astro:config:setup": ({ updateConfig }) => {
      updateConfig({ vite: { plugins: [localSvgs(options)] } });
    },
  },
});

export default svg;
