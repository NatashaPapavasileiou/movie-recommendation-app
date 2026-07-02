import React, { useState } from "react";
import { supabase } from "../modules/supabaseClient";
import styles from "./Auth.module.css";

interface LoginFormProps {
  onSwitchView: () => void;
  onSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchView, onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      onSuccess();
    }
  };

  return (
    <div className={styles.authBox}>
      <h2 className={styles.authTitle}>Sign In</h2>
      {error && <p className={styles.errorMsg}>{error}</p>}
      
      <form onSubmit={handleLogin} className={styles.formGroup}>
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
          required
        />
        <button type="submit" className={styles.submitBtn}>LOG IN</button>
      </form>

      <p className={styles.switchText}>
        Don't have an account? 
        <button className={styles.switchLink} onClick={onSwitchView}>Sign Up</button>
      </p>
    </div>
  );
};

export default LoginForm;