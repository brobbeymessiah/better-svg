import { DOMParser, type Element } from "@xmldom/xmldom";
import { renderNode, sanitizeNode, splitAttributes, type SvgNode } from "../core/ast";
import { resolveMarkup, resolveSource } from "../core/resolve";
import { decodeDataUrl, isInlineSvg } from "../core/url";
import type { ParsedInlineSvg } from "../core/sanitize";
import type { WebSvgOptions } from "../core/web";

const toSvgNode = (element: Element): SvgNode => {
  const attrs = [];
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes.item(i);
    if (attr) attrs.push({ name: attr.name, value: attr.value });
  }
  const children: SvgNode[] = [];
  for (let child = element.firstChild; child; child = child.nextSibling) {
    if (child.nodeType === 1) {
      children.push(toSvgNode(child as Element));
    } else if (child.nodeType === 3 || child.nodeType === 4) {
      children.push({ tag: "#text", attrs: [], children: [], text: child.nodeValue ?? "" });
    }
  }
  return { tag: element.tagName, attrs, children };
};

export const loadAstroSvg = async (
  options: WebSvgOptions,
  baseUrl: URL,
): Promise<ParsedInlineSvg> => {
  let source = resolveSource(options.src, options.name);
  if (!source) throw new Error("Either name or src is required.");
  if (!isInlineSvg(source.trim()) && !decodeDataUrl(source.trim())) {
    source = new URL(source, baseUrl).href;
  }
  const markup = await resolveMarkup(source, {
    signal: new AbortController().signal,
    fetchOptions: options.fetchOptions,
    cache: options.cache ?? true,
  });
  const document = new DOMParser({
    onError: (level, message) => {
      if (level !== "warning") throw new Error(`Invalid SVG markup: ${message}`);
    },
  }).parseFromString(markup, "image/svg+xml");
  const element = document.documentElement;
  if (!element || element.tagName !== "svg") throw new Error("SVG markup is invalid.");
  const node = toSvgNode(element);
  const root = options.sanitize === false ? node : sanitizeNode(node);
  if (!root) throw new Error("SVG markup is invalid.");
  const { attributes, className, style, styleText } = splitAttributes(root.attrs);
  const content = {
    attrs: Object.fromEntries(attributes.map(({ name, value }) => [name, value])),
    className,
    style,
    styleText,
    innerHTML: root.children.map(renderNode).join(""),
  };
  options.onSvgLoad?.(markup);
  return content;
};
