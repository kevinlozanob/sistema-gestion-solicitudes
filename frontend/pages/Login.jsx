import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from "lucide-react";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    console.log("🔄 Intentando login con:", { email, password }); // Debug
    
    try {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      console.log("📡 Respuesta del servidor:", res.status); // Debug
      
      const data = await res.json();
      console.log("📄 Datos recibidos:", data); // Debug
      
      if (!res.ok) {
        throw new Error(data.error || "Error de login");
      }
      
      console.log("✅ Login exitoso, guardando token..."); // Debug
      localStorage.setItem("token", data.token);
      onLogin(data.user);
      
    } catch (err) {
      console.error("❌ Error en login:", err); // Debug
      setError(err.message || "Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  const cardStyle = {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    padding: "40px 30px",
    width: "100%",
    maxWidth: "400px",
    position: "relative",
    overflow: "hidden"
  };

  const headerStyle = {
    textAlign: "center",
    marginBottom: "30px"
  };

  const titleStyle = {
    fontSize: "28px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "8px"
  };

  const subtitleStyle = {
    color: "#666",
    fontSize: "14px"
  };

  const inputGroupStyle = {
    position: "relative",
    marginBottom: "20px"
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px 12px 45px",
    border: "2px solid #e1e5e9",
    borderRadius: "12px",
    fontSize: "16px",
    transition: "all 0.3s ease",
    backgroundColor: "#f8f9fa",
    boxSizing: "border-box"
  };

  const iconStyle = {
    position: "absolute",
    left: "15px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#666",
    zIndex: 1
  };

  const eyeIconStyle = {
    position: "absolute",
    right: "15px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#666",
    cursor: "pointer",
    zIndex: 1
  };

  const buttonStyle = {
    width: "100%",
    padding: "14px",
    background: loading 
      ? "linear-gradient(135deg, #ccc 0%, #999 100%)"
      : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontWeight: "600",
    fontSize: "16px",
    cursor: loading ? "not-allowed" : "pointer",
    transition: "all 0.3s ease",
    position: "relative",
    overflow: "hidden"
  };

  const errorStyle = {
    background: "linear-gradient(135deg, #ff6b6b, #ee5a5a)",
    color: "#fff",
    borderRadius: "10px",
    padding: "12px",
    marginTop: "20px",
    textAlign: "center",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  };

  const loadingSpinnerStyle = {
    border: "2px solid transparent",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    width: "16px",
    height: "16px",
    animation: "spin 1s linear infinite",
    marginRight: "8px"
  };

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .input-field:focus {
          border-color: #667eea !important;
          background-color: #fff !important;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
          outline: none;
        }
        
        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }
      `}</style>
      
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={{ marginBottom: "20px" }}>
            <User size={48} style={{ color: "#667eea" }} />
          </div>
          <h1 style={titleStyle}>Sistema de Solicitudes</h1>
          <p style={subtitleStyle}>Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={inputGroupStyle}>
            <Mail size={20} style={iconStyle} />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
              style={inputStyle}
            />
          </div>

          <div style={inputGroupStyle}>
            <Lock size={20} style={iconStyle} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field"
              style={inputStyle}
            />
            <div 
              style={eyeIconStyle}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="login-button"
            style={buttonStyle}
          >
            {loading && <div style={loadingSpinnerStyle}></div>}
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>

          {error && (
            <div style={errorStyle}>
              <AlertCircle size={20} />
              {error}
            </div>
          )}
        </form>

        <div style={{ marginTop: "30px", textAlign: "center", color: "#666" }}>
          <small>
            💡 <strong>Usuarios de prueba:</strong><br />
            Admin: admin@test.com / admin123<br />
            Cliente: cliente1@test.com / cliente123
          </small>
        </div>
      </div>
    </div>
  );
}