import './globals.css';
export const metadata = { title: 'Viagem EUA · Família', description: 'Controle de gastos da viagem em dólar e real', manifest: '/manifest.json' };
export const viewport = { themeColor: '#0F6E56', width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false };
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: "if ('serviceWorker' in navigator) { window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function(){}); }); }" }} />
      </body>
    </html>
  );
}
