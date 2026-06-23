import styles from "./Section.module.css";
import { ReactNode } from "react";

type SectionProps = {
  id?: string;
  kicker?: string;
  heading?: string;
  /** "default" = dark navy | "offset" = slightly lighter panel */
  variant?: "default" | "offset";
  className?: string;
  children: ReactNode;
};

export default function Section({
  id,
  kicker,
  heading,
  variant = "default",
  className = "",
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      className={[
        styles.section,
        styles[`variant_${variant}`],
        className,
      ].join(" ")}
      aria-labelledby={heading && id ? `${id}-heading` : undefined}
    >
      {(kicker || heading) && (
        <div className={styles.sectionHeading}>
          {kicker && <p className={styles.kicker}>{kicker}</p>}
          {heading && (
            <h2 id={id ? `${id}-heading` : undefined} className={styles.heading}>
              {heading}
            </h2>
          )}
        </div>
      )}
      {children}
    </section>
  );
}