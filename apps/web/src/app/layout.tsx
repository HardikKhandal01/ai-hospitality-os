import type { Metadata } from "next";
import "./globals.css";
import FloatingDock from "@/components/navigation/FloatingDock";

export const metadata: Metadata = {
  title: "AI Hospitality OS",
  description: "Your hotel and restaurant, operated by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/* Main Content Area */}
        <main className="min-h-screen">
          {children}
        </main>
        
        {/* Our Premium Floating Command Dock */}
        <FloatingDock />
      </body>
    </html>
  );
}