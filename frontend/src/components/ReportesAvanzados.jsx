import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, Calendar, TrendingUp, Users, Clock, FileText, Filter, RefreshCw } from 'lucide-react';
import API_URL from '../config.js';


export default function ReportesAvanzados({ user }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({

    fechaInicio: '',
    fechaFin: '',
    granularidad: 'dia'
  });
  const [reportePorFechas, setReportePorFechas] = useState(null);

  // Cargar dashboard al iniciar
  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/reportes/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error cargando dashboard');

      setDashboardData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generarReportePorFechas = async () => {
    if (!filtros.fechaInicio || !filtros.fechaFin) {
      setError('Por favor selecciona ambas fechas');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams(filtros);
      const res = await fetch(`${API_URL}/reportes/fechas?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error generando reporte');

      setReportePorFechas(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams(filtros);
      const res = await fetch(`${API_URL}/reportes/exportar/excel?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Error exportando Excel');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_solicitudes_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  const exportarPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams(filtros);
      const res = await fetch(`${API_URL}/reportes/exportar/pdf?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Error exportando PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_solicitudes_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  // Preparar datos para gráficos
  const prepararDatosEstados = () => {
    if (!dashboardData?.solicitudes_por_estado) return [];

    const colores = {
      ABIERTA: '#e74c3c',
      EN_PROCESO: '#f39c12',
      CERRADA: '#27ae60'
    };

    return Object.entries(dashboardData.solicitudes_por_estado).map(([estado, cantidad]) => ({
      name: estado,
      value: cantidad,
      fill: colores[estado] || '#95a5a6'
    }));
  };

  const prepararDatosTendencia = () => {
    if (!dashboardData?.tendencia_mensual) return [];

    return Object.entries(dashboardData.tendencia_mensual)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, datos]) => ({
        mes,
        total: datos.total,
        abierta: datos.abierta,
        en_proceso: datos.en_proceso,
        cerrada: datos.cerrada
      }));
  };

  if (loading && !dashboardData) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={48} color="#667eea" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '16px', color: '#666' }}>Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '600' }}>
            📊 Reportes Avanzados
          </h1>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
            Análisis completo del sistema de solicitudes
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={exportarExcel}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
          >
            <Download size={18} />
            Excel
          </button>
          <button
            onClick={exportarPDF}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
          >
            <Download size={18} />
            PDF
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#ff6b6b',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <FileText size={20} />
          <span>❌ {error}</span>
          <button
            onClick={() => setError('')}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '20px'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Tarjetas de resumen */}
      {dashboardData && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #3498db'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText size={32} color="#3498db" />
              <div>
                <h3 style={{ margin: 0, color: '#333' }}>Total Solicitudes</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '600', color: '#3498db' }}>
                  {dashboardData.resumen.total_solicitudes}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #f39c12'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <TrendingUp size={32} color="#f39c12" />
              <div>
                <h3 style={{ margin: 0, color: '#333' }}>Últimos 30 días</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '600', color: '#f39c12' }}>
                  {dashboardData.resumen.ultimos_30_dias}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #27ae60'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock size={32} color="#27ae60" />
              <div>
                <h3 style={{ margin: 0, color: '#333' }}>Tiempo Promedio</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '600', color: '#27ae60' }}>
                  {dashboardData.resumen.tiempo_promedio_resolucion}h
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #9b59b6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Users size={32} color="#9b59b6" />
              <div>
                <h3 style={{ margin: 0, color: '#333' }}>Soportes Activos</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '600', color: '#9b59b6' }}>
                  {dashboardData.resumen.total_soportes_activos}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráficos */}
      {dashboardData && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Gráfico de estados */}
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Solicitudes por Estado</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={prepararDatosEstados()}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {prepararDatosEstados().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Rendimiento por soporte */}
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Rendimiento por Soporte</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.rendimiento_soporte}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="soporte" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="solicitudes_atendidas" fill="#667eea" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tendencia mensual */}
      {dashboardData && prepararDatosTendencia().length > 0 && (
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '32px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Tendencia Mensual</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={prepararDatosTendencia()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#667eea" strokeWidth={3} />
              <Line type="monotone" dataKey="abierta" stroke="#e74c3c" />
              <Line type="monotone" dataKey="en_proceso" stroke="#f39c12" />
              <Line type="monotone" dataKey="cerrada" stroke="#27ae60" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filtros para reportes por fechas */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={20} />
          Reporte por Fechas
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr auto',
          gap: '16px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>
              Fecha inicio
            </label>
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>
              Fecha fin
            </label>
            <input
              type="date"
              value={filtros.fechaFin}
              onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>
              Granularidad
            </label>
            <select
              value={filtros.granularidad}
              onChange={(e) => setFiltros({ ...filtros, granularidad: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="dia">Por día</option>
              <option value="mes">Por mes</option>
            </select>
          </div>

          <button
            onClick={generarReportePorFechas}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500'
            }}
          >
            <Calendar size={16} />
            Generar
          </button>
        </div>
      </div>

      {/* Mostrar reporte por fechas */}
      {reportePorFechas && (
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>
            Reporte del {reportePorFechas.rango.inicio} al {reportePorFechas.rango.fin}
          </h3>

          <p style={{ color: '#666', marginBottom: '20px' }}>
            Total de solicitudes en el período: <strong>{reportePorFechas.total_solicitudes}</strong>
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Fecha</th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Total</th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Abierta</th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>En Proceso</th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Cerrada</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(reportePorFechas.datos_agrupados)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([fecha, datos]) => (
                    <tr key={fecha}>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{fecha}</td>
                      <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6', fontWeight: '600' }}>
                        {datos.total}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6', color: '#e74c3c' }}>
                        {datos.abierta}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6', color: '#f39c12' }}>
                        {datos.en_proceso}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6', color: '#27ae60' }}>
                        {datos.cerrada}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}