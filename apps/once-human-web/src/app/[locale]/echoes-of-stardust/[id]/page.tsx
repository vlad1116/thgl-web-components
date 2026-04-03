import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { type Database } from "@repo/ui/providers";
import { Button } from "@repo/ui/controls";
import { ExternalAnchor } from "@repo/ui/header";
import { fetchDatabase, fetchDict, fetchTiles, translate } from "@repo/lib";
import SimpleMapClient from "@/components/simple-map-client";
import { APP_CONFIG } from "@/config";

type Params = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const [database, enDict] = await Promise.all([
    fetchDatabase(APP_CONFIG.name),
    fetchDict(APP_CONFIG.name),
  ]);

  const category = database.find((item) =>
    item.items.some((i) => i.id === id),
  ) as Database[number] | undefined;
  if (!category) {
    return {};
  }
  const item = category.items.find((i) => i.id === id);
  if (!item) {
    return {};
  }

  return {
    title: `${translate(enDict, item.props.title)} – The Hidden Gaming Lair`,
    description: translate(enDict, item.props.content),
  };
}

export default async function Item({
  params,
}: {
  params: Params;
}): Promise<JSX.Element> {
  const { id } = await params;
  const [tiles, database, enDict] = await Promise.all([
    fetchTiles(APP_CONFIG.name),
    fetchDatabase(APP_CONFIG.name),
    fetchDict(APP_CONFIG.name),
  ]);

  const category = database.find((item) =>
    item.items.some((i) => i.id === id),
  ) as Database[number] | undefined;
  if (!category) {
    notFound();
  }
  const item = category.items.find((i) => i.id === id);
  if (!item) {
    notFound();
  }

  return (
    <div className="py-6 text-left space-y-2">
      <h3 className="uppercase text-4xl">{translate(enDict, item.props.title)}</h3>
      <p className="text-primary">{translate(enDict, item.props.title1)}</p>
      <p className="text-primary">{translate(enDict, item.props.title2)}</p>
      <p className="text-primary">{translate(enDict, item.props.title3)}</p>
      <p className="pt-4 text-muted-foreground whitespace-break-spaces">
        {translate(enDict, item.props.content).trim()}
      </p>
      <h3 className="uppercase text-3xl">Location</h3>
      {item.props.location ? (
        <SimpleMapClient
          spawns={[
            {
              id: item.id,
              name: translate(enDict, item.props.title),
              icon: null,
              p: [item.props.location[1], item.props.location[0]],
            },
          ]}
          tiles={tiles}
        />
      ) : (
        <>
          <p className="text-sm">
            Please join the Discord server, if you know the location.
          </p>
          <Button asChild variant="secondary">
            <ExternalAnchor href="https://th.gl/discord">
              Join Discord
            </ExternalAnchor>
          </Button>
        </>
      )}
    </div>
  );
}
