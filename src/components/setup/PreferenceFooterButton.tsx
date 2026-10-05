import React from 'react';
import { Film, Loader2 } from 'lucide-react';
import styles from './Preference.module.css';

interface FooterProps {
  selectedCount: number;
  saving: boolean;
  onFinish: () => void;
}

export const PreferenceFooterButton: React.FC<FooterProps> = ({ 
  selectedCount, 
  saving, 
  onFinish 
}) => {
  const isReady = selectedCount >= 3;
  
  
  const buttonClass = `${styles.footerButton} ${isReady && !saving ? styles.buttonEnabled : styles.buttonDisabled}`;

  return (
    <div className={styles.footerWrapper}>
      <button
        type="button"
        disabled={!isReady || saving}
        onClick={onFinish}
        className={buttonClass}
      >
        {saving ? (
          <Loader2 className={`${styles.spinner} ${styles.buttonIcon}`} />
        ) : (
          <Film className={`${styles.icon} ${styles.buttonIcon}`} />
        )}
        {!isReady ? `Select ${3 - selectedCount} more` : 'Continue to Home'}
      </button>
    </div>
  );
};