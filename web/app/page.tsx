import Image from "next/image";

const annotations = [
  {
    eyebrow: "Sequence",
    title: "Follow amino acid chains from source to folded form.",
    body: "Keep residue notes, domains, and predicted confidence close to the model.",
  },
  {
    eyebrow: "Interaction",
    title: "Inspect binding pockets and exposed surface regions.",
    body: "The future viewer can support rotation, zoom, highlighted residues, and saved camera states.",
  },
  {
    eyebrow: "Comparison",
    title: "Place related proteins side by side.",
    body: "Review insulin, hemoglobin, enzymes, and custom structures in a consistent workspace.",
  },
];

const proteins = [
  {
    name: "Insulin",
    label: "Hormone",
    detail: "3D structure placeholder",
    className: "protein-card protein-card--insulin",
  },
  {
    name: "Hemoglobin",
    label: "Transport protein",
    detail: "3D structure placeholder",
    className: "protein-card protein-card--hemoglobin",
  },
  {
    name: "Custom PDB",
    label: "Upload target",
    detail: "Backend integration later",
    className: "protein-card protein-card--custom",
  },
];

const workflow = [
  "Load a protein structure",
  "Inspect domains and residues",
  "Save annotated views",
];

export default function Home() {
  return (
    <main className="site-shell">
      <section className="hero-section" aria-labelledby="page-title">
        <div className="protein-wallpaper" aria-hidden="true">
          <Image
            className="protein-render protein-render--top-left"
            src="/1BEB.png"
            alt=""
            width={4032}
            height={3917}
            priority
          />
          <Image
            className="protein-render protein-render--top-right"
            src="/1TUP.png"
            alt=""
            width={5444}
            height={4320}
            priority
          />
          <span className="protein-ghost protein-ghost--three" />
        </div>

        <div className="hero-copy">
          <div>
            <h1 id="page-title">The Building Blocks of Life</h1>
          </div>
          <div className="hero-intro">
            <p className="hero-summary">
              Proteins are one of the four major types of biological molecules and a foundational part of your cells. They play a key role in many diseases and disorders and are one of the most researched topics. A protein structure is very complex and determine by numerous factors. By being able to predict the structure of a protein based on its sequencing, we can predict its functions and its role in the organism. See some of the most researched proteins below or browse your own.
            </p>
            <div className="hero-actions" aria-label="Primary actions">
              <a href="#library" className="button button--primary">
                Browse proteins
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-band" id="annotations">
        <div className="section-heading">
          <p className="section-kicker">Structure notes</p>
          <h2>Designed for reading the model while inspecting it.</h2>
        </div>
        <div className="annotation-grid">
          {annotations.map((annotation) => (
            <article className="annotation" key={annotation.eyebrow}>
              <p>{annotation.eyebrow}</p>
              <h3>{annotation.title}</h3>
              <span>{annotation.body}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="library-section" id="library">
        <div className="section-heading">
          <p className="section-kicker">Protein library</p>
          <h2>Start with common examples, then connect real data.</h2>
        </div>
        <div className="protein-library">
          {proteins.map((protein) => (
            <article className={protein.className} key={protein.name}>
              <div className="mini-viewer" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div>
                <p>{protein.label}</p>
                <h3>{protein.name}</h3>
                <span>{protein.detail}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="workflow-section" id="workflow">
        <div className="section-heading">
          <p className="section-kicker">Workflow</p>
          <h2>A practical foundation for an interactive protein app.</h2>
        </div>
        <ol className="workflow-list">
          {workflow.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <footer className="site-footer">
        <span>Protein Visualizer</span>
        <span>Backend scaffold lives in api.</span>
      </footer>
    </main>
  );
}
