import * as React from "react";
import { ensureParsedSvg, resolveMarkup, resolveSource, type SvgNameInput } from "./core";
import { createSvgId, rewriteSvgAttributes, scopeParsedSvgIds } from "./core/ids";

type ParsedSvg = {
  attrs: Record<string, string>;
  className?: string;
  style?: React.CSSProperties;
  innerHTML: string;
  ids?: ReadonlyMap<string, string>;
};

type SvgSourceProps = { src: string; name?: never } | { name: SvgNameInput; src?: never };

export type SvgProps = Omit<React.SVGProps<SVGSVGElement>, "children" | "dangerouslySetInnerHTML"> &
  SvgSourceProps & {
    fetchOptions?: RequestInit;
    cache?: boolean;
    sanitize?: boolean;
    uniqueIds?: boolean;
    loading?: React.ReactNode;
    fallback?: React.ReactNode;
    onSvgLoad?: (markup: string) => void;
    onSvgError?: (error: Error) => void;
  };

export const SVG = React.forwardRef<SVGSVGElement, SvgProps>(
  (
    {
      src,
      name,
      fetchOptions,
      cache = true,
      sanitize = true,
      uniqueIds = true,
      loading,
      fallback,
      onSvgLoad,
      onSvgError,
      className,
      style,
      ...rest
    },
    ref,
  ) => {
    const [content, setContent] = React.useState<ParsedSvg | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<Error | null>(null);
    const [prefix] = React.useState(createSvgId);

    const resolvedSource = React.useMemo(() => resolveSource(src, name), [name, src]);

    const onLoadRef = React.useRef(onSvgLoad);
    const onErrorRef = React.useRef(onSvgError);
    React.useEffect(() => {
      onLoadRef.current = onSvgLoad;
      onErrorRef.current = onSvgError;
    });

    React.useEffect(() => {
      let active = true;
      const controller = new AbortController();
      setIsLoading(true);
      setError(null);
      setContent(null);

      if (!resolvedSource) {
        const err = new Error("Either name or src is required.");
        setError(err);
        setIsLoading(false);
        onErrorRef.current?.(err);
        return () => {
          active = false;
          controller.abort();
        };
      }

      const runWithCached = (markup: string) => {
        const inline = ensureParsedSvg(resolvedSource, markup, sanitize, cache);
        if (!inline) throw new Error("SVG markup is invalid or unavailable in this environment.");
        const scoped = uniqueIds ? scopeParsedSvgIds(inline, prefix) : inline;
        const parsed: ParsedSvg = {
          attrs: scoped.attrs,
          className: scoped.className,
          style: scoped.style as React.CSSProperties | undefined,
          innerHTML: scoped.innerHTML,
          ids: scoped.ids,
        };
        setContent(parsed);
        setIsLoading(false);
        onLoadRef.current?.(markup);
      };

      resolveMarkup(resolvedSource, { fetchOptions, signal: controller.signal, cache })
        .then((markup) => {
          if (!active) return;
          runWithCached(markup);
        })
        .catch((err) => {
          if (!active) return;
          if (err instanceof DOMException && err.name === "AbortError") return;
          const normalized = err instanceof Error ? err : new Error("Failed to load SVG.");
          setError(normalized);
          setIsLoading(false);
          onErrorRef.current?.(normalized);
        });

      return () => {
        active = false;
        controller.abort();
      };
    }, [resolvedSource, fetchOptions, cache, sanitize, uniqueIds, prefix]);

    if (isLoading) {
      return loading ? <>{loading}</> : null;
    }

    if (error || !content) {
      return fallback ? <>{fallback}</> : null;
    }

    const mergedClassName = [content.className, className].filter(Boolean).join(" ");
    const mergedStyle = content.style ? { ...content.style, ...style } : style;

    return (
      <svg
        ref={ref}
        {...content.attrs}
        {...rewriteSvgAttributes(rest, content.ids)}
        className={mergedClassName || undefined}
        style={rewriteSvgAttributes(mergedStyle ?? {}, content.ids)}
        dangerouslySetInnerHTML={{ __html: content.innerHTML }}
      />
    );
  },
);

SVG.displayName = "SVG";
