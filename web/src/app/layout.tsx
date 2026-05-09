import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme';
import { Sidebar, Topbar } from '@/components/sections';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AquaSense - AquaSense IoT Hackathon',
  description:
    'Early-warning platform forecasting harmful algal bloom risk 3-5 days ahead for Sarafovo, Central, and Kraimorie beaches.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider attribute="class" enableSystem={false}>
          <div className="flex h-screen w-full overflow-hidden">
            <div className="hidden w-[240px] shrink-0 md:block">
              <Sidebar />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <Topbar />
              <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
