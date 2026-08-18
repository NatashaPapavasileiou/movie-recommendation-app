import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../modules/supabaseClient";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import ResetPassword from "../components/ResetPassword";
import styles from "../components/Auth.module.css";

const Auth = () => {
  // Check the URL synchronously, before Supabase finishes processing it
  // asynchronously — this catches a fresh page load from the email link
  // that would otherwise race the onAuthStateChange listener below
  const [view, setView] = useState<"login" | "register" | "reset">(() =>
    window.location.hash.includes("type=recovery") ? "reset" : "login"
  );
  const navigate = useNavigate();
  // Detects the recovery session created when the user clicks the
  // reset-password link in their email, and shows the reset screen
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setView("reset");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = () => {
    navigate("/");
  };

  const handleRegisterSuccess = () => {
    navigate("/setup-preferences");
  };

  return (
    <div className={styles.authPageContainer}>
      {view === "login" && (
        <LoginForm
          onSwitchView={() => setView("register")}
          onForgotPassword={() => setView("reset")}
          onSuccess={handleLoginSuccess}
        />
      )}

      {view === "register" && (
        <RegisterForm
          onSwitchView={() => setView("login")}
          onSuccess={handleRegisterSuccess}
        />
      )}

      {view === "reset" && (
        <ResetPassword onBackToLogin={() => setView("login")} />
      )}
    </div>
  );
};

export default Auth;