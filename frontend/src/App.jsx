import { useState } from "react";
import Login from "../pages/Login.jsx";
import Dashboard from "./components/Dashboard.jsx";

function App() {
  const [user, setUser] = useState(() => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData || userData === "undefined" || userData === "null") {
        return null;
      }
      return JSON.parse(userData);
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
      // Limpiar datos corruptos
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return null;
    }
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // Estilos globales para resetear los del index.css
  const appStyles = {
    margin: 0,
    padding: 0,
    width: "100%",
    height: "100vh",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  if (!user) {
    return (
      <div style={appStyles}>
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div style={appStyles}>
      <Dashboard user={user} onLogout={handleLogout} />
    </div>
  );
}

export default App;