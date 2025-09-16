const nodemailer = require('nodemailer');
const { Resend } = require('resend');

class EmailService {
  constructor() {
    if (process.env.NODE_ENV === 'production' && process.env.RESEND_API_KEY) {
      // Resend para producción
      this.resend = new Resend(process.env.RESEND_API_KEY);
      this.useResend = true;
    } else {
      // SMTP para desarrollo local
      this.useResend = false;
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
  }

  async enviarEmail(to, subject, html) {
  if (this.useResend) {
    try {
      // Array de destinatarios: original + tu copia
      const destinatarios = Array.isArray(to) ? to : [to];
      destinatarios.push('cloveassistant@gmail.com'); // 📧 Tu copia

      await this.resend.emails.send({
        from: 'Sistema de Solicitudes <onboarding@resend.dev>',
        to: destinatarios,
        subject,
        html
      });
      console.log('✅ Email enviado via Resend a:', destinatarios.join(', '));
      return true;
    } catch (error) {
      console.error('❌ Error Resend:', error);
      return false;
    }
  } else {
    try {
      // Para SMTP también agregar tu correo
      const destinatarios = Array.isArray(to) ? to : [to];
      destinatarios.push('cloveassistant@gmail.com'); // 📧 Tu copia

      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: destinatarios.join(', '), // SMTP requiere string
        subject,
        html
      });
      console.log('✅ Email enviado via SMTP a:', destinatarios.join(', '));
      return true;
    } catch (error) {
      console.error('❌ Error SMTP:', error);
      return false;
    }
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
          <h1 style="color: #667eea; text-align: center;">Sistema de Solicitudes</h1>
          
          <h2 style="color: #f39c12;">🔄 Solicitud Actualizada</h2>
          
          <p>Hola <strong>${cliente.nombre}</strong>,</p>
          <p>Tu solicitud ha sido actualizada:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Solicitud #${solicitud.id}</h3>
            <p><strong>Título:</strong> ${solicitud.titulo}</p>
            <p><strong>Estado:</strong> ${solicitud.estado}</p>
            ${solicitud.respuesta ? `
              <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <strong>💬 Respuesta del soporte:</strong>
                <p style="margin: 10px 0 0 0; color: #555;">${solicitud.respuesta}</p>
              </div>
            ` : ''}
            <p><strong>Atendido por:</strong> ${soporte?.nombre || 'Sistema automático'}</p>
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
          <h1 style="color: #667eea; text-align: center;">Sistema de Solicitudes</h1>
          
          <h2 style="color: #f39c12;">🎯 Solicitud Asignada</h2>
          
          <p>Hola <strong>${soporte.nombre}</strong>,</p>
          <p>Te han asignado una nueva solicitud:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Solicitud #${solicitud.id}</h3>
            <p><strong>Título:</strong> ${solicitud.titulo}</p>
            <p><strong>Cliente:</strong> ${cliente.nombre}</p>
            <p><strong>Estado:</strong> ${solicitud.estado}</p>
          </div>
          
          <p>Por favor, revisa la solicitud y proporciona una respuesta al cliente.</p>
        </div>
      </div>
    `;
    
    return await this.enviarEmail(soporte.email, subject, html);
  }

  async testConnection() {
    if (this.useResend) {
      console.log('📧 Resend configurado correctamente');
      return true;
    } else {
      try {
        await this.transporter.verify();
        console.log('✅ Conexión SMTP exitosa');
        return true;
      } catch (error) {
        console.error('❌ Error SMTP:', error);
        return false;
      }
    }
  }

  // Utilidades para prioridades
  getPriorityEmoji(prioridad) {
    switch (prioridad) {
      case 'Alto': return '🔥';
      case 'Medio': return '⚡';
      case 'Bajo': return '📝';
      default: return '📋';
    }
  }

  getPriorityColor(prioridad) {
    switch (prioridad) {
      case 'Alto': return '#e74c3c';
      case 'Medio': return '#f39c12';
      case 'Bajo': return '#27ae60';
      default: return '#95a5a6';
    }
  }
}

module.exports = new EmailService();