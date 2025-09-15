import { useState, useEffect } from "react";
import { Search, Filter, Calendar, User, RotateCcw, ChevronDown } from "lucide-react";

export default function FiltrosSolicitudes({ user, onFiltrosChange }) {
  const [filtros, setFiltros] = useState({
    texto: "",
    estado: "",
    clienteId: "",
    soporteId: "",
    fechaInicio: "",
    fechaFin: "",
    orderBy: "createdAt",
    orderDir: "desc"
  });

  const [opciones, setOpciones] = useState({ clientes: [], soportes: [] });
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (user.rol !== 'CLIENTE') {
      fetchOpciones();
    }
  }, [user.rol]);

  const fetchOpciones = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://sistema-gestion-solicitudes-production.up.railway.app/solicitudes/filtros/opciones", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOpciones(data);
      }
    } catch (error) {
      console.error("Error cargando opciones:", error);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    const nuevosFiltros = { ...filtros, [campo]: valor };
    setFiltros(nuevosFiltros);
    onFiltrosChange(nuevosFiltros);
  };

  const limpiarFiltros = () => {
    const filtrosLimpios = {
      texto: "",
      estado: "",
      clienteId: "",
      soporteId: "",
      fechaInicio: "",
      fechaFin: "",
      orderBy: "createdAt",
      orderDir: "desc"
    };
    setFiltros(filtrosLimpios);
    onFiltrosChange(filtrosLimpios);
  };

  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box"
  };

  const selectStyle = {
    ...inputStyle,
    background: "white"
  };

  return (
    <div style={{
      background: "white",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      padding: "20px",
      marginBottom: "20px"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "15px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Filter size={20} color="#667eea" />
          <h3 style={{ margin: 0, color: "#333" }}>Filtros de búsqueda</h3>
        </div>
        <button
          style={{
            background: "none",
            border: "none",
            color: "#667eea",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "14px"
          }}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <ChevronDown size={16} style={{ 
            transform: showAdvanced ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease"
          }} />
          {showAdvanced ? "Menos filtros" : "Más filtros"}
        </button>
      </div>

      {/* Filtros básicos */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr auto",
        gap: "15px",
        alignItems: "end"
      }}>
        {/* Búsqueda por texto */}
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "500", color: "#555" }}>
            <Search size={16} style={{ marginRight: "5px", verticalAlign: "middle" }} />
            Buscar en título o descripción
          </label>
          <input
            type="text"
            placeholder="Ej: problema con login..."
            value={filtros.texto}
            onChange={(e) => handleFiltroChange("texto", e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Estado */}
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "500", color: "#555" }}>
            Estado
          </label>
          <select
            value={filtros.estado}
            onChange={(e) => handleFiltroChange("estado", e.target.value)}
            style={selectStyle}
          >
            <option value="">Todos los estados</option>
            <option value="ABIERTA">Abierta</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="CERRADA">Cerrada</option>
          </select>
        </div>

        {/* Botón limpiar */}
        <button
          onClick={limpiarFiltros}
          style={{
            padding: "8px 15px",
            background: "#f8f9fa",
            border: "1px solid #ddd",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "14px",
            color: "#666"
          }}
        >
          <RotateCcw size={16} />
          Limpiar
        </button>
      </div>

      {/* Filtros avanzados */}
      {showAdvanced && (
        <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #eee" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: user.rol === 'CLIENTE' ? "1fr 1fr 1fr" : "1fr 1fr 1fr 1fr",
            gap: "15px"
          }}>
            {/* Cliente (solo para admin/soporte) */}
            {user.rol !== 'CLIENTE' && (
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500", color: "#555" }}>
                  <User size={16} style={{ marginRight: "5px", verticalAlign: "middle" }} />
                  Cliente
                </label>
                <select
                  value={filtros.clienteId}
                  onChange={(e) => handleFiltroChange("clienteId", e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Todos los clientes</option>
                  {opciones.clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Soporte (solo para admin) */}
            {user.rol === 'ADMIN' && (
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500", color: "#555" }}>
                  Soporte
                </label>
                <select
                  value={filtros.soporteId}
                  onChange={(e) => handleFiltroChange("soporteId", e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Todos los soportes</option>
                  {opciones.soportes.map(soporte => (
                    <option key={soporte.id} value={soporte.id}>
                      {soporte.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Fecha inicio */}
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500", color: "#555" }}>
                <Calendar size={16} style={{ marginRight: "5px", verticalAlign: "middle" }} />
                Fecha desde
              </label>
              <input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => handleFiltroChange("fechaInicio", e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Fecha fin */}
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500", color: "#555" }}>
                Fecha hasta
              </label>
              <input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => handleFiltroChange("fechaFin", e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Ordenamiento */}
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500", color: "#555" }}>
                Ordenar por
              </label>
              <div style={{ display: "flex", gap: "5px" }}>
                <select
                  value={filtros.orderBy}
                  onChange={(e) => handleFiltroChange("orderBy", e.target.value)}
                  style={{ ...selectStyle, flex: 1 }}
                >
                  <option value="createdAt">Fecha creación</option>
                  <option value="updatedAt">Última actualización</option>
                  <option value="titulo">Título</option>
                  <option value="estado">Estado</option>
                </select>
                <select
                  value={filtros.orderDir}
                  onChange={(e) => handleFiltroChange("orderDir", e.target.value)}
                  style={{ ...selectStyle, width: "80px" }}
                >
                  <option value="desc">↓</option>
                  <option value="asc">↑</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}