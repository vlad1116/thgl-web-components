"use client";

import { useRef, useState } from "react";
import { API_FORGE_URL, useAccountStore } from "@repo/lib";
import { Button, Input, Label } from "@repo/ui/controls";
import { toSvg } from "jdenticon";

const USERNAME_REGEX = /^[a-zA-Z0-9 \-_]+$/;
const USERNAME_MIN = 2;
const USERNAME_MAX = 30;
const MAX_AVATAR_SIZE = 256 * 1024; // 256KB
const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];

function validateUsername(username: string): string | null {
  const trimmed = username.trim().replace(/\s+/g, " ");
  if (trimmed.length < USERNAME_MIN) {
    return `Username must be at least ${USERNAME_MIN} characters`;
  }
  if (trimmed.length > USERNAME_MAX) {
    return `Username must be at most ${USERNAME_MAX} characters`;
  }
  if (!USERNAME_REGEX.test(trimmed)) {
    return "Only letters, numbers, spaces, hyphens, and underscores allowed";
  }
  return null;
}

export function ProfileEditor() {
  const userId = useAccountStore((state) => state.userId);
  const decryptedUserId = useAccountStore((state) => state.decryptedUserId);
  const currentUsername = useAccountStore((state) => state.username);
  const currentAvatarUrl = useAccountStore((state) => state.avatarUrl);
  const setProfile = useAccountStore((state) => state.setProfile);

  const [username, setUsername] = useState(currentUsername ?? "");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState<string | null>(null);
  const [savingUsername, setSavingUsername] = useState(false);

  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!userId || !decryptedUserId) return null;

  const avatarSvg = toSvg(decryptedUserId, 80);

  const handleSaveUsername = async () => {
    setUsernameError(null);
    setUsernameSuccess(null);

    const error = validateUsername(username);
    if (error) {
      setUsernameError(error);
      return;
    }

    setSavingUsername(true);
    try {
      const res = await fetch(`${API_FORGE_URL}/users`, {
        method: "PUT",
        body: JSON.stringify({ userId, username: username.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setUsernameError(data.error || "Failed to save username");
        return;
      }

      setProfile(data.username, currentAvatarUrl);
      setUsernameSuccess("Username saved");
    } catch {
      setUsernameError("Failed to save username");
    } finally {
      setSavingUsername(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    setAvatarSuccess(null);

    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError("File must be PNG, JPEG, or WebP");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError("File must be under 256KB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("file", file);

      const res = await fetch(`${API_FORGE_URL}/users/avatar`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setAvatarError(data.error || "Failed to upload avatar");
        return;
      }

      setProfile(currentUsername, data.avatarUrl);
      setAvatarSuccess("Avatar uploaded");
    } catch {
      setAvatarError("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      // Reset file input so re-uploading the same file triggers onChange
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-muted/30 rounded-lg p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Profile</h2>

      <div className="flex flex-col items-center gap-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-semibold">Avatar</p>
          {currentAvatarUrl ? (
            <img
              src={currentAvatarUrl}
              alt="Your avatar"
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full overflow-hidden"
              dangerouslySetInnerHTML={{ __html: avatarSvg }}
            />
          )}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingAvatar ? "Uploading..." : "Upload Avatar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            PNG, JPEG, or WebP. Max 256KB.
          </p>
          {avatarError && <p className="text-sm text-red-500">{avatarError}</p>}
          {avatarSuccess && (
            <p className="text-sm text-green-500">{avatarSuccess}</p>
          )}
        </div>

        {/* Username */}
        <div className="w-full max-w-sm space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="flex gap-2">
            <Input
              id="username"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setUsernameError(null);
                setUsernameSuccess(null);
              }}
              maxLength={USERNAME_MAX}
            />
            <Button
              onClick={handleSaveUsername}
              disabled={savingUsername || !username.trim()}
            >
              {savingUsername ? "Saving..." : "Save"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            2-30 characters. Letters, numbers, spaces, hyphens, and underscores.
          </p>
          {usernameError && (
            <p className="text-sm text-red-500">{usernameError}</p>
          )}
          {usernameSuccess && (
            <p className="text-sm text-green-500">{usernameSuccess}</p>
          )}
        </div>
      </div>
    </div>
  );
}
