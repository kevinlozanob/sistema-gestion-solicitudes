const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const prisma = new PrismaClient();

// Reporte de solicitudes agrupadas por estado
router.get('/solicitudes', auth(['ADMIN']), async (req, res) => {
  try {
    const resumen = await prisma.solicitud.groupBy({
      by: ['estado'],
      _count: { estado: true }
    });

    const resultado = resumen.reduce((acc, item) => {
      acc[item.estado] = item._count.estado;
      return acc;
    }, {});

    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error generando el reporte' });
  }
});

module.exports = router;
