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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      if (data?.user) {
        alert("Registration successful! Welcome 🎉");
        onSuccess(); 
      }
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
          required
        />
        <button type="submit" className={styles.submitBtn}>REGISTER</button>
      </form>

      <p className={styles.switchText}>
        Already have an account? 
        <button className={styles.switchLink} onClick={onSwitchView}>Sign In</button>
      </p>
    </div>
  );
};

export default RegisterForm;