import { useState } from "react";
import { X, User, Mail, Lock, Shield, Save } from "lucide-react";
import API_URL from '../config.js';

export default function ModalUsuario({
  isOpen,
  onClose,
  usuario = null,
  onSuccess,
  currentUser
}) {
  const [formData, setFormData] = useState({
    nombre: usuario?.nombre || "",
    email: usuario?.email || "",
    password: "",
    rol: usuario?.rol || "CLIENTE"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!usuario;
  const isOwnProfile = usuario && currentUser.id === usuario.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // Preparar datos (solo incluir campos que han cambiado)
      const dataToSend = {};

      if (formData.nombre !== (usuario?.nombre || "")) {
        dataToSend.nombre = formData.nombre;
      }
      if (formData.email !== (usuario?.email || "")) {
        dataToSend.email = formData.email;
      }
      if (formData.password) {
        dataToSend.password = formData.password;
      }
      if (formData.rol !== (usuario?.rol || "CLIENTE") && currentUser.rol === "ADMIN") {
        dataToSend.rol = formData.rol;
      }

      const url = isEditing
        ? `${API_URL}/usuarios/${usuario.id}`
        : `${API_URL}/usuarios`;

      const method = isEditing ? "PUT" : "POST";

      // Para crear usuario, enviar todos los datos
      const bodyData = isEditing ? dataToSend : formData;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar usuario");

      onSuccess();
      onClose();

      // Reset form
      setFormData({
        nombre: "",
        email: "",
        password: "",
        rol: "CLIENTE"
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000
    }}>
      <div style={{
        background: "white",
        borderRadius: "12px",
        width: "90%",
        maxWidth: "500px",
        maxHeight: "90vh",
        overflow: "hidden",
        boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <User size={24} />
            <h3 style={{ margin: 0 }}>
              {isEditing ? "Editar Usuario" : "Crear Usuario"}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              padding: "5px"
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "30px", maxHeight: "calc(90vh - 140px)", overflowY: "auto" }}>
          <form onSubmit={handleSubmit}>
            {/* Nombre */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#333"
              }}>
                <User size={16} />
                Nombre completo
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                placeholder="Ej: Juan Pérez"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #e1e5e9",
                  borderRadius: "8px",
                  fontSize: "16px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* Email */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#333"
              }}>
                <Mail size={16} />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Ej: juan@empresa.com"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #e1e5e9",
                  borderRadius: "8px",
                  fontSize: "16px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* Contraseña */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#333"
              }}>
                <Lock size={16} />
                Contraseña {isEditing && "(dejar vacío para no cambiar)"}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder={isEditing ? "Nueva contraseña (opcional)" : "Mínimo 6 caracteres"}
                required={!isEditing}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #e1e5e9",
                  borderRadius: "8px",
                  fontSize: "16px",
                  boxSizing: "border-box"
                }}
              />
              <small style={{ color: "#666", fontSize: "12px", marginTop: "4px", display: "block" }}>
                Debe contener al menos 6 caracteres con letras y números
              </small>
            </div>

            {/* Rol - Solo admin puede cambiar roles */}
            {(currentUser.rol === "ADMIN" || !isEditing) && (
              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#333"
                }}>
                  <Shield size={16} />
                  Rol del usuario
                </label>
                <select
                  value={formData.rol}
                  onChange={(e) => handleChange("rol", e.target.value)}
                  disabled={isOwnProfile} // No puede cambiar su propio rol
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #e1e5e9",
                    borderRadius: "8px",
                    fontSize: "16px",
                    background: isOwnProfile ? "#f5f5f5" : "white",
                    cursor: isOwnProfile ? "not-allowed" : "pointer"
                  }}
                >
                  <option value="CLIENTE">Cliente</option>
                  <option value="SOPORTE">Soporte</option>
                  <option value="ADMIN">Administrador</option>
                </select>
                {isOwnProfile && (
                  <small style={{ color: "#666", fontSize: "12px", marginTop: "4px", display: "block" }}>
                    No puedes cambiar tu propio rol
                  </small>
                )}
              </div>
            )}

            {/* Error */}
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
                <X size={16} />
                {error}
              </div>
            )}

            {/* Botones */}
            <div style={{
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end",
              marginTop: "30px"
            }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "12px 20px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  background: "white",
                  color: "#666",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "12px 20px",
                  border: "none",
                  borderRadius: "8px",
                  background: loading
                    ? "linear-gradient(135deg, #ccc 0%, #999 100%)"
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <Save size={16} />
                {loading ? "Guardando..." : (isEditing ? "Actualizar" : "Crear Usuario")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}