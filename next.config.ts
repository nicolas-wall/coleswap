import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "covers.openlibrary.org" },
      { protocol: "https", hostname: "mfkzbtifexfzwzusvoqa.supabase.co" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Clickjacking: la app tiene acciones destructivas a un click
          // (eliminar publicación, pausar), así que no debe poder embeberse.
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Que la URL completa no viaje a terceros: las de /listings/<id>
          // y /messages/<id> son identificadores internos.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // La app no usa nada de esto; apagarlo evita que lo pida un script
          // de terceros que entre por una dependencia.
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
