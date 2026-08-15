import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: [".next/**", "out/**", "node_modules/**"],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      // This app is a static export (next.config.js: output: "export") with
      // images.unoptimized = true, so it has deliberately opted out of the
      // Next.js image optimizer. next/image cannot optimize here (it emits a
      // plain <img> with the same URL), so the rule's premise does not apply.
      // The <img> tags are intentional: a data-URL upload preview and remote
      // avatars with runtime onError fallbacks.
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
