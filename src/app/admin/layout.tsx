import type { Metadata } from "next";
import { Golos_Text } from "next/font/google";
import "../globals.css";

const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-golos",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "SQA Admin", template: "%s · SQA Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${golos.variable} bg-band font-sans`}>{children}</body>
    </html>
  );
}
