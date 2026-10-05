import React from "react";
import { Sparkles } from "lucide-react";
import styles from "./Preference.module.css"; 

export const PreferenceHeader: React.FC = () => {
  return (
    <div className={styles.headerWrapper}>
      <div className={styles.iconWrapper}>
        <Sparkles className={styles.icon} />
      </div>
      <h1 className={styles.title}>Choose your favorites</h1>
      <p className={styles.description}>
        Select at least <span className={styles.highlight}>3 movies</span> you like so we can tailor recommendations for you.
      </p>
    </div>
  );
};