import { OwAdOptionsSize } from "@overwolf/types/owads";

export function initAd(container: HTMLElement, size: OwAdOptionsSize) {
  if (typeof window.OwAd === "undefined") {
    return;
  }

  const owAd = new window.OwAd(container, {
    size: size,
  });
  return owAd;
}
