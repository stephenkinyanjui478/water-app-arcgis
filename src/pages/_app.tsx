import "@arcgis/core/assets/esri/themes/light/main.css";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { SWRConfig } from "swr";
import { AuthProvider } from "@/lib/auth";
import { swrFetcher } from "@/lib/api";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SWRConfig value={{ fetcher: swrFetcher, revalidateOnFocus: false, shouldRetryOnError: false }}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>WSP Water — Customer Portal</title>
      </Head>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </SWRConfig>
  );
}
