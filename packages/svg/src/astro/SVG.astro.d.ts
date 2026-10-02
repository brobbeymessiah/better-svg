import type { HTMLAttributes } from "astro/types";
import type { AstroComponentFactory } from "astro/runtime/server/index.js";
import type { WebSvgOptions } from "../core/web";

export interface Props extends Omit<HTMLAttributes<"svg">, "style">, WebSvgOptions {
  style?: string;
}

declare const SVG: (props: Props) => ReturnType<AstroComponentFactory>;
export default SVG;
