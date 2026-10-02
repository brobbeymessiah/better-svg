import { renderNode, type SvgNode } from "./ast";
import { createSvgId } from "./ids";
import type { ParsedInlineSvg } from "./sanitize";

export type SvgPresentation = {
  size?: string | number;
  title?: string;
  desc?: string;
};

export const svgDimensions = ({
  size,
  width,
  height,
}: SvgPresentation & {
  width?: string | number;
  height?: string | number;
}) => {
  const dimensions: { width?: string | number; height?: string | number } = {};
  if (width !== undefined || size !== undefined) dimensions.width = width ?? size;
  if (height !== undefined || size !== undefined) dimensions.height = height ?? size;
  return dimensions;
};

type SvgContent = ParsedInlineSvg;

export const createSvgPresentation = () => {
  const prefix = createSvgId();
  const rendered = new WeakMap<SvgNode, string>();
  const renderChild = (node: SvgNode) => {
    let markup = rendered.get(node);
    if (markup === undefined) {
      markup = renderNode(node);
      rendered.set(node, markup);
    }
    return markup;
  };
  let previous:
    | { content: SvgContent; title?: string; desc?: string; result: SvgContent }
    | undefined;

  return (content: SvgContent, { title, desc }: SvgPresentation): SvgContent => {
    if (title === undefined && desc === undefined) return content;
    if (previous?.content === content && previous.title === title && previous.desc === desc)
      return previous.result;
    const attrs = { ...content.attrs };
    let children = [...content.node.children];
    for (const [tag, text] of [
      ["desc", desc],
      ["title", title],
    ] as const) {
      if (text === undefined) continue;
      const existing = children.find((child) => child.tag.toLowerCase() === tag);
      const id = existing?.attrs.find((attr) => attr.name === "id")?.value ?? `${prefix}-${tag}`;
      const label: SvgNode = {
        tag,
        attrs: [
          ...(existing?.attrs.filter((attr) => attr.name !== "id") ?? []),
          { name: "id", value: id },
        ],
        children: [{ tag: "#text", attrs: [], children: [], text }],
      };
      children = children.filter((child) => child.tag.toLowerCase() !== tag);
      children.unshift(label);
      if (tag === "title" && !attrs["aria-label"]) attrs["aria-labelledby"] = id;
      if (tag === "desc") attrs["aria-describedby"] = id;
    }
    if (title) attrs.role ??= "img";
    let innerHTML: string | undefined;
    const result: SvgContent = {
      className: content.className,
      style: content.style,
      styleText: content.styleText,
      ids: content.ids,
      node: { ...content.node, children },
      attrs,
      get innerHTML() {
        return (innerHTML ??= children.map(renderChild).join(""));
      },
    };
    previous = { content, title, desc, result };
    return result;
  };
};
