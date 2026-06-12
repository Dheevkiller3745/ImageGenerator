"use client";

import React, { useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

export function PersonalizationProvider({ children }: { children: React.ReactNode }) {
  const highContrast = useWorkspaceStore((state) => state.highContrast);
  const fontSizeMultiplier = useWorkspaceStore((state) => state.fontSizeMultiplier);
  const dyslexicFriendlyFont = useWorkspaceStore((state) => state.dyslexicFriendlyFont);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const root = window.document.documentElement;
    
    // Apply High Contrast
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Adjust font size multiplier classes
    root.classList.remove('font-small', 'font-normal', 'font-large', 'font-huge');
    if (fontSizeMultiplier) {
      root.classList.add(`font-${fontSizeMultiplier}`);
    } else {
      root.classList.add('font-normal');
    }

    // Apply Dyslexia-friendly spacing class
    if (dyslexicFriendlyFont) {
      root.classList.add('dyslexic-font');
    } else {
      root.classList.remove('dyslexic-font');
    }
  }, [mounted, highContrast, fontSizeMultiplier, dyslexicFriendlyFont]);

  // Prevent flash before hydration is complete
  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
