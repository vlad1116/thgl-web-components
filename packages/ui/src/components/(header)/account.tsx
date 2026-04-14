"use client";

import { useEffect } from "react";
import Cookies from "js-cookie";
import {
  API_FORGE_URL,
  defaultPerks,
  Perks,
  TH_GL_URL,
  useAccountStore,
  useSettingsStore,
} from "@repo/lib";

async function fetchProfile(token: string) {
  try {
    const res = await fetch(
      `${API_FORGE_URL}/users?userId=${encodeURIComponent(token)}`,
    );
    if (res.ok) {
      const profile = (await res.json()) as {
        userId: string;
        username: string | null;
        generatedUsername: string | null;
        avatarUrl: string | null;
      };
      return {
        decryptedUserId: profile.userId,
        username: profile.username ?? profile.generatedUsername,
        avatarUrl: profile.avatarUrl,
      };
    }
  } catch (err) {
    console.warn("Failed to fetch user profile:", err);
  }
  return { decryptedUserId: null, username: null, avatarUrl: null };
}

export function Account() {
  const accountHasHydrated = useAccountStore((state) => state._hasHydrated);
  const settingsHasHydrated = useSettingsStore((state) => state._hasHydrated);

  useEffect(() => {
    if (!accountHasHydrated) {
      return;
    }
    let userId = Cookies.get("userId");
    const refreshState = async () => {
      const state = useAccountStore.getState();
      if (!userId) {
        if (
          state.userId ||
          state.perks.adRemoval ||
          state.perks.premiumFeatures ||
          state.perks.previewReleaseAccess
        ) {
          state.setAccount({
            userId: null,
            decryptedUserId: null,
            email: null,
            perks: defaultPerks,
            username: null,
            avatarUrl: null,
          });
        }
        return;
      }

      // Fetch profile for any authenticated user (regardless of subscription)
      const profile = await fetchProfile(userId);

      const response = await fetch(TH_GL_URL + "/api/patreon", {
        credentials: "include",
      });
      try {
        const body = (await response.json()) as {
          expiresIn: number;
          decryptedUserId: string;
          email: string;
        } & Perks;
        if (!response.ok) {
          console.warn(body);
          if (response.status === 403) {
            state.setAccount({
              userId,
              decryptedUserId: profile.decryptedUserId,
              email: null,
              perks: defaultPerks,
              username: profile.username,
              avatarUrl: profile.avatarUrl,
            });
          } else if (response.status === 404 || response.status === 400) {
            state.setAccount({
              userId: null,
              decryptedUserId: null,
              email: null,
              perks: defaultPerks,
              username: null,
              avatarUrl: null,
            });
            Cookies.remove("userId");
          }
        } else {
          console.log(`Patreon successfully activated`, body);

          state.setAccount({
            userId,
            decryptedUserId: body.decryptedUserId,
            email: body.email,
            perks: {
              adRemoval: body.adRemoval,
              previewReleaseAccess: body.previewReleaseAccess,
              comments: body.comments,
              premiumFeatures: body.premiumFeatures,
            },
            username: profile.username,
            avatarUrl: profile.avatarUrl,
          });
        }
      } catch (err) {
        console.error(err);
        state.setAccount({
          userId,
          decryptedUserId: profile.decryptedUserId,
          email: null,
          perks: defaultPerks,
          username: profile.username,
          avatarUrl: profile.avatarUrl,
        });
      }
    };
    refreshState();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const newUserId = Cookies.get("userId");
        if (newUserId !== userId) {
          userId = newUserId;
          refreshState();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const searchParams = new URLSearchParams(location.search);
    const peerCode = searchParams.get("peer_code");
    if (peerCode && settingsHasHydrated) {
      const settingsStore = useSettingsStore.getState();
      settingsStore.setAutoJoinPeer(true);
      settingsStore.setPeerCode(peerCode);
      window.history.replaceState(null, "", window.location.pathname);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [accountHasHydrated, settingsHasHydrated]);

  return <></>;
}
