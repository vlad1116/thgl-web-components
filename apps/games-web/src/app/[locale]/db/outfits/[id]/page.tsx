import { makeEntryPage } from "@/games/drakantos/entry-page";
const { Page, generateMetadata } = makeEntryPage("outfits", ["outfits", "effects", "distances"]);
export { generateMetadata };
export default Page;
