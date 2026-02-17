"use client";
import { defaultPerks, THGLAccount, useAccountStore } from "@repo/lib";
import { useEffect } from "react";

export function InitializeAccount({ account }: { account: THGLAccount }) {
  useEffect(() => {
    const setAccount = useAccountStore.getState().setAccount;
    if (account) {
      console.log("Account received:", account);
      setAccount(account);
    } else {
      console.log("No account received");
      setAccount({
        userId: null,
        decryptedUserId: null,
        email: null,
        perks: defaultPerks,
        username: null,
        avatarUrl: null,
      });
    }
  }, []);

  return null;
}
