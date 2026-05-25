import { makeCategoryPage } from "@/games/drakantos/category-page";
const { Page, generateMetadata } = makeCategoryPage("outfits", ["effects", "distances"]);
export { generateMetadata };
export default Page;
