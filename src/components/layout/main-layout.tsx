import React from "react";
import BottomNav from "@/components/layout/bottom-nav";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <main className="min-h-screen bg-surface pb-20">{children}</main>
      <BottomNav />
    </>
  );
}
