import './globals.css';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import ConvexClientProvider from './ConvexClientProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'AI Town',
  description: 'A virtual town where AI characters live, chat and socialize',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexClientProvider>
        <html lang="en">
          <body className={inter.className}>{children}</body>
        </html>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
