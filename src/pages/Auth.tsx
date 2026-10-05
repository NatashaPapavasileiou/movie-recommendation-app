import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../modules/supabaseClient";
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";
import ResetPassword from "../components/auth/ResetPassword";
import styles from "../components/auth/Auth.module.css";

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

  // Determine navigation target based on user role upon successful login
  const handleLoginSuccess = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Fetch the user's role from public.profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        // Redirect admins directly to the hidden dashboard
        if (profile?.role === "admin") {
          navigate("/admin");
          return;
        }
      }
    } catch (err) {
      console.error("Error evaluating user role on login:", err);
    }

    // Default route for regular authenticated users
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