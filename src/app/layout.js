import "./globals.css";
import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: "ESHAN H | Retro Arcade Portfolio",
  description: "The odyssey of a problem solver. 10+ hackathon wins. GenAI builder. CS Engineer. Play through Eshan H's journey.",
  keywords: ["Eshan H", "portfolio", "computer science", "hackathon", "GenAI", "developer"],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
