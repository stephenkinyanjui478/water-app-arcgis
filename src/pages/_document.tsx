import { Html, Head, Main, NextScript } from "next/document";

/**
 * Calcite Design System is loaded from the Esri CDN (same version the rest of the
 * project standardised on). Web components render client-side; loading them as an
 * ESM module keeps SSR output clean.
 */
export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="stylesheet" href="https://js.arcgis.com/calcite-components/3.2.1/calcite.css" />
        <script type="module" src="https://js.arcgis.com/calcite-components/3.2.1/calcite.esm.js" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
