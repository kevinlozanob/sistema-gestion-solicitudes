const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const emailService = require('../services/emailService');
const aiService = require('../services/aiService'); // ✅ NUEVO
const prisma = new PrismaClient();

const sanitize = str => str.trim();

router.get('/buscar', auth(['CLIENTE', 'SOPORTE', 'ADMIN']), async (req, res) => {
  try {
    console.log('🔍 Búsqueda recibida:', req.query);

    const { 
      texto, 
      estado, 
      clienteId, 
      soporteId, 
      fechaInicio, 
      fechaFin, 
      page = 1, 
      limit = 10,
      orderBy = 'createdAt',
      orderDir = 'desc'
    } = req.query;

    // Validaciones
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    console.log('Parámetros procesados:', { pageNum, limitNum, offset });

    // Construir filtros
    let where = {};
    
    // Filtrar por rol del usuario
    if (req.user.rol === 'CLIENTE') {
      where.clienteId = req.user.userId;
    } else if (req.user.rol === 'SOPORTE') {
      where.soporteId = req.user.userId;
    }
    // ADMIN puede ver todas

    // Filtro por texto en título o descripción
    if (texto && texto.trim()) {
      where.OR = [
        { titulo: { contains: texto.trim() } },
        { descripcion: { contains: texto.trim() } }
      ];
    }

    // Filtro por estado
    if (estado && ['ABIERTA', 'EN_PROCESO', 'CERRADA'].includes(estado)) {
      where.estado = estado;
    }

    // Filtro por cliente (solo para admin/soporte)
    if (clienteId && req.user.rol !== 'CLIENTE') {
      where.clienteId = parseInt(clienteId);
    }

    // Filtro por soporte (solo para admin)
    if (soporteId && req.user.rol === 'ADMIN') {
      where.soporteId = parseInt(soporteId);
    }

    // Filtro por fechas
    if (fechaInicio || fechaFin) {
      where.createdAt = {};
      if (fechaInicio) {
        where.createdAt.gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        const fechaFinDate = new Date(fechaFin);
        fechaFinDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = fechaFinDate;
      }
    }

    console.log('Filtros WHERE:', JSON.stringify(where, null, 2));

    // Ordenamiento
    const validOrderBy = ['createdAt', 'updatedAt', 'titulo', 'estado'];
    const orderField = validOrderBy.includes(orderBy) ? orderBy : 'createdAt';
    const orderDirection = orderDir === 'asc' ? 'asc' : 'desc';

    // Ejecutar búsqueda con paginación
    const [solicitudes, total] = await Promise.all([
      prisma.solicitud.findMany({
        where,
        include: {
          cliente: { select: { nombre: true, email: true } },
          soporte: { select: { nombre: true, email: true } }
        },
        orderBy: { [orderField]: orderDirection },
        skip: offset,
        take: limitNum
      }),
      prisma.solicitud.count({ where })
    ]);

    console.log(`✅ Encontradas ${solicitudes.length} solicitudes de ${total} total`);

    // Formatear fechas
    const solicitudesFormateadas = solicitudes.map(s => ({
      ...s,
      createdAt: new Date(s.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
      updatedAt: new Date(s.updatedAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })
    }));

    // Metadatos de paginación
    const totalPages = Math.ceil(total / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    res.json({
      solicitudes: solicitudesFormateadas,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNext,
        hasPrev
      },
      filtros: {
        texto: texto || null,
        estado: estado || null,
        clienteId: clienteId || null,
        soporteId: soporteId || null,
        fechaInicio: fechaInicio || null,
        fechaFin: fechaFin || null,
        orderBy: orderField,
        orderDir: orderDirection
      }
    });

  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({ error: 'Error en la búsqueda: ' + error.message });
  }
});

router.get('/filtros/opciones', auth(['SOPORTE', 'ADMIN']), async (req, res) => {
  try {
    console.log('📋 Obteniendo opciones de filtros...');

    const [clientes, soportes] = await Promise.all([
      prisma.user.findMany({
        where: { rol: 'CLIENTE' },
        select: { id: true, nombre: true, email: true }
      }),
      prisma.user.findMany({
        where: { rol: 'SOPORTE' },
        select: { id: true, nombre: true, email: true }
      })
    ]);

    console.log(`Opciones: ${clientes.length} clientes, ${soportes.length} soportes`);

    res.json({ clientes, soportes });
  } catch (error) {
    console.error('Error obteniendo opciones:', error);
    res.status(500).json({ error: 'Error obteniendo opciones: ' + error.message });
  }
});

// ✅ IA: Generar respuesta sugerida
router.post('/:id/ai-response', auth(['SOPORTE', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { contexto } = req.body;

    const solicitud = await prisma.solicitud.findUnique({
      where: { id: parseInt(id) },
      include: {
        cliente: { select: { nombre: true, email: true } }
      }
    });

    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    if (req.user.rol === 'SOPORTE' && solicitud.soporteId !== req.user.userId) {
      return res.status(403).json({ error: 'No tienes permisos para esta solicitud' });
    }

    console.log('Generando respuesta IA para solicitud:', id);
    const respuestaIA = await aiService.generarRespuestaPersonalizada(solicitud, contexto);

    res.json({ 
      respuesta_sugerida: respuestaIA,
      solicitud_id: parseInt(id),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generando respuesta IA:', error);
    res.status(500).json({ error: 'Error generando respuesta IA: ' + error.message });
  }
});

// ✅ IA: Análisis completo de solicitud
router.get('/:id/ai-analysis', auth(['SOPORTE', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;

    const solicitud = await prisma.solicitud.findUnique({
      where: { id: parseInt(id) },
      include: {
        cliente: { select: { nombre: true, email: true } }
      }
    });

    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    if (req.user.rol === 'SOPORTE' && solicitud.soporteId !== req.user.userId) {
      return res.status(403).json({ error: 'No tienes permisos para esta solicitud' });
    }

    console.log('Analizando solicitud:', id);
    const analisis = await aiService.analizarSolicitud(solicitud);

    res.json({
      solicitud_id: parseInt(id),
      analisis_ia: analisis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en análisis IA:', error);
    res.status(500).json({ error: 'Error en análisis IA: ' + error.message });
  }
});

// ✅ IA: Análisis masivo para reportes
router.get('/ai-insights', auth(['ADMIN']), async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    console.log('Generando insights IA...');

    const solicitudes = await prisma.solicitud.findMany({
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: { id: true, titulo: true, descripcion: true, estado: true }
    });

    const insights = await aiService.categorizarSolicitudes(solicitudes);

    res.json({
      total_analizadas: solicitudes.length,
      insights_ia: insights,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generando insights:', error);
    res.status(500).json({ error: 'Error generando insights: ' + error.message });
  }
});

router.post('/', auth(['CLIENTE']), async (req, res) => {
  try {
    const { titulo, descripcion } = req.body;

    // Validaciones
    if (!titulo || typeof titulo !== 'string' || titulo.trim().length < 5 || titulo.trim().length > 100) {
      return res.status(400).json({ error: 'Título debe tener entre 5 y 100 caracteres' });
    }
    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length < 10 || descripcion.trim().length > 500) {
      return res.status(400).json({ error: 'Descripción debe tener entre 10 y 500 caracteres' });
    }

    console.log('reando solicitud para usuario:', req.user.userId);

    // Crear solicitud
    const solicitud = await prisma.solicitud.create({
      data: {
        titulo: sanitize(titulo),
        descripcion: sanitize(descripcion),
        clienteId: req.user.userId,
        estado: 'ABIERTA'
      },
      include: {
        cliente: { select: { nombre: true, email: true } }
      }
    });

    console.log('✅ Solicitud creada:', solicitud.id);

    const procesarIA = async () => {
      try {
        console.log('Iniciando análisis IA para solicitud:', solicitud.id);
        const analisisIA = await aiService.analizarSolicitud(solicitud);
        
        console.log('Análisis IA completado:', analisisIA);

        // Obtener equipo de soporte
        const equipoSoporte = await prisma.user.findMany({
          where: { rol: 'SOPORTE' },
          select: { nombre: true, email: true }
        });

        // Enviar notificación con IA al equipo de soporte
        await emailService.notificarSoportesConIA(
          solicitud, 
          solicitud.cliente, 
          equipoSoporte, 
          analisisIA
        );

      } catch (error) {
        console.error('Error en análisis IA:', error);
        
        // Fallback: enviar notificación tradicional
        const equipoSoporte = await prisma.user.findMany({
          where: { rol: 'SOPORTE' },
          select: { nombre: true, email: true }
        });

        await emailService.notificarSoportesNuevaSolicitud(
          solicitud, 
          solicitud.cliente, 
          equipoSoporte
        );
      }
    };

    // Ejecutar IA en paralelo
    procesarIA();

    // Enviar notificación inmediata al cliente
    await emailService.enviarNotificacionSolicitudCreada(solicitud, solicitud.cliente);

    // Respuesta inmediata
    res.status(201).json({ 
      message: 'Solicitud creada exitosamente', 
      solicitud,
      ai_processing: "Análisis de IA en proceso..."
    });

  } catch (error) {
    console.error('Error creando solicitud:', error);
    res.status(500).json({ error: 'Error en el servidor: ' + error.message });
  }
});

// ✅ LISTAR: Listar solicitudes según rol
router.get('/', auth(['CLIENTE', 'SOPORTE', 'ADMIN']), async (req, res) => {
  try {
    let solicitudes;

    console.log('Listando solicitudes para rol:', req.user.rol);

    if (req.user.rol === 'ADMIN') {
      solicitudes = await prisma.solicitud.findMany({
        include: {
          cliente: { select: { nombre: true, email: true } },
          soporte: { select: { nombre: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (req.user.rol === 'SOPORTE') {
      solicitudes = await prisma.solicitud.findMany({
        where: { soporteId: req.user.userId },
        include: {
          cliente: { select: { nombre: true, email: true } },
          soporte: { select: { nombre: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      solicitudes = await prisma.solicitud.findMany({
        where: { clienteId: req.user.userId },
        include: {
          cliente: { select: { nombre: true, email: true } },
          soporte: { select: { nombre: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Formatear fechas
    const solicitudesFormateadas = solicitudes.map(s => ({
      ...s,
      createdAt: new Date(s.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
      updatedAt: new Date(s.updatedAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })
    }));

    console.log(`Encontradas ${solicitudesFormateadas.length} solicitudes`);

    res.json({ 
      solicitudes: solicitudesFormateadas,
      total: solicitudesFormateadas.length 
    });
  } catch (error) {
    console.error('Error listando solicitudes:', error);
    res.status(500).json({ error: 'Error en el servidor: ' + error.message });
  }
});

router.put('/:id', auth(['SOPORTE', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, respuesta } = req.body;

    // Validaciones
    const estadosValidos = ['ABIERTA', 'EN_PROCESO', 'CERRADA'];
    if (estado && !estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    if (respuesta && (typeof respuesta !== 'string' || respuesta.trim().length < 5 || respuesta.trim().length > 500)) {
      return res.status(400).json({ error: 'Respuesta debe tener entre 5 y 500 caracteres' });
    }

    if (!estado && !respuesta) {
      return res.status(400).json({ error: 'Debes enviar al menos un campo para actualizar' });
    }

    console.log('Actualizando solicitud:', id);

    const solicitud = await prisma.solicitud.findUnique({ 
      where: { id: parseInt(id) },
      include: {
        cliente: { select: { nombre: true, email: true } }
      }
    });

    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    // Verificar permisos para soporte
    if (req.user.rol === 'SOPORTE' && solicitud.soporteId && solicitud.soporteId !== req.user.userId) {
      return res.status(403).json({ error: 'No tienes permisos para esta solicitud' });
    }

    let soporteId = solicitud.soporteId;
    let notificarAsignacion = false;

    // Auto-asignar si es soporte y no está asignada
    if (req.user.rol === 'SOPORTE' && !soporteId) {
      soporteId = req.user.userId;
      notificarAsignacion = true;
    }

    // Actualizar solicitud
    const solicitudActualizada = await prisma.solicitud.update({
      where: { id: parseInt(id) },
      data: {
        estado: estado || solicitud.estado,
        respuesta: respuesta ? sanitize(respuesta) : solicitud.respuesta,
        soporteId
      },
      include: {
        cliente: { select: { nombre: true, email: true } },
        soporte: { select: { nombre: true, email: true } }
      }
    });

    // Registrar en historial
    await prisma.historial.create({
      data: {
        solicitudId: solicitudActualizada.id,
        usuarioId: req.user.userId,
        accion: 'Actualización de solicitud',
        detalle: `Estado: ${estado || solicitud.estado}, Respuesta: ${respuesta || 'Sin cambios'}`
      }
    });

    // Enviar notificaciones
    await emailService.enviarNotificacionSolicitudActualizada(
      solicitudActualizada, 
      solicitudActualizada.cliente, 
      solicitudActualizada.soporte
    );

    if (notificarAsignacion && solicitudActualizada.soporte) {
      await emailService.notificarAsignacionSoporte(
        solicitudActualizada,
        solicitudActualizada.cliente,
        solicitudActualizada.soporte
      );
    }

    console.log('Solicitud actualizada exitosamente');

    res.json({ 
      message: 'Solicitud actualizada exitosamente', 
      solicitud: solicitudActualizada 
    });

  } catch (error) {
    console.error('Error actualizando solicitud:', error);
    res.status(500).json({ error: 'Error en el servidor: ' + error.message });
  }
});

router.put('/:id/asignar', auth(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { soporteId } = req.body;

    if (!soporteId) {
      return res.status(400).json({ error: 'ID de soporte es obligatorio' });
    }

    console.log('Asignando soporte', soporteId, 'a solicitud', id);

    // Verificar que el soporte existe
    const soporte = await prisma.user.findUnique({
      where: { id: parseInt(soporteId), rol: 'SOPORTE' },
      select: { nombre: true, email: true }
    });

    if (!soporte) {
      return res.status(404).json({ error: 'Soporte no encontrado' });
    }

    // Verificar que la solicitud existe
    const solicitud = await prisma.solicitud.findUnique({
      where: { id: parseInt(id) },
      include: {
        cliente: { select: { nombre: true, email: true } }
      }
    });

    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    // Actualizar asignación
    const solicitudActualizada = await prisma.solicitud.update({
      where: { id: parseInt(id) },
      data: { soporteId: parseInt(soporteId) },
      include: {
        cliente: { select: { nombre: true, email: true } },
        soporte: { select: { nombre: true, email: true } }
      }
    });

    // Registrar en historial
    await prisma.historial.create({
      data: {
        solicitudId: solicitudActualizada.id,
        usuarioId: req.user.userId,
        accion: 'Asignación de soporte',
        detalle: `Soporte asignado: ${soporte.nombre}`
      }
    });

    // Notificar al soporte asignado
    await emailService.notificarAsignacionSoporte(
      solicitudActualizada,
      solicitudActualizada.cliente,
      soporte
    );

    console.log('✅ Soporte asignado exitosamente');

    res.json({ 
      message: 'Soporte asignado exitosamente', 
      solicitud: solicitudActualizada 
    });

  } catch (error) {
    console.error('Error asignando soporte:', error);
    res.status(500).json({ error: 'Error en el servidor: ' + error.message });
  }
});

// ✅ DETALLE: Obtener solicitud por ID
router.get('/:id', auth(['CLIENTE', 'SOPORTE', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Obteniendo solicitud:', id);

    const solicitud = await prisma.solicitud.findUnique({
      where: { id: parseInt(id) },
      include: {
        cliente: { select: { nombre: true, email: true } },
        soporte: { select: { nombre: true, email: true } }
      }
    });

    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    // Verificar permisos
    if (req.user.rol === 'CLIENTE' && solicitud.clienteId !== req.user.userId) {
      return res.status(403).json({ error: 'No tienes permisos para ver esta solicitud' });
    }
    if (req.user.rol === 'SOPORTE' && solicitud.soporteId !== req.user.userId) {
      return res.status(403).json({ error: 'No tienes permisos para ver esta solicitud' });
    }

    console.log('Solicitud encontrada');

    res.json({ solicitud });
  } catch (error) {
    console.error('Error obteniendo solicitud:', error);
    res.status(500).json({ error: 'Error en el servidor: ' + error.message });
  }
});

router.get('/:id/historial', auth(['SOPORTE', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Obteniendo historial de solicitud:', id);

    const solicitud = await prisma.solicitud.findUnique({ 
      where: { id: parseInt(id) } 
    });

    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    // Verificar permisos para soporte
    if (req.user.rol === 'SOPORTE' && solicitud.soporteId !== req.user.userId) {
      return res.status(403).json({ error: 'No tienes permisos para ver este historial' });
    }

    const historial = await prisma.historial.findMany({
      where: { solicitudId: parseInt(id) },
      include: { 
        usuario: { 
          select: { nombre: true, email: true, rol: true } 
        } 
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Historial obtenido: ${historial.length} registros`);

    res.json({ historial });
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ error: 'Error al obtener el historial: ' + error.message });
  }
});

module.exports = router;