import StatusBadge from "@/components/StatusBadge/StatusBadge";
import { type VisualizationJob } from "@/lib/jobs";
import styles from "./JobsSidebar.module.css";

type JobsSidebarProps = {
  jobs: VisualizationJob[];
  status: "loading" | "ready" | "error";
  selectedJobId: number | null;
  onSelect: (id: number) => void;
  onCreate: () => void;
};

export default function JobsSidebar({
  jobs,
  status,
  selectedJobId,
  onSelect,
  onCreate,
}: JobsSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.title}>Jobs</h2>
        <button type="button" className={styles.createButton} onClick={onCreate}>
          <span aria-hidden="true">+</span> Create job
        </button>
      </div>

      {status === "loading" ? (
        <p className={styles.message}>Loading jobs...</p>
      ) : status === "error" ? (
        <p className={styles.message}>Could not load jobs.</p>
      ) : jobs.length === 0 ? (
        <p className={styles.message}>No jobs yet. Create one to get started.</p>
      ) : (
        <ul className={styles.list}>
          {jobs.map((job) => (
            <li key={job.id}>
              <button
                type="button"
                className={[
                  styles.jobItem,
                  job.id === selectedJobId ? styles.jobItemActive : "",
                ].join(" ")}
                onClick={() => onSelect(job.id)}
                aria-current={job.id === selectedJobId}
              >
                <span className={styles.jobName}>{job.name}</span>
                <StatusBadge status={job.status} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
