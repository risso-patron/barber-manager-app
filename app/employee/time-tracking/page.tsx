"use client"

import { useState, useEffect, useMemo } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  LogIn, 
  LogOut, 
  Coffee,
  Calendar,
  TrendingUp,
  DollarSign,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  History
} from "lucide-react"

interface WorkSession {
  id: string
  date: string
  clockIn: string
  clockOut?: string
  breakStart?: string
  breakEnd?: string
  totalHours?: number
}

const calculateBreakHours = (session: WorkSession) => {
  if (!session.breakStart) return 0
  const breakStart = new Date(session.breakStart)
  const breakEnd = session.breakEnd ? new Date(session.breakEnd) : new Date()
  const breakMinutes = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60)
  return Math.max(0, breakMinutes / 60)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseAnonKey ? createBrowserClient(supabaseUrl, supabaseAnonKey) : null

export default function TimeTrackingPage() {
  const user = useRequireAuth(["employee", "admin"])
  
  const [isWorking, setIsWorking] = useState(false)
  const [currentSession, setCurrentSession] = useState<WorkSession | null>(null)
  const [onBreak, setOnBreak] = useState(false)
  const [workHistory, setWorkHistory] = useState<WorkSession[]>([])

  const loadHistory = async (employeeId: string) => {
    if (!supabase) return
    const { data } = await supabase
      .from("time_logs")
      .select("id, date, time_in, time_out, break_start, break_end, total_hours")
      .eq("employee_id", employeeId)
      .not("time_out", "is", null)
      .order("date", { ascending: false })
      .limit(30)
    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setWorkHistory((data as any[]).map(r => ({
        id: r.id,
        date: r.date,
        clockIn: `${r.date}T${r.time_in}`,
        clockOut: r.time_out ? `${r.date}T${r.time_out}` : undefined,
        breakStart: r.break_start ? `${r.date}T${r.break_start}` : undefined,
        breakEnd: r.break_end ? `${r.date}T${r.break_end}` : undefined,
        totalHours: r.total_hours,
      })))
    }
  }

  useEffect(() => {
    if (!user || !supabase) return

    // Check DB for active session today (time_in set, time_out null)
    const today = new Date().toISOString().split('T')[0]
    supabase
      .from("time_logs")
      .select("id, date, time_in, break_start, break_end")
      .eq("employee_id", user.id)
      .eq("date", today)
      .is("time_out", null)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const session: WorkSession = {
            id: data.id,
            date: data.date,
            clockIn: `${data.date}T${data.time_in}`,
            breakStart: data.break_start ? `${data.date}T${data.break_start}` : undefined,
            breakEnd: data.break_end ? `${data.date}T${data.break_end}` : undefined,
          }
          setCurrentSession(session)
          setIsWorking(true)
          setOnBreak(!!data.break_start && !data.break_end)
        }
      })

    loadHistory(user.id)
  }, [user])

  const stats = useMemo(() => {
    const thisWeek = workHistory.filter(session => {
      const sessionDate = new Date(session.date)
      const now = new Date()
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
      return sessionDate >= weekStart
    })

    const totalHoursWeek = thisWeek.reduce((sum, session) => sum + (session.totalHours || 0), 0)
    const totalHoursMonth = workHistory.reduce((sum, session) => sum + (session.totalHours || 0), 0)
    const avgHoursPerDay = workHistory.length > 0 ? totalHoursMonth / workHistory.length : 0
    const breakHoursWeek = thisWeek.reduce((sum, session) => sum + calculateBreakHours(session), 0)
    const breakHoursMonth = workHistory.reduce((sum, session) => sum + calculateBreakHours(session), 0)

    return {
      hoursToday: currentSession ? calculateHours(currentSession) : 0,
      hoursWeek: totalHoursWeek,
      hoursMonth: totalHoursMonth,
      avgHours: avgHoursPerDay,
      daysWorked: workHistory.length,
      breakHoursWeek,
      breakHoursMonth,
    }
  }, [workHistory, currentSession])

  const calculateHours = (session: WorkSession) => {
    const start = new Date(session.clockIn)
    const end = session.clockOut ? new Date(session.clockOut) : new Date()
    let totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
    
    if (session.breakStart) {
      const breakStart = new Date(session.breakStart)
      const breakEnd = session.breakEnd ? new Date(session.breakEnd) : new Date()
      const breakMinutes = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60)
      totalMinutes -= breakMinutes
    }
    
    return Math.max(0, totalMinutes / 60)
  }

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}h ${m}m`
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const handleClockIn = async () => {
    if (!user || !supabase) return
    const now = new Date()
    const dateStr = now.toISOString().substring(0, 10)
    const timeStr = now.toTimeString().split(' ')[0]

    const { data, error } = await supabase
      .from("time_logs")
      .insert({ employee_id: user.id, date: dateStr, time_in: timeStr })
      .select("id")
      .single()

    if (error || !data) return

    const session: WorkSession = {
      id: data.id,
      date: dateStr,
      clockIn: now.toISOString(),
    }
    setCurrentSession(session)
    setIsWorking(true)
  }

  const handleClockOut = async () => {
    if (!currentSession || !user || !supabase) return

    const now = new Date()
    const timeStr = now.toTimeString().split(' ')[0]
    const totalHours = parseFloat(calculateHours({ ...currentSession, clockOut: now.toISOString() }).toFixed(2))

    await supabase
      .from("time_logs")
      .update({ time_out: timeStr, total_hours: totalHours })
      .eq("id", currentSession.id)

    setCurrentSession(null)
    setIsWorking(false)
    setOnBreak(false)
    loadHistory(user.id)
  }

  const handleStartBreak = async () => {
    if (!currentSession || !supabase) return
    const now = new Date()
    const timeStr = now.toTimeString().split(' ')[0]

    await supabase
      .from("time_logs")
      .update({ break_start: timeStr })
      .eq("id", currentSession.id)

    setCurrentSession({ ...currentSession, breakStart: now.toISOString() })
    setOnBreak(true)
  }

  const handleEndBreak = async () => {
    if (!currentSession || !supabase) return

    const now = new Date()
    const timeStr = now.toTimeString().split(' ')[0]

    await supabase
      .from("time_logs")
      .update({ break_end: timeStr })
      .eq("id", currentSession.id)

    setCurrentSession({ ...currentSession, breakEnd: now.toISOString() })
    setOnBreak(false)
  }

  if (!user) return null

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Control de Horario</h1>
        <p className="text-muted-foreground">Registra tu jornada laboral y pausas</p>
      </div>

      {/* Current Status */}
      <Card className={`mb-6 ${isWorking ? (onBreak ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200') : 'bg-gray-50'}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                isWorking ? (onBreak ? 'bg-yellow-500' : 'bg-green-500') : 'bg-gray-300'
              }`}>
                <Clock className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {!isWorking && "No has iniciado jornada"}
                  {isWorking && !onBreak && "Trabajando"}
                  {isWorking && onBreak && "En pausa"}
                </h3>
                {currentSession && (
                  <p className="text-sm text-muted-foreground">
                    Entrada: {formatTime(currentSession.clockIn)}
                    {onBreak && currentSession.breakStart && (
                      <> • Pausa desde: {formatTime(currentSession.breakStart)}</>
                    )}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              {!isWorking ? (
                <Button onClick={handleClockIn} size="lg" className="bg-green-600 hover:bg-green-700">
                  <LogIn className="mr-2 h-5 w-5" />
                  Iniciar Jornada
                </Button>
              ) : (
                <>
                  {!onBreak ? (
                    <Button onClick={handleStartBreak} variant="outline" size="lg">
                      <Coffee className="mr-2 h-5 w-5" />
                      Tomar Pausa
                    </Button>
                  ) : (
                    <Button onClick={handleEndBreak} size="lg" className="bg-blue-600 hover:bg-blue-700">
                      <PlayCircle className="mr-2 h-5 w-5" />
                      Reanudar
                    </Button>
                  )}
                  <Button onClick={handleClockOut} variant="destructive" size="lg">
                    <LogOut className="mr-2 h-5 w-5" />
                    Finalizar Jornada
                  </Button>
                </>
              )}
            </div>
          </div>

          {currentSession && (
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Tiempo Trabajado</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatDuration(calculateHours(currentSession))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pausas Tomadas</p>
                  <p className="text-2xl font-bold">{currentSession.breakStart ? 1 : 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge className={`mt-1 ${onBreak ? 'bg-yellow-500' : 'bg-green-500'}`}>
                    {onBreak ? 'En Pausa' : 'Activo'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.hoursToday)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.hoursWeek)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.hoursMonth)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio/Día</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.avgHours)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pausas (Mes)</CardTitle>
            <PauseCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.breakHoursMonth)}</div>
            <p className="text-xs text-muted-foreground">
              Semana: {formatDuration(stats.breakHoursWeek)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Work History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Jornadas
          </CardTitle>
          <CardDescription>Registro de tus últimas jornadas laborales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workHistory.map((session) => (
              <div key={session.id} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {new Date(session.date).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(session.clockIn)} - {session.clockOut ? formatTime(session.clockOut) : 'En curso'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {formatDuration(session.totalHours || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.breakStart ? '1 pausa' : 'Sin pausas'}
                    </p>
                  </div>
                </div>
                
                {session.breakStart && (
                  <div className="mt-3 rounded-md border border-yellow-200 bg-yellow-50/70 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <PauseCircle className="h-4 w-4 text-yellow-700" />
                        Historial de pausa
                      </p>
                      <Badge variant="outline" className="bg-white text-yellow-800 border-yellow-300">
                        {formatDuration(calculateBreakHours(session))}
                      </Badge>
                    </div>
                    <div className="grid gap-2 md:grid-cols-3 text-sm">
                      <div className="rounded bg-white/80 p-2 border border-yellow-100">
                        <p className="text-xs text-muted-foreground">Inicio</p>
                        <p className="font-medium">{formatTime(session.breakStart)}</p>
                      </div>
                      <div className="rounded bg-white/80 p-2 border border-yellow-100">
                        <p className="text-xs text-muted-foreground">Fin</p>
                        <p className="font-medium">{session.breakEnd ? formatTime(session.breakEnd) : 'En curso'}</p>
                      </div>
                      <div className="rounded bg-white/80 p-2 border border-yellow-100">
                        <p className="text-xs text-muted-foreground">Duración</p>
                        <p className="font-medium">{formatDuration(calculateBreakHours(session))}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
