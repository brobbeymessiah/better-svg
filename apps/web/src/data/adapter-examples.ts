export const adapterExamples = [
  {
    id: "solid",
    label: "Solid",
    lang: "tsx",
    file: "App.tsx",
    code: `import { SVG } from "@mhaadi/svg/solid";

export default function App() {
  return <SVG src="/icon.svg" width={24} height={24} class="text-current" />;
}`,
    details:
      "Solid 1.9+ tracks source and SVG attribute changes. Loading and fallback accept JSX. onSvgLoad receives the original markup and onSvgError receives an Error. Server rendering shows the loading content, then the SVG loads on the client.",
    states: `<SVG
  src={iconUrl()}
  loading={<span>Loading...</span>}
  fallback={<span>Failed to load</span>}
  onSvgLoad={(markup) => console.log(markup)}
  onSvgError={(error) => console.error(error)}
/>`,
  },
  {
    id: "astro",
    label: "Astro",
    lang: "astro",
    file: "Icon.astro",
    code: `---
import SVG from "@mhaadi/svg/astro";
import logo from "../assets/svg/logo.svg?raw";
---

<SVG src={logo} width={24} height={24} class="text-current" />`,
    details:
      "Astro 5+ renders the SVG during the build or server request and ships no client JavaScript. Import local files with ?raw for static builds. Relative URLs resolve against Astro.url and require a running asset server. The fallback slot handles failures. There is no client loading state, and callbacks run on the server.",
    states: `---
import SVG, { registerLocalSvgs } from "@mhaadi/svg/astro";

registerLocalSvgs(import.meta.glob("/src/assets/svg/**/*.svg", {
  eager: true,
  query: "?raw",
  import: "default",
}));
---

<SVG name="logo" width={24} height={24}>
  <span slot="fallback">Failed to load</span>
</SVG>`,
  },
  {
    id: "angular",
    label: "Angular",
    lang: "ts",
    file: "app.component.ts",
    code: `import { Component } from "@angular/core";
import { SVG } from "@mhaadi/svg/angular";

@Component({
  selector: "app-root",
  imports: [SVG],
  template: '<better-svg src="/icon.svg" [width]="24" [height]="24" />',
})
export class AppComponent {}`,
    details:
      "Angular 20+ imports SVG as a standalone component with the better-svg selector. Use svgClass and svgStyle for the inner SVG, and ariaLabel and ariaHidden for accessibility. Loading and fallback accept TemplateRef inputs. The svgLoad and svgError outputs emit markup and Error values. Server rendering shows the loading template, then the SVG loads on the client.",
    states: `<ng-template #pending>Loading...</ng-template>
<ng-template #failed>Failed to load</ng-template>

<better-svg
  [src]="iconUrl"
  [loading]="pending"
  [fallback]="failed"
  svgClass="h-6 w-6"
  svgStyle="fill:currentColor"
  [ariaHidden]="true"
  (svgLoad)="onLoad($event)"
  (svgError)="onError($event)"
/>`,
  },
];
