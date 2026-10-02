import type { HTMLAttributes } from "astro/types";
import type { AstroComponentFactory } from "astro/runtime/server/index.js";
import type { WebSvgOptions } from "../core/web";
export { registerLocalSvgs } from "../core/local";

import type { SvgPresentation } from "../core/presentation";

export interface Props
  extends Omit<HTMLAttributes<"svg">, "style">, WebSvgOptions, SvgPresentation {
  style?: string;
}

declare const SVG: (props: Props) => ReturnType<AstroComponentFactory>;
export default SVG;
