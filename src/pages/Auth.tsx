import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import styles from "../components/Auth.module.css";

const Auth = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const navigate = useNavigate();


  const handleLoginSuccess = () => {
    navigate("/"); 
  };

  
  const handleRegisterSuccess = () => {
    navigate("/setup-preferences"); 
  };

  return (
    <div className={styles.authPageContainer}>
      {isLoginView ? (
        <LoginForm 
          onSwitchView={() => setIsLoginView(false)} 
          onSuccess={handleLoginSuccess} 
        />
      ) : (
        <RegisterForm 
          onSwitchView={() => setIsLoginView(true)} 
          onSuccess={handleRegisterSuccess} 
        />
      )}
    </div>
  );
};

export default Auth;