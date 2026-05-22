import dynamic from "next/dynamic";

const LiveExperience = dynamic(
  () => import("@/components/three/LiveExperience").then((m) => m.LiveExperience),
  { ssr: false },
);

export const metadata = {
  title: "Live Booking — Book Junk Away Tampa",
  description:
    "Watch a yellow dump truck dispatch to your door in 3D. Book Junk Away's live Tampa dispatch — same-day pickup, $50 off your first load.",
};

export default function LivePage() {
  return <LiveExperience />;
}
