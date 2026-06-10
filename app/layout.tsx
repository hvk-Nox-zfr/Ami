import "./globals.css";
import SWRegister from "./sw-register"; // composant client

export const metadata = {
  title: "Ami",
  description: "Application Ami",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <SWRegister /> {/* Enregistrement du service worker */}
        {children}
      </body>
    </html>
  );
}
