"use client"

import { useState, useEffect, useMemo } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
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
  breaks: { start: string; end?: string }[]
  totalHours?: number
}

export default function TimeTrackingPage() {
  const user = useRequireAuth(["employee", "barber"])
  
  const [isWorking, setIsWorking] = useState(false)
  const [currentSession, setCurrentSession] = useState<WorkSession | null>(null)
  const [onBreak, setOnBreak] = useState(false)
  const [workHistory, setWorkHistory] = useState<WorkSession[]>([
    {
      id: "1",
      date: "2024-11-27",
      clockIn: "2024-11-27T09:00:00",
      clockOut: "2024-11-27T18:00:00",
      breaks: [
        { start: "2024-11-27T13:00:00", end: "2024-11-27T14:00:00" }
      ],
      totalHours: 8
    },
    {
      id: "2",
      date: "2024-11-26",
      clockIn: "2024-11-26T09:15:00",
      clockOut: "2024-11-26T17:45:00",
      breaks: [
        { start: "2024-11-26T13:00:00", end: "2024-11-26T13:30:00" }
      ],
      totalHours: 8
    },
    {
      id: "3",
      date: "2024-11-25",
      clockIn: "2024-11-25T09:00:00",
      clockOut: "2024-11-25T18:30:00",
      breaks: [
        { start: "2024-11-25T13:00:00", end: "2024-11-25T14:00:00" }
      ],
      totalHours: 8.5
    }
  ])

  useEffect(() => {
    if (!user) return
    
    // Check if there's an active session
    const savedSession = localStorage.getItem(`work_session_${user.id}`)
    if (savedSession) {
      const session = JSON.parse(savedSession)
      setCurrentSession(session)
      setIsWorking(true)
      
      // Check if on break
      const lastBreak = session.breaks[session.breaks.length - 1]
      if (lastBreak && !lastBreak.end) {
        setOnBreak(true)
      }
    }
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

    return {
      hoursToday: currentSession ? calculateHours(currentSession) : 0,
      hoursWeek: totalHoursWeek,
      hoursMonth: totalHoursMonth,
      avgHours: avgHoursPerDay,
      daysWorked: workHistory.length
    }
  }, [workHistory, currentSession])

  const calculateHours = (session: WorkSession) => {
    const start = new Date(session.clockIn)
    const end = session.clockOut ? new Date(session.clockOut) : new Date()
    let totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
    
    // Subtract break time
    session.breaks.forEach(brk => {
      const breakStart = new Date(brk.start)
      const breakEnd = brk.end ? new Date(brk.end) : new Date()
      const breakMinutes = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60)
      totalMinutes -= breakMinutes
    })
    
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

  const handleClockIn = () => {
    const now = new Date().toISOString()
    const session: WorkSession = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      clockIn: now,
      breaks: []
    }
    
    setCurrentSession(session)
    setIsWorking(true)
    
    if (user) {
      localStorage.setItem(`work_session_${user.id}`, JSON.stringify(session))
    }
  }

  const handleClockOut = () => {
    if (!currentSession) return
    
    const now = new Date().toISOString()
    const updatedSession = {
      ...currentSession,
      clockOut: now,
      totalHours: calculateHours({ ...currentSession, clockOut: now })
    }
    
    setWorkHistory([updatedSession, ...workHistory])
    setCurrentSession(null)
    setIsWorking(false)
    setOnBreak(false)
    
    if (user) {
      localStorage.removeItem(`work_session_${user.id}`)
    }
  }

  const handleStartBreak = () => {
    if (!currentSession) return
    
    const now = new Date().toISOString()
    const updatedSession = {
      ...currentSession,
      breaks: [...currentSession.breaks, { start: now }]
    }
    
    setCurrentSession(updatedSession)
    setOnBreak(true)
    
    if (user) {
      localStorage.setItem(`work_session_${user.id}`, JSON.stringify(updatedSession))
    }
  }

  const handleEndBreak = () => {
    if (!currentSession) return
    
    const now = new Date().toISOString()
    const breaks = [...currentSession.breaks]
    breaks[breaks.length - 1].end = now
    
    const updatedSession = {
      ...currentSession,
      breaks
    }
    
    setCurrentSession(updatedSession)
    setOnBreak(false)
    
    if (user) {
      localStorage.setItem(`work_session_${user.id}`, JSON.stringify(updatedSession))
    }
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
                    {onBreak && currentSession.breaks.length > 0 && (
                      <> • Pausa desde: {formatTime(currentSession.breaks[currentSession.breaks.length - 1].start)}</>
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
                  <p className="text-2xl font-bold">{currentSession.breaks.filter(b => b.end).length}</p>
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
      <div className="grid gap-4 md:grid-cols-4 mb-6">
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
                      {session.breaks.filter(b => b.end).length} pausa{session.breaks.filter(b => b.end).length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                {session.breaks.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Pausas:</p>
                    <div className="flex flex-wrap gap-2">
                      {session.breaks.map((brk, idx) => (
                        <Badge key={idx} variant="outline" className="bg-yellow-50">
                          <Coffee className="h-3 w-3 mr-1" />
                          {formatTime(brk.start)} - {brk.end ? formatTime(brk.end) : 'En curso'}
                        </Badge>
                      ))}
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
