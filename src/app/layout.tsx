
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: {
    default: "oPilot | AI Lead Generation Copilot",
    template: "%s | oPilot",
  },
  description: "Supercharge your sales pipeline with oPilot, the AI-powered copilot for lead generation. Find qualified leads, extract contact info, and get AI-driven scores.",
  keywords: ["AI lead generation", "sales leads", "B2B leads", "marketing automation", "sales intelligence", "prospecting tool"],
  verification: {
    google: 'googleb3d21e9511a05b5b',
  },
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" stroke="hsl(165, 82%, 35%)" stroke-width="8" fill="none" /><circle cx="50" cy="50" r="15" fill="hsl(165, 82%, 35%)" /></svg>',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-body antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
            <Analytics />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
