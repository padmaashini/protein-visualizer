import ProteinViewer from "@/components/ProteinViewer/ProteinViewer";
import Section from "@/components/Section/Section";
import styles from "./CommonProtein.module.css";

export type CommonProteinProps = {
  id: string;
  pdbId: string;
  name: string;
  tagline: string;
  description: string;
  imageAlignment: "left" | "right";
  variant?: "default" | "offset";
  zoom?: number;
};

export default function CommonProtein({
  id,
  pdbId,
  name,
  tagline,
  description,
  imageAlignment,
  variant = "default",
  zoom,
}: CommonProteinProps) {
  const isViewerLeft = imageAlignment === "left";
  const sectionBackgroundColor = variant === "offset" ? "#0d1a2a" : "#0a1524";

  return (
    <Section id={id} variant={variant} className={styles.proteinSection}>
      <div
        className={[
          styles.layout,
          isViewerLeft ? styles.layoutViewerLeft : styles.layoutViewerRight,
        ].join(" ")}
      >
        <div className={styles.viewer}>
          <ProteinViewer
            pdbId={pdbId}
            backgroundColor={sectionBackgroundColor}
            zoom={zoom}
          />
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
