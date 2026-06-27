import { type JobStatus } from "@/lib/jobs";
import styles from "./StatusBadge.module.css";

const LABELS: Record<JobStatus, string> = {
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
};

export default function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={[styles.badge, styles[status]].join(" ")}>
      <span className={styles.dot} aria-hidden="true" />
      {LABELS[status] ?? status}
    </span>
  );
}
