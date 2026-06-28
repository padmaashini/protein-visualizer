"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import JobsSidebar from "@/components/JobsSidebar/JobsSidebar";
import JobCanvas from "@/components/JobCanvas/JobCanvas";
import CreateJobModal from "@/components/CreateJobModal/CreateJobModal";
import SignInButton from "@/components/SignInButton/SignInButton";
import { useAuth } from "@/components/AuthProvider/AuthProvider";
import { listJobs, type VisualizationJob } from "@/lib/jobs";
import styles from "./VisualizeWorkspace.module.css";

export default function VisualizeWorkspace() {
  const { user, status: authStatus, signOut } = useAuth();
  const [jobs, setJobs] = useState<VisualizationJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isAuthenticated = authStatus === "authenticated";

  useEffect(() => {
    if (!isAuthenticated) return;
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
  }, [isAuthenticated, user?.id]);

  function handleSignOut() {
    setJobs([]);
    setSelectedJobId(null);
    setStatus("loading");
    signOut();
  }

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

        <div className={styles.topBarRight}>
          <Link href="/" className={styles.homeLink}>
            Home
          </Link>
          {isAuthenticated && user ? (
            <div className={styles.profile}>
              {user.picture ? (
                <Image
                  className={styles.avatar}
                  src={user.picture}
                  alt=""
                  width={30}
                  height={30}
                />
              ) : null}
              <span className={styles.profileName}>{user.name ?? user.email}</span>
              <button
                type="button"
                className={styles.signOut}
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          ) : authStatus === "unauthenticated" ? (
            <SignInButton />
          ) : null}
        </div>
      </header>

      {isAuthenticated ? (
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
      ) : (
        <div className={styles.signInPanel}>
          <div className={styles.signInOrb} aria-hidden="true" />
          <h1 className={styles.signInTitle}>Sign in to fold proteins</h1>
          <p className={styles.signInText}>
            Create folding jobs and visualize predicted structures. Your jobs are
            private to your account.
          </p>
          {authStatus === "unauthenticated" ? (
            <SignInButton />
          ) : (
            <p className={styles.signInText}>Checking your session...</p>
          )}
        </div>
      )}

      {isModalOpen ? (
        <CreateJobModal
          onClose={() => setIsModalOpen(false)}
          onCreated={handleCreated}
        />
      ) : null}
    </div>
  );
}
