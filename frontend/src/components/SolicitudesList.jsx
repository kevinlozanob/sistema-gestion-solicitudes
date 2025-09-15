import { useEffect, useState } from "react";
import { Clock, User, AlertCircle, CheckCircle, Play } from "lucide-react";

export default function SolicitudesList({ user }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSolicitudes = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3000/solicitudes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al cargar solicitudes");
        setSolicitudes(data.solicitudes);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSolicitudes();
  }, []);

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case "ABIERTA": return <AlertCircle size={16} color="#e74c3c" />;
      case "EN_PROCESO": return <Play size={16} color="#f39c12" />;
      case "CERRADA": return <CheckCircle size={16} color="#27ae60" />;
      default: return <Clock size={16} />;
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "ABIERTA": return "#e74c3c";
      case "EN_PROCESO": return "#f39c12";
      case "CERRADA": return "#27ae60";
      default: return "#95a5a6";
    }
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <div style={{ fontSize: "18px", color: "#666" }}>Cargando solicitudes...</div>
    </div>
  );

  if (error) return (
    <div style={{ 
      background: "#ff6b6b", 
      color: "white", 
      padding: "15px", 
      borderRadius: "8px",
      textAlign: "center"
    }}>
      ❌ {error}
    </div>
  );

  if (!solicitudes.length) return (
    <div style={{ 
      textAlign: "center", 
      padding: "50px",
      background: "white",
      borderRadius: "12px",
      boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
    }}>
      <div style={{ fontSize: "18px", color: "#666", marginBottom: "10px" }}>
        📋 No hay solicitudes para mostrar
      </div>
      <small style={{ color: "#999" }}>
        {user.rol === "CLIENTE" ? "Crea tu primera solicitud" : "No tienes solicitudes asignadas"}
      </small>
    </div>
  );

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
        <User size={24} />
        <h3 style={{ margin: 0 }}>
          Mis Solicitudes ({solicitudes.length}) - {user.rol}
        </h3>
      </div>

      <div style={{ padding: "20px" }}>
        <div style={{ display: "grid", gap: "15px" }}>
          {solicitudes.map((s) => (
            <div
              key={s.id}
              style={{
                border: "1px solid #e1e5e9",
                borderRadius: "8px",
                padding: "15px",
                transition: "all 0.3s ease",
                cursor: "pointer"
              }}
              onMouseOver={(e) => e.target.style.boxShadow = "0 4px 15px rgba(0,0,0,0.1)"}
              onMouseOut={(e) => e.target.style.boxShadow = "none"}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div>
                  <h4 style={{ margin: "0 0 5px 0", color: "#333" }}>#{s.id} - {s.titulo}</h4>
                  <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>{s.descripcion}</p>
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  background: getEstadoColor(s.estado) + "15",
                  color: getEstadoColor(s.estado),
                  padding: "5px 10px",
                  borderRadius: "15px",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  {getEstadoIcon(s.estado)}
                  {s.estado}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px", color: "#999" }}>
                <div>👤 Cliente: {s.cliente?.nombre || "N/A"}</div>
                <div>🛠️ Soporte: {s.soporte?.nombre || "Sin asignar"}</div>
                <div>📅 Creado: {s.createdAt}</div>
                <div>🔄 Actualizado: {s.updatedAt}</div>
              </div>

              {s.respuesta && (
                <div style={{
                  marginTop: "10px",
                  background: "#f8f9fa",
                  padding: "10px",
                  borderRadius: "6px",
                  borderLeft: "3px solid #667eea"
                }}>
                  <strong style={{ color: "#667eea", fontSize: "12px" }}>RESPUESTA:</strong>
                  <p style={{ margin: "5px 0 0 0", fontSize: "14px", color: "#555" }}>{s.respuesta}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}