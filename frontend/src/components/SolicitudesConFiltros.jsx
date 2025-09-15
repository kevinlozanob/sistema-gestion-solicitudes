import { useState, useEffect, useCallback } from "react";
import { Clock, User, AlertCircle, CheckCircle, Play, ChevronLeft, ChevronRight } from "lucide-react";
import FiltrosSolicitudes from "./FiltrosSolicitudes.jsx";

export default function SolicitudesConFiltros({ user }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState({});
  const [filtros, setFiltros] = useState({});
  const [page, setPage] = useState(1);

  const buscarSolicitudes = useCallback(async (filtrosActuales, paginaActual = 1) => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: paginaActual,
        limit: 10,
        ...filtrosActuales
      });

      // Remover parámetros vacíos
      for (const [key, value] of params.entries()) {
        if (!value || value === "") {
          params.delete(key);
        }
      }

      const res = await fetch(`http://localhost:3000/solicitudes/buscar?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error en la búsqueda");

      setSolicitudes(data.solicitudes || []);
      setMeta(data.meta || {});
    } catch (err) {
      setError(err.message);
      setSolicitudes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    buscarSolicitudes(filtros, page);
  }, [filtros, page, buscarSolicitudes]);

  const handleFiltrosChange = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    setPage(1); // Reset página al cambiar filtros
  };

  const handlePageChange = (nuevaPagina) => {
    setPage(nuevaPagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const renderPaginacion = () => {
    if (!meta.totalPages || meta.totalPages <= 1) return null;

    const pages = [];
    const maxPages = 5;
    let startPage = Math.max(1, page - Math.floor(maxPages / 2));
    let endPage = Math.min(meta.totalPages, startPage + maxPages - 1);

    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px",
        marginTop: "20px",
        padding: "20px"
      }}>
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={!meta.hasPrev}
          style={{
            padding: "8px 12px",
            border: "1px solid #ddd",
            borderRadius: "6px",
            background: meta.hasPrev ? "white" : "#f5f5f5",
            cursor: meta.hasPrev ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: "5px"
          }}
        >
          <ChevronLeft size={16} />
          Anterior
        </button>

        {pages.map(pageNum => (
          <button
            key={pageNum}
            onClick={() => handlePageChange(pageNum)}
            style={{
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              background: pageNum === page ? "#667eea" : "white",
              color: pageNum === page ? "white" : "#333",
              cursor: "pointer",
              fontWeight: pageNum === page ? "600" : "normal"
            }}
          >
            {pageNum}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={!meta.hasNext}
          style={{
            padding: "8px 12px",
            border: "1px solid #ddd",
            borderRadius: "6px",
            background: meta.hasNext ? "white" : "#f5f5f5",
            cursor: meta.hasNext ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: "5px"
          }}
        >
          Siguiente
          <ChevronRight size={16} />
        </button>

        <span style={{ marginLeft: "15px", color: "#666", fontSize: "14px" }}>
          Página {page} de {meta.totalPages} ({meta.total} resultados)
        </span>
      </div>
    );
  };

  return (
    <div>
      <FiltrosSolicitudes user={user} onFiltrosChange={handleFiltrosChange} />

      {loading && (
        <div style={{
          textAlign: "center",
          padding: "40px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <div style={{ fontSize: "18px", color: "#666" }}>Buscando solicitudes...</div>
        </div>
      )}

      {error && (
        <div style={{
          background: "#ff6b6b",
          color: "white",
          padding: "15px",
          borderRadius: "8px",
          textAlign: "center",
          marginBottom: "20px"
        }}>
          ❌ {error}
        </div>
      )}

      {!loading && !error && solicitudes.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "50px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <div style={{ fontSize: "18px", color: "#666", marginBottom: "10px" }}>
            📋 No se encontraron solicitudes
          </div>
          <small style={{ color: "#999" }}>
            Intenta ajustar los filtros de búsqueda
          </small>
        </div>
      )}

      {!loading && solicitudes.length > 0 && (
        <div style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          overflow: "hidden"
        }}>
          <div style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <User size={24} />
              <h3 style={{ margin: 0 }}>Resultados de búsqueda</h3>
            </div>
            <div style={{ fontSize: "14px", opacity: 0.9 }}>
              {meta.total} solicitudes encontradas
            </div>
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
                  onMouseOver={(e) => e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.1)"}
                  onMouseOut={(e) => e.currentTarget.style.boxShadow = "none"}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "10px"
                  }}>
                    <div>
                      <h4 style={{ margin: "0 0 5px 0", color: "#333" }}>
                        #{s.id} - {s.titulo}
                      </h4>
                      <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                        {s.descripcion}
                      </p>
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

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    fontSize: "12px",
                    color: "#999"
                  }}>
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
                      <strong style={{ color: "#667eea", fontSize: "12px" }}>
                        RESPUESTA:
                      </strong>
                      <p style={{ margin: "5px 0 0 0", fontSize: "14px", color: "#555" }}>
                        {s.respuesta}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {renderPaginacion()}
          </div>
        </div>
      )}
    </div>
  );
}