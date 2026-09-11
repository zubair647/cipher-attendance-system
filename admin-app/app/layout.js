import './globals.css';

export const metadata = {
  title: 'CipherSchools — Admin',
  description: 'Mentor attendance and hours — admin console',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans min-h-screen bg-canvas">{children}</body>
    </html>
  );
}
