import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { withStorageDOMEvents } from "./dom";

export type Perks = {
  adRemoval: boolean;
  previewReleaseAccess: boolean;
  comments: boolean;
  premiumFeatures: boolean;
};

export type THGLAccount = {
  userId: string | null;
  decryptedUserId: string | null;
  email: string | null;
  perks: Perks;
};

export const defaultPerks: Perks = {
  adRemoval: false,
  comments: false,
  premiumFeatures: false,
  previewReleaseAccess: false,
};

export const useAccountStore = create(
  subscribeWithSelector(
    persist<{
      _hasHydrated: boolean;
      setHasHydrated: (state: boolean) => void;
      userId: string | null;
      decryptedUserId: string | null;
      email: string | null;
      perks: Perks;
      setAccount: (account: THGLAccount) => void;
      showUserDialog: boolean;
      setShowUserDialog: (showUserDialog: boolean) => void;
    }>(
      (set) => {
        if (typeof window !== "undefined") {
          try {
            JSON.parse(localStorage.getItem("account-storage") || "");
          } catch (e) {
            localStorage.removeItem("account-storage");
          }
        }

        return {
          _hasHydrated: false,
          setHasHydrated: (state) => {
            set({ _hasHydrated: state });
          },
          userId: null,
          decryptedUserId: null,
          email: null,
          perks: defaultPerks,
          setAccount: (account) => {
            set({
              userId: account.userId,
              decryptedUserId: account.decryptedUserId,
              email: account.email,
              perks: account.perks,
            });
          },
          showUserDialog: false,
          setShowUserDialog: (showUserDialog) => {
            set({ showUserDialog });
          },
        };
      },
      {
        name: "account-storage",
        onRehydrateStorage: () => (state) => {
          if (!state?._hasHydrated) {
            state?.setHasHydrated(true);
          }
        },
        version: 2,
        migrate: (persistedState: any, version) => {
          if (version === 0) {
            persistedState.perks = {
              adRemoval: persistedState.adRemoval ?? false,
              comments: persistedState.adRemoval ?? false,
              premiumFeatures: persistedState.adRemoval ?? false,
              previewReleaseAccess:
                persistedState.previewReleaseAccess ?? false,
            };
            delete persistedState.adRemoval;
            delete persistedState.previewReleaseAccess;
          }
          if (version <= 1) {
            // Add email field for version 2
            persistedState.email = null;
          }
          return persistedState;
        },
      },
    ),
  ),
);

withStorageDOMEvents(useAccountStore);
