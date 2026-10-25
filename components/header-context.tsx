"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface HeaderContextType {
  hasCustomHeader: boolean;
  setHasCustomHeader: (hasCustom: boolean) => void;
}

const HeaderContext = createContext<HeaderContextType>({
  hasCustomHeader: false,
  setHasCustomHeader: () => {},
});

export function HeaderProvider({ children }: { children: React.ReactNode }) {
  const [hasCustomHeader, setHasCustomHeader] = useState(false);

  return (
    <HeaderContext.Provider value={{ hasCustomHeader, setHasCustomHeader }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  return useContext(HeaderContext);
}

export function HeaderSlot({ children }: { children: React.ReactNode }) {
  const { setHasCustomHeader } = useHeader();
  const [targetEl, setTargetEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHasCustomHeader(true);
    const el = document.getElementById("navbar-custom-content");
    if (el) {
      setTargetEl(el);
    } else {
      const rafId = requestAnimationFrame(() => {
        setTargetEl(document.getElementById("navbar-custom-content"));
      });
      return () => {
        cancelAnimationFrame(rafId);
        setHasCustomHeader(false);
        setTargetEl(null);
      };
    }

    return () => {
      setHasCustomHeader(false);
      setTargetEl(null);
    };
  }, [setHasCustomHeader]);

  if (!targetEl) return null;
  return createPortal(children, targetEl);
}
