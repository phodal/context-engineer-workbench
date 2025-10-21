import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Context Engineer Workbench',
  description: 'An interactive learning platform for context engineering',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="geist_a71539c9-module__T19VSG__variable geist_mono_8d43a2aa-module__8Li5zG__variable antialiased">
        {children}
      </body>
    </html>
  );
}

