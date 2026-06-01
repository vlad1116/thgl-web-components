"use client";
import dynamic from "next/dynamic";
import { AppMapProps } from "./app-map";

import type { JSX } from "react";

const AppMap = dynamic(() => import("./app-map").then((mod) => mod.AppMap), {
  ssr: false,
});

export function AppMapDynamic(props: AppMapProps): JSX.Element {
  return <AppMap {...props} />;
}
