const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const auth = require("../middleware/auth");
const prisma = new PrismaClient();

const sanitize = (str) => str.trim();

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isStrongPassword = (pw) =>
  pw.length >= 6 && /[A-Za-z]/.test(pw) && /[0-9]/.test(pw);

router.post("/", async (req, res) => {
  try {
    let { nombre, email, password, rol } = req.body;

    // Validaciones mejoradas
    if (!nombre || typeof nombre !== "string" || nombre.trim().length < 3) {
      return res
        .status(400)
        .json({ error: "Nombre debe tener al menos 3 caracteres" });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "Email inválido" });
    }
    if (!password || !isStrongPassword(password)) {
      return res.status(400).json({
        error:
          "Contraseña debe tener al menos 6 caracteres, con letras y números",
      });
    }
    if (!["CLIENTE", "SOPORTE", "ADMIN"].includes(rol)) {
      return res.status(400).json({ error: "Rol inválido" });
    }

    
    nombre = sanitize(nombre);
    email = sanitize(email).toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "Email ya registrado" });
    }

    const hash = await bcrypt.hash(password, 12);

    const usuario = await prisma.user.create({
      data: { nombre, email, password: hash, rol },
    });

    console.log(`Usuario creado: ${email} (${rol})`);

    res.status(201).json({
      message: "Usuario creado exitosamente",
      usuario: { id: usuario.id, nombre, email, rol },
    });
  } catch (error) {
    console.error("Error creando usuario:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

router.get("/", auth(["ADMIN"]), async (req, res) => {
  try {
    const { rol, page = 1, limit = 20, search } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let where = {};

    // Filtro por rol
    if (rol && ["CLIENTE", "SOPORTE", "ADMIN"].includes(rol)) {
      where.rol = rol;
    }

    // Filtro por búsqueda en nombre o email
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { nombre: { contains: searchTerm } },
        { email: { contains: searchTerm } },
      ];
    }

    const [usuarios, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          createdAt: true,
        },
        orderBy: { nombre: "asc" },
        skip: offset,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    console.log(`Listados ${usuarios.length} usuarios de ${total} total`);

    res.json({
      usuarios,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Error listando usuarios:", error);
    res.status(500).json({ error: "Error obteniendo usuarios" });
  }
});

// ✅ OBTENER usuario por ID
router.get("/:id", auth(["ADMIN", "CLIENTE", "SOPORTE"]), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // Solo admin puede ver cualquier usuario, otros solo su propio perfil
    if (req.user.rol !== "ADMIN" && req.user.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Sin permisos para ver este usuario" });
    }

    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        createdAt: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    console.log(`Usuario obtenido: ${usuario.email}`);
    res.json({ usuario });
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    res.status(500).json({ error: "Error obteniendo usuario" });
  }
});

router.put("/:id", auth(["ADMIN", "CLIENTE", "SOPORTE"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, password, rol } = req.body;
    const userId = parseInt(id);

    // Solo admin puede editar cualquier usuario, otros solo su propio perfil
    if (req.user.rol !== "ADMIN" && req.user.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Sin permisos para editar este usuario" });
    }

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Preparar datos de actualización
    const updateData = {};

    // Validar y agregar nombre
    if (nombre !== undefined) {
      if (!nombre || nombre.trim().length < 3) {
        return res
          .status(400)
          .json({ error: "Nombre debe tener al menos 3 caracteres" });
      }
      updateData.nombre = sanitize(nombre);
    }

    // Validar y agregar email
    if (email !== undefined) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: "Email inválido" });
      }

      const emailLower = email.trim().toLowerCase();

      // Verificar que el email no esté en uso por otro usuario
      const emailInUse = await prisma.user.findFirst({
        where: { email: emailLower, NOT: { id: userId } },
      });

      if (emailInUse) {
        return res
          .status(409)
          .json({ error: "Email ya registrado por otro usuario" });
      }

      updateData.email = emailLower;
    }

    // Validar y agregar contraseña
    if (password !== undefined) {
      if (!isStrongPassword(password)) {
        return res.status(400).json({
          error:
            "Contraseña debe tener al menos 6 caracteres, con letras y números",
        });
      }
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Validar y agregar rol (solo admin puede cambiar roles)
    if (rol !== undefined) {
      if (req.user.rol !== "ADMIN") {
        return res
          .status(403)
          .json({ error: "Solo admin puede cambiar roles" });
      }
      if (!["CLIENTE", "SOPORTE", "ADMIN"].includes(rol)) {
        return res.status(400).json({ error: "Rol inválido" });
      }
      updateData.rol = rol;
    }

    // Verificar que hay datos para actualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No hay campos para actualizar" });
    }

    // Actualizar usuario
    const usuarioActualizado = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, nombre: true, email: true, rol: true },
    });

    console.log(`Usuario actualizado: ${usuarioActualizado.email}`);

    res.json({
      message: "Usuario actualizado exitosamente",
      usuario: usuarioActualizado,
    });
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    res.status(500).json({ error: "Error actualizando usuario" });
  }
});

router.delete("/:id", auth(["ADMIN"]), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // No permitir que admin se elimine a sí mismo
    if (req.user.userId === userId) {
      return res
        .status(400)
        .json({ error: "No puedes eliminar tu propia cuenta" });
    }

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verificar si tiene solicitudes asociadas
    const solicitudesCount = await prisma.solicitud.count({
      where: {
        OR: [{ clienteId: userId }, { soporteId: userId }],
      },
    });

    if (solicitudesCount > 0) {
      return res.status(400).json({
        error: `No se puede eliminar: usuario tiene ${solicitudesCount} solicitudes asociadas`,
      });
    }

    await prisma.user.delete({ where: { id: userId } });

    console.log(`Usuario eliminado: ${existingUser.email}`);

    res.status(200).json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    res.status(500).json({ error: "Error eliminando usuario" });
  }
});

router.get("/stats/resumen", auth(["ADMIN"]), async (req, res) => {
  try {
    const [totalUsuarios, porRol, usuariosRecientes] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ["rol"],
        _count: { rol: true },
      }),
      prisma.user.findMany({
        select: { nombre: true, email: true, rol: true, createdAt: true },
        orderBy: { id: "desc" },
        take: 5,
      }),
    ]);

    const estadisticas = {
      total: totalUsuarios,
      por_rol: porRol.reduce((acc, item) => {
        acc[item.rol] = item._count.rol;
        return acc;
      }, {}),
      usuarios_recientes: usuariosRecientes,
    };

    console.log("Estadísticas de usuarios generadas");
    res.json(estadisticas);
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    res.status(500).json({ error: "Error obteniendo estadísticas" });
  }
});

module.exports = router;
