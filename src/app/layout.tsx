import { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import Navigation from '@/components/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Grace Billiris - Portfolio',
  description: 'Personal portfolio website showcasing my work and experience',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-[#0a192f] text-[#ccd6f6] antialiased`}>
        <div className="relative min-h-screen bg-[#0a192f]">
          <Navigation />
          <main className="relative bg-[#0a192f]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}