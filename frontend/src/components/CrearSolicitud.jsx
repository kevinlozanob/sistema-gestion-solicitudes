import { useState } from "react";
import { Send, FileText, MessageSquare } from "lucide-react";

export default function CrearSolicitud({ onSuccess }) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSuccess(false);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://${API_URL}/solicitudes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ titulo, descripcion }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear solicitud");

      setSuccess(true);
      setTitulo("");
      setDescripcion("");
      
      setTimeout(() => {
        onSuccess();
      }, 2000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        padding: "40px",
        textAlign: "center"
      }}>
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>✅</div>
        <h3 style={{ color: "#27ae60", marginBottom: "10px" }}>¡Solicitud creada exitosamente!</h3>
        <p style={{ color: "#666" }}>Serás redirigido a la lista de solicitudes...</p>
      </div>
    );
  }

  return (
    <div style={{
      background: "white",
      borderRadius: "12px",
      boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
      overflow: "hidden"
    }}>
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        gap: "10px"
      }}>
        <FileText size={24} />
        <h3 style={{ margin: 0 }}>Nueva Solicitud de Soporte</h3>
      </div>

      <div style={{ padding: "30px" }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#333"
            }}>
              Título de la solicitud
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Problema con el sistema de pagos"
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e1e5e9",
                borderRadius: "8px",
                fontSize: "16px",
                transition: "border-color 0.3s ease",
                boxSizing: "border-box"
              }}
              onFocus={(e) => e.target.style.borderColor = "#667eea"}
              onBlur={(e) => e.target.style.borderColor = "#e1e5e9"}
            />
            <small style={{ color: "#666", fontSize: "12px" }}>
              Entre 5 y 100 caracteres
            </small>
          </div>

          <div style={{ marginBottom: "30px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#333"
            }}>
              Descripción detallada
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe detalladamente el problema que estás experimentando..."
              required
              rows="5"
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e1e5e9",
                borderRadius: "8px",
                fontSize: "16px",
                transition: "border-color 0.3s ease",
                resize: "vertical",
                boxSizing: "border-box"
              }}
              onFocus={(e) => e.target.style.borderColor = "#667eea"}
              onBlur={(e) => e.target.style.borderColor = "#e1e5e9"}
            />
            <small style={{ color: "#666", fontSize: "12px" }}>
              Entre 10 y 500 caracteres ({descripcion.length}/500)
            </small>
          </div>

          {error && (
            <div style={{
              background: "#ff6b6b",
              color: "white",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <MessageSquare size={16} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              background: loading 
                ? "linear-gradient(135deg, #ccc 0%, #999 100%)"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.3s ease"
            }}
            onMouseOver={(e) => !loading && (e.target.style.transform = "translateY(-2px)")}
            onMouseOut={(e) => !loading && (e.target.style.transform = "translateY(0)")}
          >
            <Send size={18} />
            {loading ? "Creando solicitud..." : "Crear Solicitud"}
          </button>
        </form>
      </div>
    </div>
  );
}