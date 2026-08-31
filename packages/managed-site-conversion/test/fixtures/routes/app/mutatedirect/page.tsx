import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mutatedirect title",
  robots: { index: true },
};

metadata.robots = { index: false };

export default function PageMutatedirect() {
  return (
    <section id="mutatedirect">
      <h1>Mutatedirect</h1>
    </section>
  );
}
