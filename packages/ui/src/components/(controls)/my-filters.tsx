"use client";
import {
  apiSetShare,
  cn,
  DrawingsAndNodes,
  FiltersApiError,
  saveFile,
  useAccountStore,
  useSettingsStore,
  useUserStore,
  writeFileOverwolf,
} from "@repo/lib";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import {
  CaseSensitive,
  ChevronRight,
  Clipboard,
  Copy,
  Download,
  EllipsisVertical,
  Globe,
  Lock,
  LogIn,
  Pencil,
  Trash,
  User,
  Users,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { toast } from "sonner";
import { RenameFilter } from "./rename-filter";
import { useEffect, useMemo, useRef, useState } from "react";
import { DeleteFilter } from "./delete-filter";

/**
 * Module-level memo of which (game) we've already hydrated from the
 * server during this page load. Prevents a hydrate-on-every-render
 * loop without storing the flag in zustand (which would persist to
 * localStorage and survive too long).
 */
const hydratedGames = new Set<string>();

function inferGameForHydrate(): string | null {
  if (typeof window === "undefined") return null;
  const path = window.location.pathname;
  if (path.startsWith("/apps/")) return path.split("/")[2] ?? null;
  const sub = window.location.hostname.split(".")[0];
  if (!sub || ["www", "app", "localhost", "127", "0"].includes(sub)) return null;
  return sub;
}

export function MyFilters() {
  const [open, setOpen] = useState(false);
  const { filters, setFilters, toggleFilter } = useUserStore();
  const myFilters = useSettingsStore((state) => state.myFilters);
  const addMyFilter = useSettingsStore((state) => state.addMyFilter);
  const setMyFilter = useSettingsStore((state) => state.setMyFilter);
  const hydrate = useSettingsStore((state) => state.hydrateFiltersFromServer);
  const decryptedUserId = useAccountStore((s) => s.decryptedUserId);
  const isSignedIn = !!decryptedUserId;
  const [deleteMyFilter, setDeleteMyFilter] = useState<DrawingsAndNodes | null>(
    null,
  );
  const [renameMyFilter, setRenameMyFilter] = useState<DrawingsAndNodes | null>(
    null,
  );

  // Hydrate filters from server once per (game, page load) for
  // signed-in users. Filters synced from other devices land in
  // myFilters; local-only filters (no server id) survive untouched.
  useEffect(() => {
    if (!isSignedIn) return;
    const game = inferGameForHydrate();
    if (!game || hydratedGames.has(game)) return;
    hydratedGames.add(game);
    void hydrate(game);
  }, [isSignedIn, hydrate]);

  const isDrawingEditing = useSettingsStore(
    (state) => state.tempPrivateDrawing !== null,
  );
  const setTempPrivateDrawing = useSettingsStore(
    (state) => state.setTempPrivateDrawing,
  );

  const filterNames = useMemo(
    () => myFilters.map((filter) => filter.name),
    [myFilters],
  );
  const activeFiltersLength = useMemo(
    () => filterNames.filter((filter) => filters.includes(filter)).length,
    [filters, filterNames],
  );

  const ratio =
    filterNames.length > 0 ? activeFiltersLength / filterNames.length : 0;

  if (filterNames.length === 0) {
    return <></>;
  }
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn("flex items-center transition-colors w-full px-1.5", {
          "text-muted-foreground": !activeFiltersLength,
        })}
      >
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1 text-left transition-colors hover:text-primary py-1 px-0.5 truncate grow min-w-0",
              {
                "text-muted-foreground": !activeFiltersLength,
              },
            )}
            title="My Filters"
            type="button"
          >
            <ChevronRight
              className={cn(
                "h-3 w-3 shrink-0 transition-transform duration-200",
                open && "rotate-90",
              )}
            />
            <span className="font-semibold truncate">My Filters</span>
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
              {activeFiltersLength}/{filterNames.length}
            </span>
          </button>
        </CollapsibleTrigger>
        <button
          className="text-[10px] text-muted-foreground hover:text-primary px-1.5 py-1 transition-colors shrink-0 uppercase tracking-wide"
          onClick={() => {
            const newFilters = activeFiltersLength
              ? filters.filter((filter) => !filterNames.includes(filter))
              : [...new Set([...filters, ...filterNames])];
            setFilters(newFilters);
          }}
          type="button"
          title={activeFiltersLength ? "Disable all" : "Enable all"}
        >
          {activeFiltersLength ? "None" : "All"}
        </button>
      </div>
      <div className="h-[2px] bg-muted/20 mx-1.5 overflow-hidden rounded-full">
        <div
          className="h-full bg-primary/50 transition-all duration-300 rounded-full"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <CollapsibleContent className="flex flex-wrap w-[200px] md:w-full">
        {myFilters
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((myFilter) => (
            <FilterRow
              key={myFilter.name}
              myFilter={myFilter}
              isActive={filters.includes(myFilter.name)}
              isSignedIn={isSignedIn}
              isDrawingEditing={isDrawingEditing}
              onToggle={() => toggleFilter(myFilter.name)}
              onDuplicate={(f) => {
                // Duplicate as a fresh local filter — strip server-only
                // and legacy-share fields so the copy doesn't try to
                // adopt the original's identity.
                const copy: DrawingsAndNodes = {
                  ...f,
                  name: `my_${Date.now()}_${f.name.replace(/my_\d+_/, "")}`,
                };
                delete copy.id;
                delete copy.shareCode;
                delete copy.visibility;
                delete copy.voteCount;
                delete copy.commentCount;
                delete copy.url;
                delete copy.isShared;
                addMyFilter(copy);
              }}
              onRename={setRenameMyFilter}
              onDelete={setDeleteMyFilter}
              onEditDrawing={(f) =>
                setTempPrivateDrawing({
                  ...(f.drawing ?? {}),
                  name: f.name,
                })
              }
              onShareChange={(updated) => {
                setMyFilter(updated.name, updated);
              }}
            />
          ))}
      </CollapsibleContent>
      <RenameFilter
        myFilter={renameMyFilter}
        onClose={() => setRenameMyFilter(null)}
      />
      <DeleteFilter
        myFilter={deleteMyFilter}
        onClose={() => setDeleteMyFilter(null)}
      />
    </Collapsible>
  );
}

interface FilterRowProps {
  myFilter: DrawingsAndNodes;
  isActive: boolean;
  isSignedIn: boolean;
  isDrawingEditing: boolean;
  onToggle: () => void;
  onDuplicate: (f: DrawingsAndNodes) => void;
  onRename: (f: DrawingsAndNodes) => void;
  onDelete: (f: DrawingsAndNodes) => void;
  onEditDrawing: (f: DrawingsAndNodes) => void;
  onShareChange: (next: DrawingsAndNodes) => void;
}

function FilterRow({
  myFilter,
  isActive,
  isSignedIn,
  isDrawingEditing,
  onToggle,
  onDuplicate,
  onRename,
  onDelete,
  onEditDrawing,
  onShareChange,
}: FilterRowProps) {
  // Track in-flight share operation so the menu doesn't fire twice
  // on rapid clicks.
  const busyRef = useRef(false);
  const isSynced = !!myFilter.id;
  const isPublic = myFilter.visibility === "public";
  const isLegacyShared = !!myFilter.url && !myFilter.id; // pre-rework local data
  const displayName = myFilter.name.replace(/my_\d+_/, "");

  async function callShare(input: {
    visibility?: "private" | "public";
    generateCode?: boolean;
    revokeCode?: boolean;
  }) {
    if (busyRef.current) return;
    if (!myFilter.id) {
      toast.error("Filter not yet synced to your account — try again in a moment");
      return;
    }
    busyRef.current = true;
    try {
      const updated = await apiSetShare(myFilter.id, input);
      onShareChange({
        ...myFilter,
        visibility: updated.visibility,
        shareCode: updated.shareCode ?? undefined,
        updatedAt: updated.updatedAt,
      });
    } catch (err) {
      const msg =
        err instanceof FiltersApiError ? err.message : "Sharing failed";
      toast.error(msg);
    } finally {
      busyRef.current = false;
    }
  }

  async function copyShareCode() {
    if (!myFilter.id) {
      toast.error("Filter not yet synced to your account");
      return;
    }
    let code = myFilter.shareCode;
    if (!code) {
      // Generate on first use.
      try {
        const updated = await apiSetShare(myFilter.id, { generateCode: true });
        code = updated.shareCode ?? undefined;
        onShareChange({
          ...myFilter,
          visibility: updated.visibility,
          shareCode: updated.shareCode ?? undefined,
          updatedAt: updated.updatedAt,
        });
      } catch (err) {
        const msg =
          err instanceof FiltersApiError ? err.message : "Could not generate share code";
        toast.error(msg);
        return;
      }
    }
    if (!code) {
      toast.error("No share code available");
      return;
    }
    await navigator.clipboard.writeText(code);
    toast(`Share code copied: ${code}`);
  }

  return (
    <div className="flex md:basis-1/2 overflow-hidden">
      <button
        className={cn(
          "grow flex gap-2 items-center transition-colors hover:text-primary p-2 truncate",
          { "text-muted-foreground": !isActive },
        )}
        onClick={onToggle}
        title={displayName}
        type="button"
      >
        {isPublic ? (
          <Globe className="h-5 w-5 shrink-0" />
        ) : isSynced || isLegacyShared ? (
          <Users className="h-5 w-5 shrink-0" />
        ) : (
          <User className="h-5 w-5 shrink-0" />
        )}
        <span className="truncate">{displayName}</span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger className="transition-colors text-muted-foreground hover:text-primary p-2">
          <EllipsisVertical className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            {!isSignedIn && (
              <DropdownMenuItem
                onClick={() => {
                  // Patreon OAuth entry point lives on www.th.gl. Open in
                  // a new tab so the user's in-progress map state isn't
                  // lost. After auth, they come back to /support-me/account
                  // and can return here.
                  window.open(
                    "https://www.th.gl/support-me/patreon",
                    "_blank",
                    "noopener",
                  );
                }}
              >
                <LogIn className="mr-2 h-4 w-4" />
                <span>Sign in to share</span>
              </DropdownMenuItem>
            )}
            {isSignedIn && isSynced && (
              <>
                <DropdownMenuItem onClick={copyShareCode}>
                  <Clipboard className="mr-2 h-4 w-4" />
                  <span>
                    {myFilter.shareCode
                      ? "Copy share code"
                      : "Create share code"}
                  </span>
                </DropdownMenuItem>
                {myFilter.shareCode && (
                  <DropdownMenuItem
                    onClick={() => callShare({ revokeCode: true })}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    <span>Revoke share code</span>
                  </DropdownMenuItem>
                )}
                {isPublic ? (
                  <DropdownMenuItem
                    onClick={() => callShare({ visibility: "private" })}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    <span>Make private</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => callShare({ visibility: "public" })}
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    <span>Publish to community</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={() => {
                const fileName = `${myFilter.name}_filter_${Date.now()}.json`;
                if (typeof overwolf === "undefined") {
                  const blob = new Blob([JSON.stringify(myFilter)], {
                    type: "text/json",
                  });
                  saveFile(blob, fileName);
                } else {
                  writeFileOverwolf(
                    JSON.stringify(myFilter),
                    overwolf.io.paths.documents +
                      "\\the-hidden-gaming-lair",
                    fileName,
                  );
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              <span>Download</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onEditDrawing(myFilter)}
              disabled={isDrawingEditing}
            >
              <Pencil className="mr-2 h-4 w-4" />
              <span>Edit drawing</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onRename(myFilter)}
              disabled={isDrawingEditing}
            >
              <CaseSensitive className="mr-2 h-4 w-4" />
              <span>Rename</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDuplicate(myFilter)}
              disabled={isDrawingEditing}
            >
              <Copy className="mr-2 h-4 w-4" />
              <span>Duplicate</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(myFilter)}
              disabled={isDrawingEditing}
            >
              <Trash className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
