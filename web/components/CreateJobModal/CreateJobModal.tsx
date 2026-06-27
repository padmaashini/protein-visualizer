"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createJob, type VisualizationJob } from "@/lib/jobs";
import styles from "./CreateJobModal.module.css";

const MODELS = [{ value: "esmfold", label: "ESMFold" }];

type CreateJobModalProps = {
  onClose: () => void;
  onCreated: (job: VisualizationJob) => void;
};

export default function CreateJobModal({
  onClose,
  onCreated,
}: CreateJobModalProps) {
  const [name, setName] = useState("");
  const [model, setModel] = useState(MODELS[0].value);
  const [sequence, setSequence] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const job = await createJob({
        name: name.trim(),
        model,
        sequence: sequence.trim(),
      });
      onCreated(job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job");
      setSubmitting(false);
    }
  }

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-job-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2 id="create-job-title" className={styles.title}>
            Create job
          </h2>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>Job name</span>
            <input
              className={styles.input}
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. My insulin variant"
              required
              autoFocus
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Model</span>
            <select
              className={styles.input}
              value={model}
              onChange={(event) => setModel(event.target.value)}
            >
              {MODELS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Amino acid sequence</span>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={sequence}
              onChange={(event) => setSequence(event.target.value)}
              placeholder="MKTAYIAKQR..."
              rows={5}
              required
            />
            <span className={styles.hint}>
              Single-letter codes (ACDEFGHIKLMNPQRSTVWY).
            </span>
          </label>

          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondary}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primary}
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
