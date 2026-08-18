import React, { useState } from "react";
import { supabase } from "../modules/supabaseClient";
import styles from "./Auth.module.css";

interface RegisterFormProps {
  onSwitchView: () => void;
  onSuccess: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchView, onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Password validation rules
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasMinLength = password.length >= 8;

  const isPasswordValid = hasLowerCase && hasUpperCase && hasNumber && hasMinLength;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError("Please meet all password requirements before submitting.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else if (data?.user) {
      alert("Registration successful! Welcome 🎉");
      onSuccess();
    }
  };

  return (
    <div className={styles.authBox}>
      <h2 className={styles.authTitle}>Create Account</h2>
      {error && <p className={styles.errorMsg}>{error}</p>}

      <form onSubmit={handleRegister} className={styles.formGroup}>
        <input
          type="email"
          placeholder="Email Address"
          className={styles.authInput}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className={styles.authInput}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setIsPasswordFocused(true)}
          required
        />

        {/* Display validation criteria when user focuses or types */}
        {(isPasswordFocused || password.length > 0) && (
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

        <button type="submit" className={styles.submitBtn} disabled={!isPasswordValid}>
          REGISTER
        </button>
      </form>

      <p className={styles.switchText}>
        Already have an account?
        <button className={styles.switchLink} onClick={onSwitchView}>
          Sign In
        </button>
      </p>
    </div>
  );
};

export default RegisterForm;