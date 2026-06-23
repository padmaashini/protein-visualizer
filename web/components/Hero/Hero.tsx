import Image from "next/image";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="page-title">
      <div className={styles.wallpaper} aria-hidden="true">
        <Image
          className={`${styles.render} ${styles.renderTopLeft}`}
          src="/1BEB.png"
          alt=""
          width={4032}
          height={3917}
          priority
        />
        <Image
          className={`${styles.render} ${styles.renderTopRight}`}
          src="/1TUP.png"
          alt=""
          width={5444}
          height={4320}
          priority
        />
        <span className={`${styles.ghost} ${styles.ghostThree}`} />
      </div>

      <div className={styles.copy}>
        <h1 id="page-title" className={styles.title}>
          The Building Blocks of Life
        </h1>
        <div className={styles.intro}>
          <p className={styles.summary}>
            Proteins are one of the four major types of biological molecules and
            a foundational part of your cells. They play a key role in many
            diseases and disorders and are one of the most researched topics. By
            being able to predict the structure of a protein based on its
            sequencing, we can predict its functions and its role in the
            organism. See some of the most researched proteins below or browse
            your own.
          </p>
          <div className={styles.actions} aria-label="Primary actions">
            <a href="#insulin" className={styles.btnPrimary}>
              Browse proteins
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}