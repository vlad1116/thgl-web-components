import { InitializeAccount, InitializeController } from "@repo/ui/thgl-app";
import { getAccount } from "@/games/thgl-app/patreon";
import { getCurrentVersion } from "@/games/thgl-app/version";

export default async function ControllerPage() {
  const [account, currentVersion] = await Promise.all([
    getAccount(),
    getCurrentVersion(),
  ]);

  return (
    <>
      <InitializeController currentVersion={currentVersion} />
      <InitializeAccount account={account} />
    </>
  );
}
