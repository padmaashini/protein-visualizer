import ProteinViewer from "@/components/ProteinViewer/ProteinViewer";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import { type VisualizationJob } from "@/lib/jobs";
import styles from "./JobCanvas.module.css";

export default function JobCanvas({ job }: { job: VisualizationJob | null }) {
  if (!job) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyOrb} aria-hidden="true" />
        <p className={styles.emptyText}>Select a job to visualize</p>
      </div>
    );
  }

  return (
    <div className={styles.canvas}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <h1 className={styles.jobName}>{job.name}</h1>
          <StatusBadge status={job.status} />
        </div>
        <p className={styles.model}>Model: {job.model.toUpperCase()}</p>
      </header>

      <div className={styles.stage}>
        {job.status === "completed" && job.pdb_data ? (
          <ProteinViewer structureData={job.pdb_data} structureFormat="pdb" />
        ) : job.status === "failed" ? (
          <div className={styles.state}>
            <p className={styles.stateTitle}>Folding failed</p>
            <p className={styles.stateBody}>
              {job.error ?? "Something went wrong while folding this sequence."}
            </p>
          </div>
        ) : (
          <div className={styles.state}>
            <div className={styles.spinner} aria-hidden="true" />
            <p className={styles.stateTitle}>
              {job.status === "running" ? "Folding sequence..." : "Queued for folding"}
            </p>
            <p className={styles.stateBody}>
              The structure will appear here once {job.model.toUpperCase()} finishes
              predicting the fold.
            </p>
          </div>
        )}
      </div>

      <section className={styles.sequence}>
        <p className={styles.sequenceLabel}>
          Amino acid sequence
          <span className={styles.sequenceCount}>
            {job.sequence.length} residues
          </span>
        </p>
        <code className={styles.sequenceText}>{job.sequence}</code>
      </section>
    </div>
  );
}
