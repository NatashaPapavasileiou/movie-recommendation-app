import React, { useState } from "react";
import { supabase } from "../modules/supabaseClient";
import styles from "./Auth.module.css";

interface LoginFormProps {
  onSwitchView: () => void;
  onForgotPassword: () => void;
  onSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchView,
  onForgotPassword,
  onSuccess,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      onSuccess();
    }
  };

  // Sends the password reset email using the address already typed above,
  // then switches the parent view to the "reset password" screen
  const handleForgotClick = async () => {
    setError("");

    if (!email) {
      setError("Please enter your email address first.");
      return;
    }

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });

    onForgotPassword();
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

        <div className={styles.forgotContainer}>
          <button
            type="button"
            className={styles.forgotBtn}
            onClick={handleForgotClick}
          >
            Forgot password?
          </button>
        </div>

        <button type="submit" className={styles.submitBtn}>
          LOG IN
        </button>
      </form>

      <p className={styles.switchText}>
        Don't have an account?
        <button className={styles.switchLink} onClick={onSwitchView}>
          Sign Up
        </button>
      </p>
    </div>
  );
};

export default LoginForm;