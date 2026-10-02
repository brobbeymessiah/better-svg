import { ensureParsedSvg } from "../core/cache";
import { parseXmlSvg } from "../core/xml";
import { resolveMarkup, resolveSource } from "../core/resolve";
import { decodeDataUrl, isInlineSvg } from "../core/url";
import type { ParsedInlineSvg } from "../core/sanitize";
import type { WebSvgOptions } from "../core/web";
import { createSvgId, scopeParsedSvgIds } from "../core/ids";

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
  const content = ensureParsedSvg(
    source,
    markup,
    options.sanitize ?? true,
    options.cache ?? true,
    parseXmlSvg,
  );
  if (!content) throw new Error("SVG markup is invalid.");
  options.onSvgLoad?.(markup);
  return options.uniqueIds === false ? content : scopeParsedSvgIds(content, createSvgId());
};
