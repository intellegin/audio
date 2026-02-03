"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";

function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder that matches the initial server render
    return (
      <Button size="icon" variant="outline">
        <Icons.Sun
          className="size-5 rotate-0 scale-100 transition-all"
          aria-hidden="true"
        />
        <Icons.Moon
          className="absolute size-5 rotate-90 scale-0 transition-all"
          aria-hidden="true"
        />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      size="icon"
      variant="outline"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <Icons.Sun
        className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        aria-hidden="true"
      />

      <Icons.Moon
        className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        aria-hidden="true"
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export default ThemeToggle;
