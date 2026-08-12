import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.owenlee.fits",
  appName: "Fits",
  webDir: "public",
  // Fits uses Next.js middleware (proxy) + server-rendered routes, so it can't ship as a static
  // bundle — the native shell loads the deployed app directly, same pattern Capacitor recommends
  // for any Next.js app that needs SSR. `webDir` above is only a fallback shell Capacitor requires
  // to exist; it's never what actually renders once `server.url` is set.
  server: {
    url: "https://fits-app-owenl1-cc3d.vercel.app",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
