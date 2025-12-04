"use server";
import { type CurrentVersion } from "@repo/lib/thgl-app";

export async function getCurrentVersion(): Promise<CurrentVersion> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:48301";

  const versionRes = await fetch(`${baseUrl}/version.txt`);

  const version = await versionRes.text();

  return {
    version,
  };
}
