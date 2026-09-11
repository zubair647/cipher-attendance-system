import './globals.css';

export const metadata = {
  title: 'CipherSchools — Mentor',
  description: 'Mentor attendance and teaching hours',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans min-h-screen">{children}</body>
    </html>
  );
}
