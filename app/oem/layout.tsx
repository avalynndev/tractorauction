import { ReactNode } from "react";

export default function OEMLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="oem-layout">
      {children}
    </div>
  );
}

