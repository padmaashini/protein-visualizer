import ProteinViewer from "@/components/ProteinViewer/ProteinViewer";
import Section from "@/components/homepage/Section/Section";
import styles from "./CommonProtein.module.css";

type CommonProteinProps = {
  id: string;
  pdbId: string;
  name: string;
  tagline: string;
  description: string;
  imageAlignment: "left" | "right";
  variant?: "default" | "offset";
};

export default function CommonProtein({
  id,
  pdbId,
  name,
  tagline,
  description,
  imageAlignment,
  variant="default"
}: CommonProteinProps) {
  const isViewerLeft = imageAlignment === "left";

  return (
    <Section id={id} variant={variant}>
      <div
        className={[
          styles.layout,
          isViewerLeft ? styles.layoutViewerLeft : styles.layoutViewerRight,
        ].join(" ")}
      >
        {/* Viewer renders first in DOM always; CSS order controls visual position */}
        <div className={styles.viewer}>
          <ProteinViewer pdbId={pdbId} />
        </div>

        <aside className={styles.blob}>
          <p className={styles.blobLabel}>{name.toUpperCase()}</p>
          <h3 className={styles.blobHeading}>{tagline}</h3>
          <span className={styles.blobBody}>{description}</span>
        </aside>
      </div>
    </Section>
  );
}