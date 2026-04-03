import { fetchDict, fetchVersion } from "@repo/lib";
import { redirect } from "next/navigation";
import { APP_CONFIG } from "@/config";

export default async function MapsPage() {
  const [version, dict] = await Promise.all([
    fetchVersion(APP_CONFIG.name),
    fetchDict(APP_CONFIG.name),
  ]);
  const firstMap = Object.keys(version.data.tiles)[0];
  const firstMapName = dict[firstMap];
  redirect(`/maps/${firstMapName}`);
}
