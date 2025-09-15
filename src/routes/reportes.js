const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

router.get('/dashboard', auth(['ADMIN']), async (req, res) => {
  try {
    console.log('📊 Generando dashboard avanzado...');

    const fechaActual = new Date();
    const hace30Dias = new Date(fechaActual.getTime() - 30 * 24 * 60 * 60 * 1000);
    const hace7Dias = new Date(fechaActual.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalSolicitudes,
      solicitudesPorEstado,
      solicitudesUltimos30Dias,
      solicitudesUltimos7Dias,
      rendimientoSoporte,
      tiemposResolucion,
      tendenciaMensual
    ] = await Promise.all([
      // Total general
      prisma.solicitud.count(),

      // Por estado
      prisma.solicitud.groupBy({
        by: ['estado'],
        _count: { estado: true }
      }),

      // Últimos 30 días
      prisma.solicitud.count({
        where: { createdAt: { gte: hace30Dias } }
      }),

      // Últimos 7 días
      prisma.solicitud.count({
        where: { createdAt: { gte: hace7Dias } }
      }),

      // Rendimiento por soporte
      prisma.solicitud.groupBy({
        by: ['soporteId'],
        where: { 
          soporteId: { not: null },
          createdAt: { gte: hace30Dias }
        },
        _count: { soporteId: true }
      }),

      // Tiempos de resolución
      prisma.solicitud.findMany({
        where: { 
          estado: 'CERRADA',
          createdAt: { gte: hace30Dias }
        },
        select: { createdAt: true, updatedAt: true }
      }),

      // Tendencia mensual (últimos 6 meses)
      prisma.solicitud.findMany({
        where: {
          createdAt: { 
            gte: new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 6, 1) 
          }
        },
        select: { createdAt: true, estado: true }
      })
    ]);

    // Procesar datos de soporte
    const idsSoporte = rendimientoSoporte.map(r => r.soporteId);
    const soportes = await prisma.user.findMany({
      where: { id: { in: idsSoporte } },
      select: { id: true, nombre: true }
    });

    const rendimientoConNombres = rendimientoSoporte.map(r => {
      const soporte = soportes.find(s => s.id === r.soporteId);
      return {
        soporte: soporte?.nombre || 'Sin nombre',
        solicitudes_atendidas: r._count.soporteId
      };
    }).sort((a, b) => b.solicitudes_atendidas - a.solicitudes_atendidas);

    // Calcular tiempo promedio de resolución en horas
    const tiemposHoras = tiemposResolucion.map(s => {
      const inicio = new Date(s.createdAt);
      const fin = new Date(s.updatedAt);
      return (fin - inicio) / (1000 * 60 * 60);
    });

    const tiempoPromedio = tiemposHoras.length > 0 
      ? tiemposHoras.reduce((a, b) => a + b) / tiemposHoras.length 
      : 0;

    // Tendencia mensual
    const tendenciaPorMes = {};
    tendenciaMensual.forEach(s => {
      const fecha = new Date(s.createdAt);
      const mesAno = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      if (!tendenciaPorMes[mesAno]) {
        tendenciaPorMes[mesAno] = { total: 0, abierta: 0, en_proceso: 0, cerrada: 0 };
      }
      tendenciaPorMes[mesAno].total++;
      tendenciaPorMes[mesAno][s.estado.toLowerCase()]++;
    });

    // Estados
    const estadosObj = {};
    solicitudesPorEstado.forEach(item => {
      estadosObj[item.estado] = item._count.estado;
    });

    console.log('Dashboard generadp');

    res.json({
      resumen: {
        total_solicitudes: totalSolicitudes,
        ultimos_30_dias: solicitudesUltimos30Dias,
        ultimos_7_dias: solicitudesUltimos7Dias,
        tiempo_promedio_resolucion: Math.round(tiempoPromedio * 100) / 100,
        total_soportes_activos: soportes.length
      },
      solicitudes_por_estado: estadosObj,
      rendimiento_soporte: rendimientoConNombres,
      tendencia_mensual: tendenciaPorMes,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generando dashboard:', error);
    res.status(500).json({ error: 'Error generando dashboard: ' + error.message });
  }
});

// ✅ FECHAS: Reporte por rango de fechas
router.get('/fechas', auth(['ADMIN']), async (req, res) => {
  try {
    const { fechaInicio, fechaFin, granularidad = 'dia' } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'fechaInicio y fechaFin son obligatorios' });
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);

    console.log('📅 Generando reporte por fechas:', { inicio, fin, granularidad });

    const solicitudes = await prisma.solicitud.findMany({
      where: {
        createdAt: { gte: inicio, lte: fin }
      },
      include: {
        cliente: { select: { nombre: true, email: true } },
        soporte: { select: { nombre: true, email: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Agrupar por granularidad
    const agrupadas = {};
    const formatoFecha = granularidad === 'mes' 
      ? (fecha) => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      : (fecha) => fecha.toISOString().split('T')[0];

    solicitudes.forEach(s => {
      const clave = formatoFecha(new Date(s.createdAt));
      if (!agrupadas[clave]) {
        agrupadas[clave] = { total: 0, abierta: 0, en_proceso: 0, cerrada: 0, detalles: [] };
      }
      agrupadas[clave].total++;
      agrupadas[clave][s.estado.toLowerCase()]++;
      agrupadas[clave].detalles.push({
        id: s.id,
        titulo: s.titulo,
        cliente: s.cliente?.nombre,
        soporte: s.soporte?.nombre,
        estado: s.estado
      });
    });

    res.json({
      rango: { inicio: fechaInicio, fin: fechaFin },
      granularidad,
      total_solicitudes: solicitudes.length,
      datos_agrupados: agrupadas,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en reporte por fechas:', error);
    res.status(500).json({ error: 'Error generando reporte: ' + error.message });
  }
});

// ✅ SOPORTE: Rendimiento individual por soporte
router.get('/soporte/:id', auth(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { fechaInicio, fechaFin } = req.query;
    const soporteId = parseInt(id);

    console.log('👤 Generando reporte de soporte:', soporteId);

    // Verificar que el soporte existe
    const soporte = await prisma.user.findUnique({
      where: { id: soporteId, rol: 'SOPORTE' },
      select: { id: true, nombre: true, email: true, createdAt: true }
    });

    if (!soporte) {
      return res.status(404).json({ error: 'Soporte no encontrado' });
    }

    // Filtros de fecha
    let whereClause = { soporteId };
    if (fechaInicio && fechaFin) {
      whereClause.createdAt = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin + 'T23:59:59.999Z')
      };
    }

    const [
      solicitudesAsignadas,
      solicitudesCerradas,
      ultimaActividad
    ] = await Promise.all([
      // Todas las solicitudes asignadas
      prisma.solicitud.findMany({
        where: whereClause,
        include: { cliente: { select: { nombre: true } } },
        orderBy: { createdAt: 'desc' }
      }),

      // Solicitudes cerradas para calcular tiempo promedio
      prisma.solicitud.findMany({
        where: { ...whereClause, estado: 'CERRADA' },
        select: { createdAt: true, updatedAt: true }
      }),

      // Última actividad
      prisma.solicitud.findFirst({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
      })
    ]);

    // Calcular métricas
    const totalAsignadas = solicitudesAsignadas.length;
    const totalCerradas = solicitudesCerradas.length;
    const tasaResolucion = totalAsignadas > 0 ? (totalCerradas / totalAsignadas) * 100 : 0;

    // Tiempo promedio de resolución
    const tiemposResolucion = solicitudesCerradas.map(s => {
      const inicio = new Date(s.createdAt);
      const fin = new Date(s.updatedAt);
      return (fin - inicio) / (1000 * 60 * 60); // horas
    });

    const tiempoPromedioHoras = tiemposResolucion.length > 0
      ? tiemposResolucion.reduce((a, b) => a + b) / tiemposResolucion.length
      : 0;

    // Solicitudes por estado
    const porEstado = solicitudesAsignadas.reduce((acc, s) => {
      acc[s.estado] = (acc[s.estado] || 0) + 1;
      return acc;
    }, {});

    res.json({
      soporte: {
        id: soporte.id,
        nombre: soporte.nombre,
        email: soporte.email,
        fecha_ingreso: soporte.createdAt
      },
      metricas: {
        solicitudes_asignadas: totalAsignadas,
        solicitudes_cerradas: totalCerradas,
        tasa_resolucion: Math.round(tasaResolucion * 100) / 100,
        tiempo_promedio_resolucion: Math.round(tiempoPromedioHoras * 100) / 100,
        ultima_actividad: ultimaActividad?.updatedAt
      },
      solicitudes_por_estado: porEstado,
      solicitudes_detalle: solicitudesAsignadas.slice(0, 10), // Últimas 10
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en reporte de soporte:', error);
    res.status(500).json({ error: 'Error generando reporte: ' + error.message });
  }
});

// ✅ EXPORTAR: Exportar reportes a Excel
router.get('/exportar/excel', auth(['ADMIN']), async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    console.log('Exportando reporte a Excel...');

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Gestión de Solicitudes';
    workbook.created = new Date();

    // Hoja 1: Resumen general
    const resumenSheet = workbook.addWorksheet('Resumen General');
    
    // Configurar columnas
    resumenSheet.columns = [
      { header: 'Métrica', key: 'metrica', width: 30 },
      { header: 'Valor', key: 'valor', width: 20 }
    ];

    // Obtener datos
    const totalSolicitudes = await prisma.solicitud.count();
    const solicitudesPorEstado = await prisma.solicitud.groupBy({
      by: ['estado'],
      _count: { estado: true }
    });

    // Agregar datos al resumen
    resumenSheet.addRow({ metrica: 'Total de Solicitudes', valor: totalSolicitudes });
    solicitudesPorEstado.forEach(item => {
      resumenSheet.addRow({ 
        metrica: `Solicitudes ${item.estado}`, 
        valor: item._count.estado 
      });
    });

    // Hoja 2: Solicitudes detalladas
    const solicitudesSheet = workbook.addWorksheet('Solicitudes');
    
    let whereClause = {};
    if (fechaInicio && fechaFin) {
      whereClause.createdAt = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin + 'T23:59:59.999Z')
      };
    }

    const solicitudes = await prisma.solicitud.findMany({
      where: whereClause,
      include: {
        cliente: { select: { nombre: true, email: true } },
        soporte: { select: { nombre: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Configurar columnas para solicitudes
    solicitudesSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Título', key: 'titulo', width: 30 },
      { header: 'Cliente', key: 'cliente', width: 25 },
      { header: 'Soporte', key: 'soporte', width: 25 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Fecha Creación', key: 'createdAt', width: 20 },
      { header: 'Última Actualización', key: 'updatedAt', width: 20 }
    ];

    // Agregar solicitudes
    solicitudes.forEach(s => {
      solicitudesSheet.addRow({
        id: s.id,
        titulo: s.titulo,
        cliente: s.cliente?.nombre || 'N/A',
        soporte: s.soporte?.nombre || 'Sin asignar',
        estado: s.estado,
        createdAt: new Date(s.createdAt).toLocaleDateString('es-ES'),
        updatedAt: new Date(s.updatedAt).toLocaleDateString('es-ES')
      });
    });

    // Aplicar estilos
    [resumenSheet, solicitudesSheet].forEach(sheet => {
      sheet.getRow(1).eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      });
    });

    // Configurar respuesta
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_solicitudes_${new Date().toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

    console.log('✅ Reporte Excel generado exitosamente');

  } catch (error) {
    console.error('Error exportando a Excel:', error);
    res.status(500).json({ error: 'Error exportando a Excel: ' + error.message });
  }
});


router.get('/exportar/pdf', auth(['ADMIN']), async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    console.log('Exportando reporte a PDF...');

    // Crear documento PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Configurar respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_solicitudes_${new Date().toISOString().split('T')[0]}.pdf`);
    
    doc.pipe(res);

    // Título
    doc.fontSize(20).font('Helvetica-Bold');
    doc.text('REPORTE DE SOLICITUDES', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).font('Helvetica');
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });
    
    if (fechaInicio && fechaFin) {
      doc.text(`Período: ${fechaInicio} - ${fechaFin}`, { align: 'center' });
    }
    
    doc.moveDown(2);

    // Obtener datos
    let whereClause = {};
    if (fechaInicio && fechaFin) {
      whereClause.createdAt = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin + 'T23:59:59.999Z')
      };
    }

    const [totalSolicitudes, solicitudesPorEstado, solicitudes] = await Promise.all([
      prisma.solicitud.count({ where: whereClause }),
      prisma.solicitud.groupBy({
        where: whereClause,
        by: ['estado'],
        _count: { estado: true }
      }),
      prisma.solicitud.findMany({
        where: whereClause,
        include: {
          cliente: { select: { nombre: true } },
          soporte: { select: { nombre: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50 // Limitar para PDF
      })
    ]);

    // Resumen
    doc.fontSize(16).font('Helvetica-Bold');
    doc.text('RESUMEN EJECUTIVO');
    doc.moveDown();

    doc.fontSize(12).font('Helvetica');
    doc.text(`Total de solicitudes: ${totalSolicitudes}`);
    
    solicitudesPorEstado.forEach(item => {
      doc.text(`Solicitudes ${item.estado}: ${item._count.estado}`);
    });

    doc.moveDown(2);

    // Tabla de solicitudes
    doc.fontSize(16).font('Helvetica-Bold');
    doc.text('DETALLE DE SOLICITUDES');
    doc.moveDown();

    doc.fontSize(10).font('Helvetica');
    
    let y = doc.y;
    const tableTop = y;
    const colWidths = [40, 200, 120, 120, 80];
    const headers = ['ID', 'Título', 'Cliente', 'Soporte', 'Estado'];

    // Headers
    let x = 50;
    headers.forEach((header, i) => {
      doc.font('Helvetica-Bold').text(header, x, y, { width: colWidths[i] });
      x += colWidths[i];
    });

    y += 20;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 10;

    // Datos
    solicitudes.slice(0, 30).forEach((solicitud, index) => {
      if (y > 700) { // Nueva página
        doc.addPage();
        y = 50;
      }

      x = 50;
      const rowData = [
        solicitud.id.toString(),
        solicitud.titulo.substring(0, 30) + (solicitud.titulo.length > 30 ? '...' : ''),
        solicitud.cliente?.nombre || 'N/A',
        solicitud.soporte?.nombre || 'Sin asignar',
        solicitud.estado
      ];

      doc.font('Helvetica');
      rowData.forEach((data, i) => {
        doc.text(data, x, y, { width: colWidths[i] });
        x += colWidths[i];
      });

      y += 15;
    });

    // Finalizar PDF
    doc.end();

    console.log('Reporte PDF generado exitosamente');

  } catch (error) {
    console.error('Error exportando a PDF:', error);
    res.status(500).json({ error: 'Error exportando a PDF: ' + error.message });
  }
});

module.exports = router;