const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async enviarNotificacionSolicitudCreada(solicitud, cliente) {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: cliente.email,
      subject: `✅ Solicitud #${solicitud.id} creada exitosamente`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #667eea; margin: 0;">🎯 Sistema de Solicitudes</h1>
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 3px; width: 100px; margin: 10px auto;"></div>
            </div>
            
            <h2 style="color: #27ae60; margin-bottom: 20px;">✅ Solicitud Creada Exitosamente</h2>
            
            <p>Hola <strong>${cliente.nombre}</strong>,</p>
            <p>Tu solicitud ha sido registrada en nuestro sistema y será procesada con inteligencia artificial:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin-top: 0;">📋 Solicitud #${solicitud.id}</h3>
              <p><strong>Título:</strong> ${solicitud.titulo}</p>
              <p><strong>Descripción:</strong> ${solicitud.descripcion}</p>
              <p><strong>Estado:</strong> <span style="background: #e74c3c; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${solicitud.estado}</span></p>
              <p><strong>Fecha de creación:</strong> ${new Date(solicitud.createdAt).toLocaleString('es-CO')}</p>
            </div>
            
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #27ae60;">
              <h4 style="color: #27ae60; margin-top: 0;">🤖 Procesamiento con IA</h4>
              <p style="margin: 0; color: #555;">Nuestro sistema de inteligencia artificial está analizando tu solicitud para:</p>
              <ul style="color: #555; margin: 10px 0;">
                <li>Categorizar automáticamente el problema</li>
                <li>Asignar la prioridad adecuada</li>
                <li>Estimar tiempo de resolución</li>
                <li>Preparar respuestas sugeridas para nuestro equipo</li>
              </ul>
            </div>
            
            <p>Te notificaremos por correo cuando haya actualizaciones en tu solicitud.</p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">
                Este es un mensaje automático del Sistema de Gestión de Solicitudes con IA.<br>
                Por favor no respondas a este correo.
              </p>
            </div>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de solicitud creada enviado a cliente:', cliente.email);
    } catch (error) {
      console.error('❌ Error enviando email al cliente:', error);
    }
  }

  // MEJORADO: Notificar a todos los soportes con análisis IA
  async notificarSoportesConIA(solicitud, cliente, equipoSoporte, analisisIA) {
    if (!equipoSoporte || equipoSoporte.length === 0) return;

    const priorityEmoji = this.getPriorityEmoji(analisisIA.prioridad);
    const priorityColor = this.getPriorityColor(analisisIA.prioridad);

    for (const soporte of equipoSoporte) {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: soporte.email,
        subject: `${priorityEmoji} ${analisisIA.prioridad.toUpperCase()}: Nueva solicitud #${solicitud.id} - ${analisisIA.categoria}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #667eea; margin: 0;">🤖 Sistema de Solicitudes + IA</h1>
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 3px; width: 100px; margin: 10px auto;"></div>
              </div>
              
              <h2 style="color: #3498db; margin-bottom: 20px;">🚨 Nueva Solicitud con Análisis IA</h2>
              
              <p>Hola <strong>${soporte.nombre}</strong>,</p>
              <p>Nueva solicitud procesada automáticamente con inteligencia artificial:</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498db;">
                <h3 style="color: #333; margin-top: 0;">📋 Solicitud #${solicitud.id}</h3>
                <p><strong>Título:</strong> ${solicitud.titulo}</p>
                <p><strong>Descripción:</strong> ${solicitud.descripcion}</p>
                <p><strong>Cliente:</strong> ${cliente.nombre} (${cliente.email})</p>
                <p><strong>Creada:</strong> ${new Date().toLocaleString('es-CO')}</p>
              </div>

              <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #27ae60;">
                <h3 style="color: #27ae60; margin-top: 0;">🤖 Análisis IA Completo</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                  <div>
                    <strong>📂 Categoría:</strong><br>
                    <span style="background: #667eea; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${analisisIA.categoria}</span>
                  </div>
                  <div>
                    <strong>⚡ Prioridad:</strong><br>
                    <span style="background: ${priorityColor}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${priorityEmoji} ${analisisIA.prioridad}</span>
                  </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                  <strong>⏱️ Tiempo estimado de resolución:</strong><br>
                  <span style="color: #f39c12; font-weight: 600;">${analisisIA.tiempo_estimado}</span>
                </div>
                
                <div style="margin-bottom: 15px;">
                  <strong>🏷️ Tags sugeridos:</strong><br>
                  ${analisisIA.tags.map(tag => `<span style="background: #f8f9fa; color: #667eea; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin: 2px;">#${tag}</span>`).join(' ')}
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #ddd;">
                  <strong style="color: #667eea;">💡 Respuesta sugerida por IA:</strong>
                  <p style="margin: 10px 0 0 0; color: #555; font-style: italic; line-height: 1.5;">"${analisisIA.respuesta_sugerida}"</p>
                </div>
                
                <div style="text-align: right; margin-top: 10px;">
                  <small style="color: #999;">🎯 Confianza IA: ${Math.round((analisisIA.confianza || 0.8) * 100)}%</small>
                </div>
              </div>
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <p style="margin: 0; color: #856404;"><strong>💼 Acción recomendada:</strong> 
                ${analisisIA.prioridad === 'Alto' ? 'Revisar inmediatamente y responder en las próximas 2 horas.' : 
                  analisisIA.prioridad === 'Medio' ? 'Revisar dentro de las próximas 4-8 horas.' : 
                  'Revisar cuando sea conveniente, dentro de 1-2 días.'}
                </p>
              </div>
              
              <p>La IA ha pre-analizado esta solicitud para acelerar tu respuesta. Puedes usar la respuesta sugerida como base y personalizarla según sea necesario.</p>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 12px;">
                  Sistema de Solicitudes con IA powered by Groq 🚀<br>
                  Por favor no respondas a este correo.
                </p>
              </div>
            </div>
          </div>
        `
      };

      try {
        await this.transporter.sendMail(mailOptions);
        console.log('✅ Email con análisis IA enviado a soporte:', soporte.email);
      } catch (error) {
        console.error('❌ Error enviando email IA a soporte:', error);
      }
    }
  }

  // MANTENER método original para compatibilidad
  async notificarSoportesNuevaSolicitud(solicitud, cliente, equipoSoporte) {
    if (!equipoSoporte || equipoSoporte.length === 0) return;

    for (const soporte of equipoSoporte) {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: soporte.email,
        subject: `📋 Nueva solicitud #${solicitud.id} disponible`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #667eea; margin: 0;">Sistema de Solicitudes</h1>
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 3px; width: 100px; margin: 10px auto;"></div>
              </div>
              
              <h2 style="color: #3498db; margin-bottom: 20px;">📋 Nueva Solicitud Disponible</h2>
              
              <p>Hola <strong>${soporte.nombre}</strong>,</p>
              <p>Se ha creado una nueva solicitud que requiere atención:</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498db;">
                <h3 style="color: #333; margin-top: 0;">Solicitud #${solicitud.id}</h3>
                <p><strong>Título:</strong> ${solicitud.titulo}</p>
                <p><strong>Descripción:</strong> ${solicitud.descripcion}</p>
                <p><strong>Cliente:</strong> ${cliente.nombre} (${cliente.email})</p>
                <p><strong>Estado:</strong> <span style="background: #e74c3c; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${solicitud.estado}</span></p>
                <p><strong>Creada:</strong> ${new Date().toLocaleString('es-CO')}</p>
              </div>
              
              <p>Ingresa al sistema para ver más detalles y asignar la solicitud.</p>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 12px;">
                  Este es un mensaje automático del Sistema de Gestión de Solicitudes.<br>
                  Por favor no respondas a este correo.
                </p>
              </div>
            </div>
          </div>
        `
      };

      try {
        await this.transporter.sendMail(mailOptions);
        console.log('✅ Email de nueva solicitud enviado a soporte:', soporte.email);
      } catch (error) {
        console.error('❌ Error enviando email a soporte:', error);
      }
    }
  }

  async notificarAsignacionSoporte(solicitud, cliente, soporte) {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: soporte.email,
      subject: `🎯 Solicitud #${solicitud.id} asignada a ti`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #667eea; margin: 0;">Sistema de Solicitudes</h1>
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 3px; width: 100px; margin: 10px auto;"></div>
            </div>
            
            <h2 style="color: #f39c12; margin-bottom: 20px;">🎯 Solicitud Asignada</h2>
            
            <p>Hola <strong>${soporte.nombre}</strong>,</p>
            <p>Te han asignado una nueva solicitud:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f39c12;">
              <h3 style="color: #333; margin-top: 0;">Solicitud #${solicitud.id}</h3>
              <p><strong>Título:</strong> ${solicitud.titulo}</p>
              <p><strong>Descripción:</strong> ${solicitud.descripcion}</p>
              <p><strong>Cliente:</strong> ${cliente.nombre} (${cliente.email})</p>
              <p><strong>Estado:</strong> <span style="background: #f39c12; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${solicitud.estado}</span></p>
              <p><strong>Asignada:</strong> ${new Date().toLocaleString('es-CO')}</p>
            </div>
            
            <p>Por favor, revisa la solicitud y proporciona una respuesta al cliente.</p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">
                Este es un mensaje automático del Sistema de Gestión de Solicitudes.<br>
                Por favor no respondas a este correo.
              </p>
            </div>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de asignación enviado a soporte:', soporte.email);
    } catch (error) {
      console.error('❌ Error enviando email de asignación:', error);
    }
  }

  async enviarNotificacionSolicitudActualizada(solicitud, cliente, soporte) {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: cliente.email,
      subject: `🔄 Actualización en solicitud #${solicitud.id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #667eea; margin: 0;">Sistema de Solicitudes</h1>
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 3px; width: 100px; margin: 10px auto;"></div>
            </div>
            
            <h2 style="color: #f39c12; margin-bottom: 20px;">🔄 Solicitud Actualizada</h2>
            
            <p>Hola <strong>${cliente.nombre}</strong>,</p>
            <p>Tu solicitud ha sido actualizada:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f39c12;">
              <h3 style="color: #333; margin-top: 0;">Solicitud #${solicitud.id}</h3>
              <p><strong>Título:</strong> ${solicitud.titulo}</p>
              <p><strong>Estado:</strong> <span style="background: #f39c12; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${solicitud.estado}</span></p>
              ${solicitud.respuesta ? `
                <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #ddd;">
                  <strong style="color: #667eea;">💬 Respuesta del soporte:</strong>
                  <p style="margin: 10px 0 0 0; color: #555;">${solicitud.respuesta}</p>
                </div>
              ` : ''}
              <p><strong>Atendido por:</strong> ${soporte?.nombre || 'Sistema automático'}</p>
              <p><strong>Fecha de actualización:</strong> ${new Date().toLocaleString('es-CO')}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">
                Este es un mensaje automático del Sistema de Gestión de Solicitudes.<br>
                Por favor no respondas a este correo.
              </p>
            </div>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de actualización enviado a cliente:', cliente.email);
    } catch (error) {
      console.error('❌ Error enviando email al cliente:', error);
    }
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Conexión SMTP exitosa');
      return true;
    } catch (error) {
      console.error('❌ Error de conexión SMTP:', error);
      return false;
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