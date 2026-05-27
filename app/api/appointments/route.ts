import { NextResponse } from 'next/server'
import { withRateLimit, strictLimiter } from '@/lib/rate-limit'
import { validateAppointmentInput, sanitizeInput } from '@/lib/validation'
import { isDemoMode } from '@/lib/demo-config'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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

      try {
        const supabase = await createServerSupabaseClient()
        const { data, error } = await supabase
          .from('appointments')
          .insert([appointmentData])
          .select()
          .single()

        if (error) {
          console.error('Error al guardar cita en Supabase:', error.message)
          return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          appointment: data,
          message: 'Cita creada exitosamente'
        })
      } catch (dbError) {
        console.error('Error de conexión con Supabase:', dbError)
        return NextResponse.json(
          { error: 'Error interno del servidor' },
          { status: 500 }
        )
      }

    } catch (error) {
      console.error('Error en /api/appointments:', error)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  })
}
