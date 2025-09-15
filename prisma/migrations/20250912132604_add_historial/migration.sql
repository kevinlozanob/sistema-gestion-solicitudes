-- CreateTable
CREATE TABLE "historial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "solicitudId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "accion" TEXT NOT NULL,
    "detalle" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "historial_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "historial_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
