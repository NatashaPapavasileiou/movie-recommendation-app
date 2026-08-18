import React, { useState } from "react";
import { supabase } from "../modules/supabaseClient";
import styles from "./Auth.module.css";

interface ResetPasswordProps {
  onBackToLogin: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ onBackToLogin }) => {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Password validation rules
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasMinLength = newPassword.length >= 8;

  const isPasswordValid =
    hasLowerCase && hasUpperCase && hasNumber && hasMinLength;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError("Please meet all password requirements.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setError(error.message);
    } else {
      alert("Password updated successfully! Please log in.");
      onBackToLogin();
    }
  };

  return (
    <div className={styles.authBox}>
      <h2 className={styles.authTitle}>Reset Password</h2>

      <p className={styles.infoBanner}>
        📩 A reset link was sent to your email. Click the link in your inbox
        to authenticate, then enter your new password below.
      </p>

      {error && <p className={styles.errorMsg}>{error}</p>}

      <form onSubmit={handleReset} className={styles.formGroup}>
        <input
          type="password"
          placeholder="New Password"
          className={styles.authInput}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          onFocus={() => setIsPasswordFocused(true)}
          required
        />

        {(isPasswordFocused || newPassword.length > 0) && (
          <div className={styles.validationBox}>
            <p className={styles.validationTitle}>Password must contain:</p>
            <p className={hasLowerCase ? styles.valid : styles.invalid}>
              {hasLowerCase ? "✔" : "✖"} A <b>lowercase</b> letter
            </p>
            <p className={hasUpperCase ? styles.valid : styles.invalid}>
              {hasUpperCase ? "✔" : "✖"} A <b>capital (uppercase)</b> letter
            </p>
            <p className={hasNumber ? styles.valid : styles.invalid}>
              {hasNumber ? "✔" : "✖"} A <b>number</b>
            </p>
            <p className={hasMinLength ? styles.valid : styles.invalid}>
              {hasMinLength ? "✔" : "✖"} Minimum <b>8 characters</b>
            </p>
          </div>
        )}

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!isPasswordValid}
        >
          UPDATE PASSWORD
        </button>
      </form>

      <p className={styles.switchText}>
        Remember your password?
        <button className={styles.switchLink} onClick={onBackToLogin}>
          Sign In
        </button>
      </p>
    </div>
  );
};

export default ResetPassword;