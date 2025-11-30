import { NextResponse } from 'next/server'
import { withRateLimit, strictLimiter } from '@/lib/rate-limit'
import { validateAppointmentInput, sanitizeInput } from '@/lib/validation'
import { isDemoMode } from '@/lib/demo-config'

export async function POST(request: Request) {
  return withRateLimit(request, strictLimiter, async () => {
    try {
      const body = await request.json()

      // Validación completa del input
      const validation = validateAppointmentInput(body)
      
      if (!validation.valid) {
        return NextResponse.json(
          { 
            error: 'Datos inválidos',
            details: validation.errors 
          },
          { status: 400 }
        )
      }

      const appointmentData = validation.data!

      // MODO DEMO - Simulación
      if (isDemoMode()) {
        const mockAppointment = {
          id: `apt_${Date.now()}`,
          ...appointmentData,
          status: 'pending',
          createdAt: new Date().toISOString(),
        }

        // Simular guardado
        console.log('📅 [DEMO] Nueva cita creada:', mockAppointment)

        return NextResponse.json({
          success: true,
          appointment: mockAppointment,
          message: 'Cita creada exitosamente (modo demo)'
        })
      }

      // TODO: Implementar creación real con Supabase
      // const { data, error } = await supabase
      //   .from('appointments')
      //   .insert([appointmentData])
      //   .select()
      
      return NextResponse.json(
        { error: 'Creación de citas no implementada en producción' },
        { status: 501 }
      )

    } catch (error) {
      console.error('Error en /api/appointments:', error)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  })
}
