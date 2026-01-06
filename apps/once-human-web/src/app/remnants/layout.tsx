import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { fetchDatabase, fetchDict, translate } from "@repo/lib";
import { DatabaseSidebar } from "@/components/database-sidebar";
import { APP_CONFIG } from "@/config";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const enDict = await fetchDict(APP_CONFIG.name);
  const database = await fetchDatabase(APP_CONFIG.name);

  const data = database
    .filter((item) => item.type.startsWith("remnants_"))
    .sort((a, b) =>
      enDict[a.type].localeCompare(enDict[b.type], undefined, {
        numeric: true,
      }),
    );

  const menu = data.map((item) => {
    return {
      category: {
        key: item.type,
        value: enDict[item.type],
      },
      items: item.items.map((subitem) => ({
        key: subitem.id,
        text: translate(enDict, subitem.props.title),
        href: `/remnants/${subitem.id}`,
      })),
    };
  });

  return (
    <HeaderOffset full>
      <ContentLayout
        id="once-human"
        header={
          <>
            <h2 className="text-2xl">All Remnants Records</h2>
            <p className="text-sm my-2">
              A comprehensive list of remnants records for Once Human.
            </p>
          </>
        }
        sidebar={<DatabaseSidebar menu={menu} />}
        content={children}
      />
    </HeaderOffset>
  );
}
