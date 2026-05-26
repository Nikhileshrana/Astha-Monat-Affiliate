import React, { Suspense } from "react";
import LayoutWrapper from "@/components/LayoutWrapper";

/** Required with `cacheComponents`: pathname-driven UI must sit under Suspense (blocking-route). */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <LayoutWrapper>{children}</LayoutWrapper>
    </Suspense>
  );
}
