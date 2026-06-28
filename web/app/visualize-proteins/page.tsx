import type { Metadata } from "next";
import VisualizeWorkspace from "@/components/VisualizeWorkspace/VisualizeWorkspace";

export const metadata: Metadata = {
  title: "Visualize Proteins | NatureFold",
  description: "Create folding jobs and visualize predicted protein structures.",
};

export default function VisualizeProteinsPage() {
  return <VisualizeWorkspace />;
}
