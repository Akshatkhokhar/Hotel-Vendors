import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/context/ThemeContext";
import { UserProvider } from "@/lib/context/UserContext";
import { SavedVendorsProvider } from "@/lib/context/SavedVendorsContext";
import { Toaster } from 'react-hot-toast';

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "500", "600", "700"],
});

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "HotelVendors | Hospitality Marketplace",
  description: "Connect with vendors for your hotel project.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${cormorant.variable} ${jost.variable} antialiased`}>
        <ThemeProvider>
          <UserProvider>
            <SavedVendorsProvider>
              {children}
              <Toaster position="bottom-right" />
            </SavedVendorsProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

