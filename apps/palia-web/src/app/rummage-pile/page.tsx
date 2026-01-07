import { ExternalAnchor, HeaderOffset } from "@repo/ui/header";
import { type Metadata } from "next";
import { ContentLayout } from "@repo/ui/ads";
import { Button } from "@repo/ui/controls";
import Image from "next/image";
import { Suspense } from "react";
import { getApiUrl, decodeFromBuffer, fetchVersion } from "@repo/lib";
import { PaliaGrid } from "@repo/ui/data";
import { type Spawns } from "@repo/ui/providers";
import { DownloadIcon, FilterIcon, MapPinIcon } from "lucide-react";
import Filter from "./filter.webp";
import Map from "./map.webp";
import PileMapClient from "@/components/pile-map-client";
import { APP_CONFIG } from "@/config";

export const metadata: Metadata = {
  alternates: {
    canonical: "/rummage-pile",
  },
  title: "Palia Rummage Pile and Chapaa Pile – The Hidden Gaming Lair",
  description:
    "Discover Rummage Pile and Chapaa Pile locations in Palia. Find piles in Kilima Village, Bahari Bay, and Elderwood to collect valuable resources and items.",
};

export default async function RummagePile() {
  const version = await fetchVersion(APP_CONFIG.name);

  const rummagePileIcon = version.data.filters
    .find((f) => f.group === "players")!
    .values.find((v) => v.id === "other_player")!.icon;

  const timedLootPilesResponse = await fetch(
    "https://palia-api.th.gl/nodes?type=timedLootPiles",
    {
      next: {
        revalidate: 300, // Auto-revalidate every 5 minutes
        tags: ["rummage-pile"], // Allow manual revalidation
      },
    },
  );
  const data = (await timedLootPilesResponse.json()) as TimedLootPiles;

  const url = getApiUrl("palia", "q=stable");
  const response = await fetch(url, {
    next: {
      revalidate: 300, // Auto-revalidate every 5 minutes
    },
  });
  const buffer = await response.arrayBuffer();
  const stableNodes = decodeFromBuffer<Spawns>(new Uint8Array(buffer));
  const stableNodeIcon = version.data.filters
    .find((f) => f.group === "locations")!
    .values.find((v) => v.id === "stable")!.icon;

  return (
    <HeaderOffset full>
      <ContentLayout
        id="palia"
        header={
          <>
            <h2 className="text-2xl">Rummage Piles</h2>
            <p className="text-sm">
              Discover Rummage Pile and Chapaa Pile locations in Palia. Select
              between Kilima Village, Bahari Bay, and Elderwood to find
              valuable resources and items.
            </p>
          </>
        }
        content={
          <>
            <Suspense>
              <PileMapClient
                timedLootPiles={data}
                stableNodes={stableNodes}
                stableNodeIcon={stableNodeIcon}
                icon={rummagePileIcon}
                tiles={version.data.tiles}
                icons={version.more.icons}
              />
              <PaliaGrid force />
            </Suspense>
            {/* In-Game App CTA Section */}
            <div className="mt-8 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 border border-primary/20 p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-primary mb-2">
                  Real-Time Pile Tracking
                </h3>
                <p className="text-muted-foreground">
                  Never miss a Rummage Pile again with live in-game overlay
                </p>
              </div>

              {/* Step Cards */}
              <div className="grid gap-6 md:grid-cols-3 mb-8">
                {/* Step 1 */}
                <ExternalAnchor
                  href="https://www.th.gl/companion-app"
                  className="relative group"
                >
                  <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex flex-col items-center gap-4 rounded-xl bg-card/50 border border-border/50 p-5 h-full group-hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg shrink-0">
                      1
                    </div>
                    <DownloadIcon className="w-8 h-8 text-primary shrink-0" />
                    <div className="text-center">
                      <p className="font-medium mb-1">Install the App</p>
                      <p className="text-sm text-muted-foreground">
                        Get the THGL companion app
                      </p>
                    </div>
                  </div>
                </ExternalAnchor>

                {/* Step 2 */}
                <div className="relative group">
                  <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex flex-col items-center gap-4 rounded-xl bg-card/50 border border-border/50 p-5 h-full">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg shrink-0">
                      2
                    </div>
                    <FilterIcon className="w-8 h-8 text-primary shrink-0" />
                    <div className="text-center">
                      <p className="font-medium mb-1">Enable Filter</p>
                      <p className="text-sm text-muted-foreground">
                        Select Rummage Pile in filters
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative group">
                  <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex flex-col items-center gap-4 rounded-xl bg-card/50 border border-border/50 p-5 h-full">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg shrink-0">
                      3
                    </div>
                    <MapPinIcon className="w-8 h-8 text-primary shrink-0" />
                    <div className="text-center">
                      <p className="font-medium mb-1">Track Live</p>
                      <p className="text-sm text-muted-foreground">
                        See piles on your in-game map
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Screenshots */}
              <div className="grid gap-4 md:grid-cols-2 mb-8">
                <div className="rounded-lg overflow-hidden shadow-lg border border-border/50">
                  <Image
                    src={Filter}
                    alt="Rummage Piles Filter"
                    className="w-full h-auto"
                  />
                </div>
                <div className="rounded-lg overflow-hidden shadow-lg border border-border/50">
                  <Image
                    src={Map}
                    alt="Map View"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {/* CTA Button */}
              <Button size="lg" className="shadow-lg shadow-primary/20" asChild>
                <ExternalAnchor href="https://www.th.gl/companion-app">
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  Get THGL Companion App
                </ExternalAnchor>
              </Button>
            </div>
          </>
        }
      />
    </HeaderOffset>
  );
}

export type TimedLootPiles = {
  [type: string]: {
    mapName: string;
    positions: [number, number, number][]; // ← Array for multiple positions
    timestamp: number;
  };
};
