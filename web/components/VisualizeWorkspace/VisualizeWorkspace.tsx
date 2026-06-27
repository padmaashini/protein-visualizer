"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import JobsSidebar from "@/components/JobsSidebar/JobsSidebar";
import JobCanvas from "@/components/JobCanvas/JobCanvas";
import CreateJobModal from "@/components/CreateJobModal/CreateJobModal";
import { listJobs, type VisualizationJob } from "@/lib/jobs";
import styles from "./VisualizeWorkspace.module.css";

export default function VisualizeWorkspace() {
  const [jobs, setJobs] = useState<VisualizationJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listJobs();
        if (active) {
          setJobs(data);
          setStatus("ready");
        }
      } catch {
        if (active) setStatus("error");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? null,
    [jobs, selectedJobId],
  );

  function handleCreated(job: VisualizationJob) {
    setJobs((current) => [job, ...current]);
    setSelectedJobId(job.id);
    setIsModalOpen(false);
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true" />
          NatureFold
        </Link>
        <Link href="/" className={styles.homeLink}>
          Home
        </Link>
      </header>

      <div className={styles.body}>
        <JobsSidebar
          jobs={jobs}
          status={status}
          selectedJobId={selectedJobId}
          onSelect={setSelectedJobId}
          onCreate={() => setIsModalOpen(true)}
        />
        <main className={styles.canvas}>
          <JobCanvas job={selectedJob} />
        </main>
      </div>

      {isModalOpen ? (
        <CreateJobModal
          onClose={() => setIsModalOpen(false)}
          onCreated={handleCreated}
        />
      ) : null}
    </div>
  );
}
