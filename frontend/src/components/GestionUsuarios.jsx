import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Edit2, Trash2, Search, Filter, UserPlus, Shield, User as UserIcon } from "lucide-react";
import ModalUsuario from "./ModalUsuario.jsx";

export default function GestionUsuarios({ user }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filtros, setFiltros] = useState({
    search: "",
    rol: "",
    page: 1
  });
  const [meta, setMeta] = useState({});
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null);

  // ✅ SOLUCIÓN: useCallback para cargarUsuarios
  const cargarUsuarios = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: filtros.page,
        limit: 10,
        ...(filtros.search && { search: filtros.search }),
        ...(filtros.rol && { rol: filtros.rol })
      });

      const res = await fetch(`http://localhost:3000/usuarios?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error cargando usuarios");

      setUsuarios(data.usuarios || []);
      setMeta(data.meta || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filtros]); // ✅ filtros como dependencia

  // ✅ AHORA useEffect funciona correctamente
  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const handleEliminar = async (usuarioId) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/usuarios/${usuarioId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Mostrar mensaje de éxito
      alert("Usuario eliminado exitosamente");
      cargarUsuarios();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCrearSuccess = () => {
    cargarUsuarios();
    setShowCrearModal(false);
  };

  const handleEditarSuccess = () => {
    cargarUsuarios();
    setShowEditModal(false);
    setUsuarioEditar(null);
  };

  const getRolColor = (rol) => {
    switch (rol) {
      case 'ADMIN': return '#e74c3c';
      case 'SOPORTE': return '#f39c12';
      case 'CLIENTE': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const getRolIcon = (rol) => {
    switch (rol) {
      case 'ADMIN': return <Shield size={16} />;
      case 'SOPORTE': return <UserPlus size={16} />;
      case 'CLIENTE': return <UserIcon size={16} />;
      default: return <UserIcon size={16} />;
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "No disponible";
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return "Fecha inválida";
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginBottom: "20px"
      }}>
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "20px",
          borderRadius: "12px 12px 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Users size={24} />
            <h2 style={{ margin: 0 }}>Gestión de Usuarios</h2>
            {meta.total > 0 && (
              <span style={{
                background: "rgba(255,255,255,0.2)",
                padding: "4px 8px",
                borderRadius: "12px",
                fontSize: "12px"
              }}>
                {meta.total} total
              </span>
            )}
          </div>
          <button
            onClick={() => setShowCrearModal(true)}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "white",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "600",
              transition: "all 0.3s ease"
            }}
            onMouseOver={(e) => e.target.style.background = "rgba(255,255,255,0.3)"}
            onMouseOut={(e) => e.target.style.background = "rgba(255,255,255,0.2)"}
          >
            <Plus size={18} />
            Nuevo Usuario
          </button>
        </div>

        {/* Filtros */}
        <div style={{ padding: "20px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr auto",
            gap: "15px",
            alignItems: "end"
          }}>
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "5px", 
                fontWeight: "500", 
                color: "#555" 
              }}>
                <Search size={16} style={{ marginRight: "5px", verticalAlign: "middle" }} />
                Buscar usuario
              </label>
              <input
                type="text"
                placeholder="Nombre o email..."
                value={filtros.search}
                onChange={(e) => setFiltros({...filtros, search: e.target.value, page: 1})}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  fontSize: "14px",
                  transition: "border-color 0.3s ease"
                }}
                onFocus={(e) => e.target.style.borderColor = "#667eea"}
                onBlur={(e) => e.target.style.borderColor = "#ddd"}
              />
            </div>
            
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "5px", 
                fontWeight: "500", 
                color: "#555" 
              }}>
                Rol
              </label>
              <select
                value={filtros.rol}
                onChange={(e) => setFiltros({...filtros, rol: e.target.value, page: 1})}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  fontSize: "14px",
                  background: "white",
                  cursor: "pointer"
                }}
              >
                <option value="">Todos los roles</option>
                <option value="ADMIN">Admin</option>
                <option value="SOPORTE">Soporte</option>
                <option value="CLIENTE">Cliente</option>
              </select>
            </div>

            <button
              onClick={() => setFiltros({ search: "", rol: "", page: 1 })}
              style={{
                padding: "10px 15px",
                background: "#f8f9fa",
                border: "1px solid #ddd",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "14px",
                color: "#666",
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => {
                e.target.style.background = "#e9ecef";
                e.target.style.borderColor = "#adb5bd";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "#f8f9fa";
                e.target.style.borderColor = "#ddd";
              }}
            >
              <Filter size={16} />
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "#ff6b6b",
          color: "white",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}>
          <UserIcon size={20} />
          <span>❌ {error}</span>
          <button
            onClick={() => setError("")}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontSize: "18px"
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          textAlign: "center",
          padding: "40px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <div style={{
            display: "inline-block",
            width: "40px",
            height: "40px",
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #667eea",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginBottom: "15px"
          }}></div>
          <div style={{ fontSize: "18px", color: "#666" }}>Cargando usuarios...</div>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Lista de usuarios */}
      {!loading && usuarios.length > 0 && (
        <div style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          overflow: "hidden"
        }}>
          <div style={{ padding: "20px" }}>
            <div style={{ display: "grid", gap: "15px" }}>
              {usuarios.map((usuario) => (
                <div
                  key={usuario.id}
                  style={{
                    border: "1px solid #e1e5e9",
                    borderRadius: "8px",
                    padding: "20px",
                    transition: "all 0.3s ease",
                    position: "relative"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.1)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Badge especial para usuario actual */}
                  {usuario.id === user.id && (
                    <div style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      background: "#667eea",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "10px",
                      fontWeight: "600"
                    }}>
                      TÚ
                    </div>
                  )}

                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start"
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "15px",
                        marginBottom: "10px"
                      }}>
                        <h3 style={{ margin: 0, color: "#333", fontSize: "18px" }}>
                          {usuario.nombre}
                        </h3>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          background: getRolColor(usuario.rol) + "15",
                          color: getRolColor(usuario.rol),
                          padding: "5px 10px",
                          borderRadius: "15px",
                          fontSize: "12px",
                          fontWeight: "600"
                        }}>
                          {getRolIcon(usuario.rol)}
                          {usuario.rol}
                        </div>
                      </div>
                      
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                        fontSize: "14px",
                        color: "#666"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          📧 {usuario.email}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          📅 Creado: {formatearFecha(usuario.createdAt)}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          🆔 ID: #{usuario.id}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          🔄 Modificado: {formatearFecha(usuario.updatedAt)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        onClick={() => {
                          setUsuarioEditar(usuario);
                          setShowEditModal(true);
                        }}
                        style={{
                          background: "#3498db",
                          color: "white",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "12px",
                          fontWeight: "500",
                          transition: "all 0.3s ease"
                        }}
                        onMouseOver={(e) => e.target.style.background = "#2980b9"}
                        onMouseOut={(e) => e.target.style.background = "#3498db"}
                      >
                        <Edit2 size={14} />
                        {usuario.id === user.id ? "Mi Perfil" : "Editar"}
                      </button>
                      
                      <button
                        onClick={() => handleEliminar(usuario.id)}
                        disabled={usuario.id === user.id}
                        style={{
                          background: usuario.id === user.id ? "#ccc" : "#e74c3c",
                          color: "white",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          cursor: usuario.id === user.id ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "12px",
                          fontWeight: "500",
                          transition: "all 0.3s ease"
                        }}
                        onMouseOver={(e) => {
                          if (usuario.id !== user.id) {
                            e.target.style.background = "#c0392b";
                          }
                        }}
                        onMouseOut={(e) => {
                          if (usuario.id !== user.id) {
                            e.target.style.background = "#e74c3c";
                          }
                        }}
                        title={usuario.id === user.id ? "No puedes eliminar tu propia cuenta" : "Eliminar usuario"}
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {meta.totalPages > 1 && (
              <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px",
                marginTop: "30px",
                padding: "20px"
              }}>
                <button
                  onClick={() => setFiltros({...filtros, page: filtros.page - 1})}
                  disabled={!meta.hasPrev}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    background: meta.hasPrev ? "white" : "#f5f5f5",
                    cursor: meta.hasPrev ? "pointer" : "not-allowed",
                    color: meta.hasPrev ? "#333" : "#999",
                    transition: "all 0.3s ease"
                  }}
                >
                  ← Anterior
                </button>
                
                <span style={{ 
                  color: "#666", 
                  fontSize: "14px",
                  background: "#f8f9fa",
                  padding: "8px 15px",
                  borderRadius: "6px"
                }}>
                  Página {filtros.page} de {meta.totalPages} • {meta.total} usuarios
                </span>
                
                <button
                  onClick={() => setFiltros({...filtros, page: filtros.page + 1})}
                  disabled={!meta.hasNext}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    background: meta.hasNext ? "white" : "#f5f5f5",
                    cursor: meta.hasNext ? "pointer" : "not-allowed",
                    color: meta.hasNext ? "#333" : "#999",
                    transition: "all 0.3s ease"
                  }}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sin usuarios */}
      {!loading && usuarios.length === 0 && !error && (
        <div style={{
          textAlign: "center",
          padding: "50px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <Users size={64} color="#ccc" style={{ marginBottom: "20px" }} />
          <h3 style={{ color: "#666", margin: "0 0 10px 0" }}>No hay usuarios</h3>
          <p style={{ color: "#999", margin: "0 0 20px 0" }}>
            {filtros.search || filtros.rol 
              ? "No se encontraron usuarios con los filtros aplicados" 
              : "Aún no hay usuarios registrados en el sistema"
            }
          </p>
          {filtros.search || filtros.rol ? (
            <button
              onClick={() => setFiltros({ search: "", rol: "", page: 1 })}
              style={{
                background: "#667eea",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              Limpiar filtros
            </button>
          ) : (
            <button
              onClick={() => setShowCrearModal(true)}
              style={{
                background: "#667eea",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                margin: "0 auto"
              }}
            >
              <Plus size={16} />
              Crear primer usuario
            </button>
          )}
        </div>
      )}

      {/* Modales */}
      <ModalUsuario
        isOpen={showCrearModal}
        onClose={() => setShowCrearModal(false)}
        onSuccess={handleCrearSuccess}
        currentUser={user}
      />

      <ModalUsuario
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setUsuarioEditar(null);
        }}
        usuario={usuarioEditar}
        onSuccess={handleEditarSuccess}
        currentUser={user}
      />
    </div>
  );
}