import React, { Suspense, useState, useEffect } from "react";
import { lazy } from "react";

const AddFieldModalContent = lazy(() => import("@/components/MapComponents").then(m => ({ default: m.AddFieldModalContent })));

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : null;
}

export function AddFieldModal({ onClose }: { onClose: () => void }) {
  return (
    <ClientOnly>
      <Suspense fallback={<div className="fixed inset-0 z-[100] bg-[#1c2128]" />}>
        <AddFieldModalContent onClose={onClose} />
      </Suspense>
    </ClientOnly>
  );
}
