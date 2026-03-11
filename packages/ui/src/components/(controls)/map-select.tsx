import { Check, ChevronDown, Map } from "lucide-react";
import { useLocale, useT } from "../(providers)";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { useState } from "react";
import { cn, localizePath, useUserStore } from "@repo/lib";
import { ScrollArea } from "../ui/scroll-area";

export function MapSelect({
  mapNames,
}: {
  mapNames: {
    name: string;
    defaultTitle: string;
  }[];
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const mapName = useUserStore((state) => state.mapName);
  const setMapName = useUserStore((state) => state.setMapName);
  const t = useT();
  const locale = useLocale();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          className="flex items-center w-full px-2.5 py-1.5 text-sm transition-colors hover:text-primary group"
          type="button"
        >
          <Map className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium">
            {t(mapName) || mapName}
          </span>
          <ChevronDown
            className={cn(
              "ml-auto h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full">
        <Command className="w-[200px] md:w-[300px]">
          <CommandInput placeholder="Search map..." />
          <CommandEmpty className="w-full">No map found.</CommandEmpty>
          <CommandList>
            <CommandGroup className="p-0 grid">
              <ScrollArea className="h-full max-h-96">
                {mapNames.map(({ name, defaultTitle }) => (
                  <CommandItem
                    key={name}
                    value={t(name)}
                    onSelect={() => {
                      if (name === mapName) {
                        setOpen(false);
                        return;
                      }

                      setMapName(name);
                      setOpen(false);
                      if (location.pathname.includes("/maps/")) {
                        window.history.pushState(
                          {},
                          "",
                          localizePath(`/maps/${defaultTitle}`, locale),
                        );
                      }
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        mapName === name ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {t(name)}
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
