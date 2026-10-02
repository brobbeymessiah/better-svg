import {
  createComponent,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
  untrack,
  Show,
  type JSX,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import {
  createWebSvgController,
  mergeSvgAttributes,
  type WebSvgOptions,
  type WebSvgState,
} from "../core/web";

export type SvgProps = Omit<
  JSX.SvgSVGAttributes<SVGSVGElement>,
  "children" | "innerHTML" | "ref" | "style"
> &
  WebSvgOptions & {
    style?: string;
    loading?: JSX.Element;
    fallback?: JSX.Element;
  };

export const SVG = (props: SvgProps): JSX.Element => {
  const [options, attributes] = splitProps(props, [
    "src",
    "name",
    "fetchOptions",
    "cache",
    "sanitize",
    "uniqueIds",
    "onSvgLoad",
    "onSvgError",
    "loading",
    "fallback",
  ]);
  const [state, setState] = createSignal<WebSvgState>({ status: "loading" });
  const controller = createWebSvgController();

  createEffect(() => {
    const request: WebSvgOptions = {
      src: options.src,
      name: options.name,
      fetchOptions: options.fetchOptions,
      cache: options.cache,
      sanitize: options.sanitize,
      uniqueIds: options.uniqueIds,
      onSvgLoad: (markup) => untrack(() => options.onSvgLoad?.(markup)),
      onSvgError: (error) => untrack(() => options.onSvgError?.(error)),
    };
    untrack(() => void controller.load(request, setState));
  });
  onCleanup(controller.abort);

  const ready = createMemo(() => {
    const current = state();
    return current.status === "ready" ? current.content : undefined;
  });
  return Show({
    get when() {
      return ready();
    },
    keyed: true,
    get fallback() {
      return state().status === "loading" ? options.loading : options.fallback;
    },
    children: (content: NonNullable<ReturnType<typeof ready>>) =>
      createComponent(
        Dynamic,
        mergeProps(() => ({ ...attributes, ...mergeSvgAttributes(content, attributes) }), {
          component: "svg",
          innerHTML: content.innerHTML,
        }),
      ),
  });
};

export default SVG;
