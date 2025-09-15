const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de la base de datos...');

  await prisma.historial.deleteMany();
  await prisma.solicitud.deleteMany();
  await prisma.user.deleteMany();
  console.log('Datos existentes eliminados');

  const fechaBase = new Date('2024-12-01T10:00:00.000Z');
  const fecha1 = new Date('2024-12-05T14:30:00.000Z');
  const fecha2 = new Date('2024-12-10T09:15:00.000Z');
  const fecha3 = new Date('2024-12-15T16:45:00.000Z');
  const fecha4 = new Date('2024-12-20T11:20:00.000Z');
  const fechaReciente = new Date('2024-12-25T08:30:00.000Z');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: await bcrypt.hash('admin123', 10),
      nombre: 'Admin Principal',
      rol: 'ADMIN',
      createdAt: fechaBase,
      updatedAt: fechaBase
    }
  });

  const soporte = await prisma.user.create({
    data: {
      email: 'soporte1@test.com',
      password: await bcrypt.hash('soporte123', 10),
      nombre: 'Juan Soporte',
      rol: 'SOPORTE',
      createdAt: fecha1,
      updatedAt: fecha3
    }
  });

  const soporte2 = await prisma.user.create({
    data: {
      email: 'soporte2@test.com',
      password: await bcrypt.hash('soporte123', 10),
      nombre: 'Ana López',
      rol: 'SOPORTE',
      createdAt: fecha2,
      updatedAt: fecha2
    }
  });

  const cliente1 = await prisma.user.create({
    data: {
      email: 'cliente1@test.com',
      password: await bcrypt.hash('cliente123', 10),
      nombre: 'María Cliente',
      rol: 'CLIENTE',
      createdAt: fecha1,
      updatedAt: fechaReciente
    }
  });

  const cliente2 = await prisma.user.create({
    data: {
      email: 'cliente2@test.com',
      password: await bcrypt.hash('cliente123', 10),
      nombre: 'Pedro Cliente',
      rol: 'CLIENTE',
      createdAt: fecha2,
      updatedAt: fecha2
    }
  });

  const cliente3 = await prisma.user.create({
    data: {
      email: 'cliente3@test.com',
      password: await bcrypt.hash('cliente123', 10),
      nombre: 'Carmen Rodríguez',
      rol: 'CLIENTE',
      createdAt: fecha4,
      updatedAt: fecha4
    }
  });

  console.log('✅ Usuarios creados con fechas específicas');

  const solicitudes = [
    {
      titulo: 'Problema con el login',
      descripcion: 'No puedo acceder a mi cuenta desde ayer. Aparece un error de credenciales inválidas.',
      clienteId: cliente1.id,
      estado: 'ABIERTA',
      createdAt: fechaReciente,
      updatedAt: fechaReciente
    },
    {
      titulo: 'Error en el sistema de pagos',
      descripcion: 'El pago no se procesa correctamente. Tengo un error 500 cuando intento pagar.',
      clienteId: cliente1.id,
      soporteId: soporte.id,
      estado: 'EN_PROCESO',
      respuesta: 'Hemos identificado el problema en el gateway de pagos. Trabajando en una solución.',
      createdAt: fecha3,
      updatedAt: fecha4
    },
    {
      titulo: 'Consulta sobre funcionalidades',
      descripcion: '¿Cómo puedo cambiar mi contraseña? No encuentro la opción en el menú.',
      clienteId: cliente2.id,
      soporteId: soporte.id,
      estado: 'CERRADA',
      respuesta: 'Puede cambiar su contraseña en Perfil > Configuración > Cambiar contraseña.',
      createdAt: fecha2,
      updatedAt: fecha2
    },
    {
      titulo: 'Solicitud de nueva funcionalidad',
      descripcion: 'Me gustaría que agregaran la opción de exportar reportes en PDF.',
      clienteId: cliente2.id,
      soporteId: soporte2.id,
      estado: 'EN_PROCESO',
      respuesta: 'Excelente sugerencia. Lo evaluaremos para la próxima versión.',
      createdAt: fecha2,
      updatedAt: fecha3
    },
    {
      titulo: 'Bug en el dashboard',
      descripcion: 'Los gráficos no cargan correctamente en Chrome. Solo veo pantalla en blanco.',
      clienteId: cliente3.id,
      estado: 'ABIERTA',
      createdAt: fecha4,
      updatedAt: fecha4
    },
    {
      titulo: 'Problema de rendimiento',
      descripcion: 'La aplicación va muy lenta desde la última actualización.',
      clienteId: cliente3.id,
      soporteId: soporte2.id,
      estado: 'CERRADA',
      respuesta: 'Optimizamos las consultas de base de datos. El rendimiento debería haber mejorado.',
      createdAt: fecha1,
      updatedAt: fecha1
    }
  ];

  for (const solicitudData of solicitudes) {
    const solicitud = await prisma.solicitud.create({
      data: solicitudData
    });
    console.log(`✅ Solicitud creada: "${solicitud.titulo}"`);
  }

  const historialEntries = [
    {
      solicitudId: 2,
      usuarioId: soporte.id,
      accion: 'Solicitud asignada',
      detalle: 'Solicitud asignada a Juan Soporte para revisión',
      createdAt: fecha3
    },
    {
      solicitudId: 2,
      usuarioId: soporte.id,
      accion: 'Estado actualizado',
      detalle: 'Estado cambiado de ABIERTA a EN_PROCESO',
      createdAt: fecha4
    },
    {
      solicitudId: 3, 
      usuarioId: soporte.id,
      accion: 'Respuesta agregada',
      detalle: 'Respuesta proporcionada al cliente',
      createdAt: fecha2
    },
    {
      solicitudId: 3,
      usuarioId: soporte.id,
      accion: 'Solicitud cerrada',
      detalle: 'Solicitud marcada como CERRADA tras resolución',
      createdAt: fecha2
    }
  ];

  for (const historialData of historialEntries) {
    await prisma.historial.create({
      data: historialData
    });
  }

  console.log('✅ Historial creado');

  console.log('\nSeed completado exitosamente!');
  console.log('\nUsuarios de prueba:');
  console.log('Admin: admin@test.com / admin123');
  console.log('Soporte 1: soporte1@test.com / soporte123 (Juan)');
  console.log('Soporte 2: soporte2@test.com / soporte123 (Ana)');
  console.log('Cliente 1: cliente1@test.com / cliente123 (María)');
  console.log('Cliente 2: cliente2@test.com / cliente123 (Pedro)');
  console.log('Cliente 3: cliente3@test.com / cliente123 (Carmen)');

}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });