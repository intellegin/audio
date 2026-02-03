"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  async function handleLogout() {
    try {
      await signOut({ redirect: true, callbackUrl: "/" });
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <Image
        src="/images/searching-duck.gif"
        width={100}
        height={100}
        alt="Searching Duck"
        className="size-28 object-cover drop-shadow"
      />

      <h1 className="font-heading text-3xl drop-shadow dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-4xl md:text-5xl">
        Something went wrong!
      </h1>
      
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => reset()} className="shadow-sm">
          Try again
        </Button>
        <Button variant="destructive" onClick={handleLogout} className="shadow-sm">
          Logout
        </Button>
        <Button variant="outline" asChild className="shadow-sm">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
