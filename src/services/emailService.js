const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    // Siempre usar Gmail SMTP - sin complicaciones ni restricciones
    this.transporter = nodemailer.createTransporter({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER, // cloveassistant@gmail.com
        pass: process.env.SMTP_PASS  // tu app password
      }
    });

    console.log('📧 Servicio de email configurado con Gmail SMTP');
  }

  async enviarEmail(to, subject, html) {
    try {
      // Array de destinatarios: original + tu copia
      const destinatarios = Array.isArray(to) ? to : [to];
      destinatarios.push("cloveassistant@gmail.com"); // 📧 Tu copia

      await this.transporter.sendMail({
        from: `"Sistema de Solicitudes" <${process.env.SMTP_USER}>`,
        to: destinatarios.join(", "),
        subject,
        html
      });
      
      console.log("✅ Email enviado via Gmail SMTP a:", destinatarios.join(", "));
      return true;
    } catch (error) {
      console.error("❌ Error enviando email:", error);
      return false;
    }
  }

  async enviarNotificacionSolicitudCreada(solicitud, cliente) {
    const subject = `✅ Solicitud #${solicitud.id} creada exitosamente`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <h1 style="color: #667eea; text-align: center;">🎯 Sistema de Solicitudes</h1>
          
          <h2 style="color: #27ae60;">✅ Solicitud Creada Exitosamente</h2>
          
          <p>Hola <strong>${cliente.nombre}</strong>,</p>
          <p>Tu solicitud ha sido registrada en nuestro sistema:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📋 Solicitud #${solicitud.id}</h3>
            <p><strong>Título:</strong> ${solicitud.titulo}</p>
            <p><strong>Descripción:</strong> ${solicitud.descripcion}</p>
            <p><strong>Estado:</strong> ${solicitud.estado}</p>
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #27ae60;">🤖 Procesamiento con IA</h4>
            <p>Nuestro sistema de inteligencia artificial está analizando tu solicitud para proporcionar la mejor atención posible.</p>
          </div>
          
          <p>Te notificaremos cuando tengamos actualizaciones.</p>
          
          <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              Este es un email automático del Sistema de Gestión de Solicitudes
            </p>
          </div>
        </div>
      </div>
    `;

    return await this.enviarEmail(cliente.email, subject, html);
  }

  async notificarSoportesConIA(solicitud, cliente, equipoSoporte, analisisIA) {
    if (!equipoSoporte || equipoSoporte.length === 0) return;

    const subject = `🔥 ${analisisIA.prioridad}: Nueva solicitud #${solicitud.id} - ${analisisIA.categoria}`;

    for (const soporte of equipoSoporte) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <h1 style="color: #667eea; text-align: center;">🤖 Sistema con IA</h1>
            
            <h2 style="color: #3498db;">🚨 Nueva Solicitud con Análisis IA</h2>
            
            <p>Hola <strong>${soporte.nombre}</strong>,</p>
            <p>Nueva solicitud procesada automáticamente:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>📋 Solicitud #${solicitud.id}</h3>
              <p><strong>Título:</strong> ${solicitud.titulo}</p>
              <p><strong>Cliente:</strong> ${cliente.nombre}</p>
              <p><strong>Categoría IA:</strong> ${analisisIA.categoria}</p>
              <p><strong>Prioridad:</strong> ${analisisIA.prioridad}</p>
              <p><strong>Tiempo estimado:</strong> ${analisisIA.tiempo_estimado}</p>
              
              <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <strong>💡 Respuesta sugerida por IA:</strong>
                <p style="margin: 10px 0 0 0; color: #555;">"${analisisIA.respuesta_sugerida}"</p>
              </div>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h4 style="color: #856404; margin: 0 0 10px 0;">🎯 Acción requerida:</h4>
              <p style="margin: 0; color: #856404;">
                Por favor, revisa esta solicitud y proporciona una respuesta personalizada al cliente.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                Sistema de Gestión de Solicitudes con IA
              </p>
            </div>
          </div>
        </div>
      `;

      await this.enviarEmail(soporte.email, subject, html);
    }
  }

  async enviarNotificacionSolicitudActualizada(solicitud, cliente, soporte) {
    const subject = `🔄 Actualización en solicitud #${solicitud.id}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <h1 style="color: #667eea; text-align: center;">🎯 Sistema de Solicitudes</h1>
          
          <h2 style="color: #f39c12;">🔄 Solicitud Actualizada</h2>
          
          <p>Hola <strong>${cliente.nombre}</strong>,</p>
          <p>Tu solicitud ha sido actualizada:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📋 Solicitud #${solicitud.id}</h3>
            <p><strong>Título:</strong> ${solicitud.titulo}</p>
            <p><strong>Estado:</strong> <span style="color: ${this.getEstadoColor(solicitud.estado)}; font-weight: bold;">${solicitud.estado}</span></p>
            
            ${solicitud.respuesta ? `
              <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #667eea;">
                <strong>💬 Respuesta del soporte:</strong>
                <p style="margin: 10px 0 0 0; color: #555;">${solicitud.respuesta}</p>
              </div>
            ` : ""}
            
            <p><strong>Atendido por:</strong> ${soporte?.nombre || "Sistema automático"}</p>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              Gracias por usar nuestro Sistema de Gestión de Solicitudes
            </p>
          </div>
        </div>
      </div>
    `;

    return await this.enviarEmail(cliente.email, subject, html);
  }

  async notificarAsignacionSoporte(solicitud, cliente, soporte) {
    const subject = `🎯 Solicitud #${solicitud.id} asignada a ti`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <h1 style="color: #667eea; text-align: center;">🎯 Sistema de Solicitudes</h1>
          
          <h2 style="color: #f39c12;">🎯 Solicitud Asignada</h2>
          
          <p>Hola <strong>${soporte.nombre}</strong>,</p>
          <p>Te han asignado una nueva solicitud:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📋 Solicitud #${solicitud.id}</h3>
            <p><strong>Título:</strong> ${solicitud.titulo}</p>
            <p><strong>Cliente:</strong> ${cliente.nombre}</p>
            <p><strong>Email del cliente:</strong> ${cliente.email}</p>
            <p><strong>Estado:</strong> ${solicitud.estado}</p>
          </div>
          
          <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h4 style="color: #155724; margin: 0 0 10px 0;">📝 Próximos pasos:</h4>
            <p style="margin: 0; color: #155724;">
              Por favor, revisa la solicitud y proporciona una respuesta al cliente lo antes posible.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              Sistema de Gestión de Solicitudes - Notificación de Asignación
            </p>
          </div>
        </div>
      </div>
    `;

    return await this.enviarEmail(soporte.email, subject, html);
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log("✅ Conexión Gmail SMTP exitosa");
      return true;
    } catch (error) {
      console.error("❌ Error Gmail SMTP:", error);
      return false;
    }
  }

  // Utilidades para prioridades
  getPriorityEmoji(prioridad) {
    switch (prioridad) {
      case "Alto":
        return "🔥";
      case "Medio":
        return "⚡";
      case "Bajo":
        return "📝";
      default:
        return "📋";
    }
  }

  getPriorityColor(prioridad) {
    switch (prioridad) {
      case "Alto":
        return "#e74c3c";
      case "Medio":
        return "#f39c12";
      case "Bajo":
        return "#27ae60";
      default:
        return "#95a5a6";
    }
  }

  getEstadoColor(estado) {
    switch (estado) {
      case "ABIERTA":
        return "#e74c3c";
      case "EN_PROCESO":
        return "#f39c12";
      case "CERRADA":
        return "#27ae60";
      default:
        return "#95a5a6";
    }
  }
}

module.exports = new EmailService();