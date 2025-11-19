import { kv } from "@vercel/kv";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import Link from "next/link";
import { AppSubscriptionCard } from "@/components/app-subscription-card";
import { Button } from "@repo/ui/controls";
import { SignOut } from "@/components/sign-out";
import {
  type PatreonError,
  type PatreonToken,
  type PatreonUser,
  getCurrentEntitledTiers,
  getCurrentUser,
} from "@/lib/patreon";
import { tiers } from "@/lib/tiers";
import { games } from "@repo/lib";

export const metadata = {
  title: "Account - The Hidden Gaming Lair",
  description:
    "Authenticate your Patreon account to activate ad removal and premium features in TH.GL apps and tools.",
  alternates: {
    canonical: "/support-me/account",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SupportMeAccount() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId");

  let content;
  let entitledTierIDs: string[] = [];

  if (userId?.value) {
    try {
      const id = verify(userId.value, process.env.JWT_SECRET!) as string;
      const patreonToken = await kv.get<PatreonToken>(`token:${id}`);

      if (patreonToken) {
        const currentUserResponse = await getCurrentUser(patreonToken);
        const currentUserResult = (await currentUserResponse.json()) as
          | PatreonUser
          | PatreonError;

        if (
          !("error" in currentUserResult) &&
          !("errors" in currentUserResult)
        ) {
          entitledTierIDs = getCurrentEntitledTiers(currentUserResult);

          content = (
            <>
              <div className="bg-muted/30 rounded-lg p-8 max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 text-center">
                  Account Status
                </h2>

                {/* User Info */}
                <div className="space-y-4 mb-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Logged in as
                    </p>
                    <p className="text-lg font-semibold text-primary">
                      {currentUserResult.data.attributes.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID: {currentUserResult.data.id}
                    </p>
                  </div>

                  {/* Current Tiers */}
                  <div className="border-t border-border pt-4">
                    <p className="text-sm font-semibold text-center mb-3">
                      Active Subscription Tier(s)
                    </p>
                    {entitledTierIDs.length > 0 ? (
                      <div className="flex gap-2 justify-center flex-wrap">
                        {entitledTierIDs.map((tierId) => (
                          <span
                            key={tierId}
                            className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium"
                          >
                            {tiers.find((tier) => tier.id === tierId)?.title ??
                              "Unknown"}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-amber-500 font-medium text-center text-sm">
                        You are not subscribed to any tier.
                      </p>
                    )}

                    {entitledTierIDs.includes("21470801") && (
                      <p className="text-sm text-amber-500 text-center mt-3">
                        ⚠️ The Enthusiast tier does not include Ad Removal.
                      </p>
                    )}
                  </div>
                </div>

                {/* Info Section */}
                <div className="space-y-3 text-sm text-muted-foreground border-t border-border pt-4">
                  <p>
                    This page activates your perks for{" "}
                    <strong className="text-foreground">
                      Overwolf apps and *.th.gl websites
                    </strong>
                    .
                  </p>
                  <p>
                    If you're using the{" "}
                    <Link
                      href="/companion-app"
                      className="text-primary hover:underline font-medium"
                    >
                      Companion App
                    </Link>
                    , perks are unlocked directly inside the app — no action
                    needed here.
                  </p>
                  <p>
                    <strong className="text-foreground">Discord Role:</strong>{" "}
                    To get your Discord supporter role,{" "}
                    <Link
                      href="/faq/discord-supporter-role"
                      className="text-primary hover:underline"
                    >
                      link your Discord account to Patreon
                    </Link>
                    .
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-center mt-6 pt-4 border-t border-border">
                  <Button variant="secondary" asChild>
                    <Link href="/support-me/patreon" prefetch={false}>
                      Change Patreon Account
                    </Link>
                  </Button>
                  <SignOut />
                </div>
              </div>
            </>
          );
        }
      }
    } catch (error) {
      // invalid token or missing secret
    }
  }

  if (!content) {
    content = (
      <div className="bg-muted/30 rounded-lg p-8 max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-6">Activate Your Perks</h2>
        <p className="text-muted-foreground mb-6">
          You are not authenticated. Connect your Patreon account to activate
          your perks for Overwolf apps and web tools.
        </p>
        <Button size="lg" asChild>
          <Link href="/support-me/patreon" prefetch={false}>
            Authenticate with Patreon
          </Link>
        </Button>
        <p className="italic text-sm text-muted-foreground mt-4">
          This will store a cookie in your browser to remember your Patreon
          account. You can sign out at any time.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-16 px-4 pt-10 pb-20 max-w-7xl mx-auto">
      {content}

      {/* Overwolf Apps Section */}
      <div className="space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold">Unlock Overwolf Apps</h2>
          <p className="text-sm text-muted-foreground">
            Click the buttons below to unlock your perks in Overwolf apps. Some
            apps also support manual unlock via a secret.
          </p>
        </div>

        <div className="flex flex-wrap gap-6 justify-center">
          {games
            .filter((game) => "overwolf" in game)
            .map((game) => (
              <AppSubscriptionCard
                key={game.title}
                game={game}
                userId={userId?.value}
                hasTier={game.patreonTierIDs?.some((tierId) =>
                  entitledTierIDs.includes(tierId),
                )}
              />
            ))}
        </div>
      </div>
    </section>
  );
}
