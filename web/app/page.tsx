import Hero from "@/components/homepage/Hero/Hero";
import CommonProtein from "@/components/homepage/CommonProtein/CommonProtein";
import Section from "@/components/homepage/Section/Section";
import styles from "./page.module.css";

const proteins = [
  { name: "Insulin",    label: "Hormone",          detail: "3D structure placeholder" },
  { name: "Hemoglobin", label: "Transport protein", detail: "3D structure placeholder" },
  { name: "Custom PDB", label: "Upload target",     detail: "Backend integration later" },
];
const workflow = [
  "Load a protein structure",
  "Inspect domains and residues",
  "Save annotated views",
];

export default function Home() {
  return (
    <main className={styles.siteShell}>
      <Hero />

      <CommonProtein
        id="insulin"
        pdbId="4INS"
        name="Insulin"
        tagline="A small hormone with a precise fold."
        description="Insulin helps regulate blood glucose. Rotate the model to inspect its folded chains and compact 3D structure."
        imageAlignment="right"
        variant="offset"
      />

      <CommonProtein
        id="hemoglobin"
        pdbId="1GZX"
        name="Hemoglobin"
        tagline="The oxygen carrier of the blood."
        description="Hemoglobin transports oxygen from the lungs to tissues. Its four subunits cooperate through conformational changes."
        imageAlignment="left"
      />

    
      <CommonProtein
        id="ferritin"
        pdbId="1FHA"
        name="Ferritin"
        tagline="Nature's iron storage vault."
        description="A hollow protein cage built from 24 identical subunits. Ferritin stores and releases iron safely inside cells, assembling itself into a near-perfect sphere."
        imageAlignment="left"
      />
      {/* <Section
        id="workflow"
        kicker="Workflow"
        heading="A practical foundation for an interactive protein app."
      >
        <ol className={styles.workflowList}>
          {workflow.map((step, i) => (
            <li key={step}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {step}
            </li>
          ))}
        </ol>
      </Section> */}

      <footer className={styles.siteFooter}>
        <span>Protein Visualizer</span>
        <span>Backend scaffold lives in api.</span>
      </footer>
    </main>
  );
}