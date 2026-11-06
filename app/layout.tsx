import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reviewzy · AI-Powered Google Reviews in 30 Seconds",
  description:
    "Turn customer visits into 5-star Google reviews with custom QR codes and AI drafting.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FAF7F2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#FAF7F2] text-[#181715]">
        {children}
      </body>
    </html>
  );
}
