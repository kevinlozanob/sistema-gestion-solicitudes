const Groq = require('groq-sdk');

class AIService {
  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }

  async analizarSolicitud(solicitud) {
    try {
      const prompt = `
        Como experto en soporte técnico, analiza esta solicitud y proporciona:
        1. Categoría del problema (Login, Pago, Bug, Consulta, Configuración, etc.)
        2. Nivel de prioridad (Alto, Medio, Bajo)
        3. Respuesta sugerida profesional y empática
        4. Tiempo estimado de resolución
        5. Tags relevantes

        SOLICITUD:
        Título: ${solicitud.titulo}
        Descripción: ${solicitud.descripcion}

        Responde SOLO en formato JSON válido:
        {
          "categoria": "string",
          "prioridad": "Alto|Medio|Bajo",
          "respuesta_sugerida": "string de máximo 200 palabras",
          "tiempo_estimado": "string como '2-4 horas'",
          "tags": ["tag1", "tag2", "tag3"],
          "confianza": 0.95
        }
      `;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "Eres un experto en soporte técnico que analiza solicitudes de usuarios y proporciona respuestas profesionales y útiles. SIEMPRE responde con JSON válido."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "gemma2-9b-it",
        temperature: 0.3,
        max_tokens: 1000
      });

      const response = completion.choices[0]?.message?.content;
      
      if (response) {
        try {
          // Limpiar respuesta para asegurar JSON válido
          const cleanResponse = response.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleanResponse);
          
          // Validar estructura
          if (parsed.categoria && parsed.prioridad && parsed.respuesta_sugerida) {
            return {
              ...parsed,
              // Asegurar valores válidos
              prioridad: ['Alto', 'Medio', 'Bajo'].includes(parsed.prioridad) ? parsed.prioridad : 'Medio',
              tags: Array.isArray(parsed.tags) ? parsed.tags : ['general'],
              confianza: parsed.confianza || 0.8
            };
          }
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
          console.error('Raw response:', response);
        }
      }

      return this.getFallbackResponse(solicitud);

    } catch (error) {
      console.error('Error en análisis IA:', error);
      return this.getFallbackResponse(solicitud);
    }
  }

  async generarRespuestaPersonalizada(solicitud, contextoAdicional = '') {
    try {
      const prompt = `
        Genera una respuesta profesional y empática para esta solicitud de soporte:
        
        SOLICITUD:
        Título: ${solicitud.titulo}
        Descripción: ${solicitud.descripcion}
        ${contextoAdicional ? `Contexto adicional: ${contextoAdicional}` : ''}

        La respuesta debe ser:
        - Profesional y empática
        - Específica al problema mencionado
        - Con pasos claros si es necesario
        - En español
        - Máximo 200 palabras
        - Dirigida directamente al usuario

        NO incluyas saludos como "Estimado/a" ni despedidas, solo el contenido de la respuesta.
      `;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "Eres un agente de soporte técnico profesional que proporciona respuestas claras, empáticas y útiles a los usuarios. Respondes de manera directa y práctica."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "gemma2-9b-it",
        temperature: 0.7,
        max_tokens: 500
      });

      return completion.choices[0]?.message?.content || this.getFallbackMessage();

    } catch (error) {
      console.error('Error generando respuesta personalizada:', error);
      return this.getFallbackMessage();
    }
  }

  async categorizarSolicitudes(solicitudes) {
    try {
      const resumen = solicitudes.map(s => `${s.id}: ${s.titulo}`).join('\n');
      
      const prompt = `
        Analiza estas solicitudes y proporciona un resumen de categorías:
        
        ${resumen}
        
        Responde con un resumen ejecutivo de máximo 100 palabras sobre los tipos de problemas más comunes.
      `;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "Eres un analista de datos de soporte técnico que identifica patrones en las solicitudes."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "gemma2-9b-it",
        temperature: 0.5,
        max_tokens: 300
      });

      return completion.choices[0]?.message?.content || "Análisis no disponible";

    } catch (error) {
      console.error('Error en categorización masiva:', error);
      return "Error en análisis";
    }
  }

  getFallbackResponse(solicitud) {
    // Categorización básica por palabras clave
    const titulo = solicitud.titulo.toLowerCase();
    const descripcion = solicitud.descripcion.toLowerCase();
    const texto = `${titulo} ${descripcion}`;

    let categoria = "General";
    let prioridad = "Medio";
    let tags = ["general"];

    // Detección de categorías por palabras clave
    if (texto.includes("login") || texto.includes("contraseña") || texto.includes("acceso")) {
      categoria = "Autenticación";
      prioridad = "Alto";
      tags = ["login", "acceso", "seguridad"];
    } else if (texto.includes("pago") || texto.includes("facturación") || texto.includes("dinero")) {
      categoria = "Pagos";
      prioridad = "Alto";
      tags = ["pago", "facturación", "dinero"];
    } else if (texto.includes("error") || texto.includes("bug") || texto.includes("falla")) {
      categoria = "Error Técnico";
      prioridad = "Medio";
      tags = ["error", "bug", "técnico"];
    } else if (texto.includes("cómo") || texto.includes("ayuda") || texto.includes("consulta")) {
      categoria = "Consulta";
      prioridad = "Bajo";
      tags = ["consulta", "ayuda", "información"];
    }

    return {
      categoria,
      prioridad,
      respuesta_sugerida: `Gracias por contactarnos sobre "${solicitud.titulo}". Hemos recibido tu solicitud y nuestro equipo la está revisando. Te proporcionaremos una respuesta detallada lo antes posible.`,
      tiempo_estimado: prioridad === "Alto" ? "2-4 horas" : prioridad === "Medio" ? "24-48 horas" : "2-3 días",
      tags,
      confianza: 0.6,
      fallback: true
    };
  }

  getFallbackMessage() {
    return "Gracias por contactarnos. Hemos recibido tu consulta y nuestro equipo te ayudará a resolverla lo antes posible. Te responderemos con una solución detallada en breve.";
  }

  async testConnection() {
    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: "Hola, esto es una prueba de conexión."
          }
        ],
        model: "gemma2-9b-it",
        max_tokens: 10
      });

      console.log('✅ Conexión con Groq AI exitosa');
      return true;
    } catch (error) {
      console.error('❌ Error conectando con Groq AI:', error);
      return false;
    }
  }

  // Utilidad para obtener emoji de prioridad
  getPriorityEmoji(prioridad) {
    switch (prioridad) {
      case 'Alto': return '🔥';
      case 'Medio': return '⚡';
      case 'Bajo': return '📝';
      default: return '📋';
    }
  }

  // Utilidad para obtener color de prioridad
  getPriorityColor(prioridad) {
    switch (prioridad) {
      case 'Alto': return '#e74c3c';
      case 'Medio': return '#f39c12';
      case 'Bajo': return '#27ae60';
      default: return '#95a5a6';
    }
  }
}

module.exports = new AIService();