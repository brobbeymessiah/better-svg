export type Framework = {
  id: string;
  label: string;
  sub: string;
  published?: boolean;
};

export const frameworks: Framework[] = [
  { id: "react", label: "React", sub: "@mhaadi/svg/react" },
  { id: "react-native", label: "React Native", sub: "@mhaadi/svg/react-native" },
  { id: "vue", label: "Vue", sub: "@mhaadi/svg/vue" },
  { id: "svelte", label: "Svelte", sub: "@mhaadi/svg/svelte" },
  { id: "solid", label: "Solid", sub: "@mhaadi/svg/solid" },
  { id: "astro", label: "Astro", sub: "@mhaadi/svg/astro" },
  { id: "angular", label: "Angular", sub: "@mhaadi/svg/angular" },
  { id: "flutter", label: "Flutter", sub: "svg_flutter", published: false },
];

export const frameworkLabels: Record<string, Framework> = Object.fromEntries(
  frameworks.map((framework) => [framework.id, framework]),
);
