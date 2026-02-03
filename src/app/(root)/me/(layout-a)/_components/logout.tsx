"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  async function signOutHandler() {
    try {
      toast.loading("Signing out...");
      await signOut({ 
        redirect: true,
        callbackUrl: "/" 
      });
      toast.success("You have been signed out.");
    } catch (error) {
      toast.error("Something went wrong.");
      console.error("Sign out error:", error);
    }
  }
  return (
    <Button
      size="sm"
      variant="destructive"
      onClick={signOutHandler}
      className="w-24"
    >
      <LogOut className="mr-2 size-4" /> Logout
    </Button>
  );
}
