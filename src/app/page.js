"use client";
import dynamic from "next/dynamic";

const PortfolioGame = dynamic(() => import("@/components/PortfolioGame"), {
  ssr: false,
});

export default function Home() {
  return <PortfolioGame />;
}
