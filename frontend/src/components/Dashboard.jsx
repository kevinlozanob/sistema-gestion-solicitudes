import { useState } from "react";
import { LogOut, FileText, Users, BarChart3, Plus, Settings, Search } from "lucide-react";
import SolicitudesList from "./SolicitudesList.jsx";
import SolicitudesConFiltros from "./SolicitudesConFiltros.jsx";
import CrearSolicitud from "./CrearSolicitud.jsx";
import GestionUsuarios from "./GestionUsuarios.jsx";
import ReportesAvanzados from "./ReportesAvanzados.jsx"; 

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("solicitudes");

  const containerStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  const headerStyle = {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 2px 20px rgba(0,0,0,0.1)",
    padding: "15px 0",
    marginBottom: "20px"
  };

  const navStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 20px"
  };

  const userInfoStyle = {
    display: "flex",
    alignItems: "center",
    gap: "15px"
  };

  const roleBadgeStyle = {
    background: user.rol === "ADMIN" ? "#e74c3c" : user.rol === "SOPORTE" ? "#f39c12" : "#27ae60",
    color: "white",
    padding: "4px 12px",
    borderRadius: "15px",
    fontSize: "12px",
    fontWeight: "600"
  };

  const logoutButtonStyle = {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "500",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 10px rgba(102, 126, 234, 0.3)"
  };

  const contentStyle = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 20px 20px"
  };

  const tabsStyle = {
    background: "rgba(255, 255, 255, 0.9)",
    borderRadius: "12px",
    padding: "15px",
    marginBottom: "20px",
    display: "flex",
    gap: "10px",
    boxShadow: "0 2px 15px rgba(0,0,0,0.1)",
    backdropFilter: "blur(10px)",
    flexWrap: "wrap"
  };

  const getTabStyle = (tabName) => ({
    background: activeTab === tabName 
      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
      : "transparent",
    border: "none",
    padding: "12px 20px",
    borderRadius: "8px",
    color: activeTab === tabName ? "white" : "#666",
    cursor: "pointer",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.3s ease"
  });

  const renderTabs = () => {
    const tabs = [];
    
    // Solicitudes - todos los roles
    tabs.push(
      <button 
        key="solicitudes"
        style={getTabStyle("solicitudes")}
        onClick={() => setActiveTab("solicitudes")}
      >
        <FileText size={18} />
        Mis Solicitudes
      </button>
    );

    // Búsqueda avanzada - todos los roles
    tabs.push(
      <button 
        key="buscar"
        style={getTabStyle("buscar")}
        onClick={() => setActiveTab("buscar")}
      >
        <Search size={18} />
        Búsqueda Avanzada
      </button>
    );

    // Crear solicitud - solo cliente
    if (user.rol === "CLIENTE") {
      tabs.push(
        <button 
          key="crear"
          style={getTabStyle("crear")}
          onClick={() => setActiveTab("crear")}
        >
          <Plus size={18} />
          Nueva Solicitud
        </button>
      );
    }

    // Usuarios - solo admin
    if (user.rol === "ADMIN") {
      tabs.push(
        <button 
          key="usuarios"
          style={getTabStyle("usuarios")}
          onClick={() => setActiveTab("usuarios")}
        >
          <Users size={18} />
          Usuarios
        </button>
      );
    }

    // Reportes - solo admin
    if (user.rol === "ADMIN") {
      tabs.push(
        <button 
          key="reportes"
          style={getTabStyle("reportes")}
          onClick={() => setActiveTab("reportes")}
        >
          <BarChart3 size={18} />
          Reportes
        </button>
      );
    }

    return tabs;
  };

  const renderContent = () => {
    switch (activeTab) {
      case "solicitudes":
        return <SolicitudesList user={user} />;
      case "buscar":
        return <SolicitudesConFiltros user={user} />;
      case "crear":
        return <CrearSolicitud user={user} onSuccess={() => setActiveTab("solicitudes")} />;
      case "usuarios":
        return <GestionUsuarios user={user} />;
      case "reportes":
        return <ReportesAvanzados user={user} />; // ✅ USAR EL COMPONENTE
      default:
        return <SolicitudesList user={user} />;
    }
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <nav style={navStyle}>
          <div style={userInfoStyle}>
            <h2 style={{ margin: 0, color: "#333" }}>Sistema de Solicitudes</h2>
            <div style={roleBadgeStyle}>{user.rol}</div>
          </div>
          <div style={userInfoStyle}>
            <span style={{ color: "#666" }}>👋 {user.nombre}</span>
            <button 
              style={logoutButtonStyle}
              onClick={onLogout}
              onMouseOver={(e) => e.target.style.transform = "translateY(-2px)"}
              onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
            >
              <LogOut size={16} />
              Salir
            </button>
          </div>
        </nav>
      </header>

      <main style={contentStyle}>
        <div style={tabsStyle}>
          {renderTabs()}
        </div>
        
        {renderContent()}
      </main>
    </div>
  );
}