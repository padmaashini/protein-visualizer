import Hero from "@/components/homepage/Hero/Hero";
import CommonProtein, {
  type CommonProteinProps,
} from "@/components/homepage/CommonProtein/CommonProtein";
import styles from "./page.module.css";

const proteins: CommonProteinProps[] = [
  {
    id: "insulin",
    pdbId: "4INS",
    name: "Insulin",
    tagline: "A small hormone with a precise fold.",
    description:
      "Insulin helps regulate blood glucose. Rotate the model to inspect its folded chains and compact 3D structure.",
    imageAlignment: "right",
    variant: "offset",
  },
  {
    id: "hemoglobin",
    pdbId: "1GZX",
    name: "Hemoglobin",
    tagline: "The oxygen carrier of the blood.",
    description:
      "Hemoglobin transports oxygen from the lungs to tissues. Its four subunits cooperate through conformational changes.",
    imageAlignment: "left",
    zoom: 0.8,
  },
  {
    id: "ferritin",
    pdbId: "1FHA",
    name: "Ferritin",
    tagline: "Nature's iron storage vault.",
    description:
      "A hollow protein cage built from 24 identical subunits. Ferritin stores and releases iron safely inside cells, assembling itself into a near-perfect sphere.",
    imageAlignment: "right",
    variant: "offset",
    zoom: 0.8,
  },
];

export default function Home() {
  return (
    <main className={styles.siteShell}>
      <Hero />

      {proteins.map((protein) => (
        <CommonProtein key={protein.id} {...protein} />
      ))}

      <footer className={styles.siteFooter}>
        <span>Protein Visualizer</span>
      </footer>
    </main>
  );
}
