"use client";
import dynamic from "next/dynamic";
const Postly = dynamic(
  () => import("../src/main").then((module) => module.App),
  {
    ssr: false,
    loading: () => (
      <div className="app-loading">Getting your workspace ready…</div>
    ),
  },
);
export default function Home() {
  return <Postly />;
}
