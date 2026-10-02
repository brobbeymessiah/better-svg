import { parseInlineStyle, renderNode, splitAttributes, type SvgNode } from "./ast";
import type { ParsedInlineSvg } from "./sanitize";

let nextId = 0;
const instanceKey = Math.random().toString(36).slice(2);

export const createSvgId = () => `svg-${instanceKey}-${++nextId}`;

export const rewriteSvgValue = (name: string, value: string, ids: ReadonlyMap<string, string>) => {
  const lower = name.toLowerCase();
  if ((lower === "href" || lower === "xlink:href") && value.startsWith("#")) {
    return `#${ids.get(value.slice(1)) ?? value.slice(1)}`;
  }
  if (
    [
      "aria-labelledby",
      "aria-describedby",
      "aria-controls",
      "aria-owns",
      "aria-flowto",
      "aria-activedescendant",
    ].includes(lower)
  ) {
    return value.replace(/\S+/g, (id) => ids.get(id) ?? id);
  }
  if (lower === "begin" || lower === "end") {
    return value
      .split(";")
      .map((timing) => {
        const trimmed = timing.trimStart();
        const id = [...ids.keys()]
          .sort((a, b) => b.length - a.length)
          .find((id) => trimmed.startsWith(`${id}.`));
        return id ? timing.replace(id, ids.get(id) ?? id) : timing;
      })
      .join(";");
  }
  return value.replace(
    /url\(\s*(['"]?)#([^\s'"()]+)\1\s*\)/gi,
    (match, quote: string, id: string) => {
      const replacement = ids.get(id);
      return replacement ? `url(${quote}#${replacement}${quote})` : match;
    },
  );
};

const rewriteStylesheet = (css: string, ids: ReadonlyMap<string, string>) => {
  const rewritten = rewriteSvgValue("style", css, ids);
  return rewritten.replace(/([^{}]+)(?=\{)/g, (selector: string) => {
    if (selector.trimStart().startsWith("@")) return selector;
    return selector.replace(
      /\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#([\w-]+)/g,
      (match, id: string | undefined) => {
        if (!id) return match;
        return ids.has(id) ? `#${ids.get(id)}` : match;
      },
    );
  });
};

export const scopeSvgNodeIds = (root: SvgNode, prefix: string) => {
  const ids = new Map<string, string>();
  const collect = (node: SvgNode) => {
    for (const attr of node.attrs) {
      if (attr.name.toLowerCase() === "id" && !ids.has(attr.value)) {
        ids.set(attr.value, `${prefix}-${ids.size}`);
      }
    }
    node.children.forEach(collect);
  };
  collect(root);
  if (!ids.size) return { node: root, ids };

  const rewrite = (node: SvgNode): SvgNode => ({
    ...node,
    attrs: node.attrs.map(({ name, value }) => ({
      name,
      value:
        name.toLowerCase() === "id" ? (ids.get(value) ?? value) : rewriteSvgValue(name, value, ids),
    })),
    children: node.children.map((child) =>
      node.tag.toLowerCase() === "style" && child.tag === "#text"
        ? { ...child, text: rewriteStylesheet(child.text ?? "", ids) }
        : rewrite(child),
    ),
  });
  return { node: rewrite(root), ids };
};

export const scopeParsedSvgIds = (content: ParsedInlineSvg, prefix: string): ParsedInlineSvg => {
  const { node, ids } = scopeSvgNodeIds(content.node, prefix);
  if (!ids.size) return content;
  const { attributes, className, styleText } = splitAttributes(node.attrs);
  return {
    attrs: Object.fromEntries(attributes.map(({ name, value }) => [name, value])),
    className,
    styleText,
    style: styleText ? parseInlineStyle(styleText) : undefined,
    innerHTML: node.children.map(renderNode).join(""),
    node,
    ids,
  };
};

export const rewriteSvgAttributes = <T extends object>(
  attributes: T,
  ids?: ReadonlyMap<string, string>,
): T => {
  if (!ids?.size) return attributes;
  return Object.fromEntries(
    Object.entries(attributes).map(([name, value]) => {
      if (typeof value === "string") return [name, rewriteSvgValue(name, value, ids)];
      if (name === "style" && value && typeof value === "object")
        return [name, rewriteSvgAttributes(value, ids)];
      return [name, value];
    }),
  ) as T;
};
