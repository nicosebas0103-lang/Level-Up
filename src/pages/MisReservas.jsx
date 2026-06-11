import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES_NOMBRES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function MisReservas() {
  const [reservas, setReservas] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [mesActual, setMesActual] = useState(new Date().getMonth())
  const [anioActual, setAnioActual] = useState(new Date().getFullYear())
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)

  useEffect(() => {
    cargarReservas()
  }, [])

  async function cargarReservas() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('reservaciones')
      .select('*, clases(*)')
      .eq('usuario_id', user.id)

    // Filtrar solo clases futuras
    const ahora = new Date()
    const soloFuturas = (data || []).filter(r =>
      r.clases && new Date(r.clases.fecha_hora) > ahora
    )
    setReservas(soloFuturas)
  }

  async function cancelar(reservaId) {
    const { error } = await supabase.from('reservaciones').delete().eq('id', reservaId)
    if (error) setMensaje('❌ Error al cancelar')
    else {
      setMensaje('✅ Reserva cancelada')
      setDiaSeleccionado(null)
      cargarReservas()
    }
  }

  function getDiasDelMes() {
    const primerDia = new Date(anioActual, mesActual, 1).getDay()
    const totalDias = new Date(anioActual, mesActual + 1, 0).getDate()
    const dias = []
    for (let i = 0; i < primerDia; i++) dias.push(null)
    for (let i = 1; i <= totalDias; i++) dias.push(i)
    return dias
  }

  function reservasDelDia(dia) {
    if (!dia) return []
    return reservas.filter(r => {
      const fecha = new Date(r.clases?.fecha_hora)
      return fecha.getDate() === dia &&
        fecha.getMonth() === mesActual &&
        fecha.getFullYear() === anioActual
    })
  }

  function mesAnterior() {
    if (mesActual === 0) { setMesActual(11); setAnioActual(a => a - 1) }
    else setMesActual(m => m - 1)
    setDiaSeleccionado(null)
  }

  function mesSiguiente() {
    if (mesActual === 11) { setMesActual(0); setAnioActual(a => a + 1) }
    else setMesActual(m => m + 1)
    setDiaSeleccionado(null)
  }

  const dias = getDiasDelMes()
  const reservasDiaSeleccionado = diaSeleccionado ? reservasDelDia(diaSeleccionado) : []
  const iconos = { 'Spinning': '🚴', 'Yoga': '🧘', 'Funcional': '💪', 'Zumba': '💃' }

  return (
    <div style={{
      minHeight: '100vh', background: '#111111',
      padding: '40px 20px', fontFamily: 'var(--font-cuerpo)'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontFamily: 'var(--font-titulos)', fontWeight: 900,
            fontSize: '32px', color: '#FFFFFF',
            textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px'
          }}>
            Mis <span style={{ color: '#CCFF00' }}>Reservas</span>
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>Gestiona tus clases reservadas</p>
        </div>

        {/* Mensaje */}
        {mensaje && (
          <div style={{
            padding: '14px 20px', borderRadius: '10px', marginBottom: '24px',
            background: mensaje.includes('✅') ? 'rgba(204,255,0,0.1)' : 'rgba(255,100,100,0.1)',
            border: `1px solid ${mensaje.includes('✅') ? '#CCFF00' : '#f87171'}`,
            color: mensaje.includes('✅') ? '#CCFF00' : '#f87171',
            fontWeight: 600, fontSize: '14px'
          }}>{mensaje}</div>
        )}

        {/* CALENDARIO */}
        <div style={{
          background: '#1a1a1a', borderRadius: '16px',
          border: '1px solid #374151', padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '20px'
          }}>
            <button onClick={mesAnterior} style={{
              background: 'transparent', border: '1px solid #374151',
              borderRadius: '8px', padding: '8px 14px',
              color: '#CCFF00', fontSize: '16px', cursor: 'pointer'
            }}>‹</button>

            <h3 style={{
              fontFamily: 'var(--font-titulos)', fontWeight: 900,
              fontSize: '16px', color: '#FFFFFF',
              textTransform: 'uppercase', letterSpacing: '1px', margin: 0
            }}>{MESES_NOMBRES[mesActual]} {anioActual}</h3>

            <button onClick={mesSiguiente} style={{
              background: 'transparent', border: '1px solid #374151',
              borderRadius: '8px', padding: '8px 14px',
              color: '#CCFF00', fontSize: '16px', cursor: 'pointer'
            }}>›</button>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px', marginBottom: '8px'
          }}>
            {DIAS_SEMANA.map(d => (
              <div key={d} style={{
                textAlign: 'center', fontSize: '11px',
                color: '#9ca3af', fontWeight: 700,
                fontFamily: 'var(--font-titulos)',
                textTransform: 'uppercase', padding: '4px 0'
              }}>{d}</div>
            ))}
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px'
          }}>
            {dias.map((dia, i) => {
              const tieneReserva = dia && reservasDelDia(dia).length > 0
              const esSeleccionado = dia === diaSeleccionado
              const esHoy = dia && new Date().getDate() === dia &&
                new Date().getMonth() === mesActual &&
                new Date().getFullYear() === anioActual

              return (
                <div
                  key={i}
                  onClick={() => dia && setDiaSeleccionado(dia === diaSeleccionado ? null : dia)}
                  style={{
                    aspectRatio: '1',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexDirection: 'column',
                    borderRadius: '8px', cursor: dia ? 'pointer' : 'default',
                    position: 'relative',
                    background: esSeleccionado ? '#CCFF00' : tieneReserva ? 'rgba(204,255,0,0.1)' : 'transparent',
                    border: esHoy && !esSeleccionado ? '1px solid #CCFF00' : '1px solid transparent',
                    transition: 'all 0.15s'
                  }}
                >
                  <span style={{
                    fontSize: '13px', fontWeight: esHoy ? 700 : 400,
                    color: esSeleccionado ? '#111111' : dia ? '#FFFFFF' : 'transparent'
                  }}>{dia}</span>
                  {tieneReserva && !esSeleccionado && (
                    <div style={{
                      width: '5px', height: '5px',
                      borderRadius: '50%', background: '#CCFF00',
                      marginTop: '2px'
                    }} />
                  )}
                </div>
              )
            })}
          </div>

          <div style={{
            display: 'flex', gap: '16px', marginTop: '16px',
            paddingTop: '16px', borderTop: '1px solid #374151'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#CCFF00' }} />
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>Tienes clase</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '4px', border: '1px solid #CCFF00' }} />
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>Hoy</span>
            </div>
          </div>
        </div>

        {/* Clases del día seleccionado */}
        {diaSeleccionado && (
          <div style={{
            background: '#1a1a1a', borderRadius: '16px',
            border: '1px solid #CCFF00', padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontFamily: 'var(--font-titulos)', fontWeight: 900,
              fontSize: '14px', color: '#CCFF00',
              textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px'
            }}>
              {diaSeleccionado} de {MESES_NOMBRES[mesActual]}
            </h3>

            {reservasDiaSeleccionado.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>No tienes clases este día</p>
            ) : (
              reservasDiaSeleccionado.map(reserva => (
                <div key={reserva.id} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '14px',
                  background: '#111111', borderRadius: '12px',
                  border: '1px solid #374151', marginBottom: '10px',
                  flexWrap: 'wrap', gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      background: '#CCFF00', borderRadius: '10px',
                      width: '44px', height: '44px',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '22px'
                    }}>
                      {iconos[reserva.clases?.nombre] || '🏃'}
                    </div>
                    <div>
                      <p style={{
                        margin: '0 0 4px', fontWeight: 700,
                        color: '#FFFFFF', fontSize: '14px',
                        fontFamily: 'var(--font-titulos)', textTransform: 'uppercase'
                      }}>{reserva.clases?.nombre}</p>
                      <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>
                        👤 {reserva.clases?.instructor} · 🕐 {new Date(reserva.clases?.fecha_hora).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => cancelar(reserva.id)} style={{
                    padding: '8px 16px', background: 'transparent',
                    color: '#f87171', border: '1.5px solid #f87171',
                    borderRadius: '10px', fontFamily: 'var(--font-titulos)',
                    fontWeight: 700, fontSize: '12px', textTransform: 'uppercase'
                  }}>Cancelar</button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Lista completa */}
        <div style={{
          background: '#1a1a1a', borderRadius: '16px',
          border: '1px solid #374151', padding: '24px'
        }}>
          <h3 style={{
            fontFamily: 'var(--font-titulos)', fontWeight: 900,
            fontSize: '14px', color: '#FFFFFF',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px'
          }}>Todas mis reservas</h3>

          {reservas.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>No tienes reservas activas</p>
            </div>
          )}

          {reservas.map(reserva => (
            <div key={reserva.id} style={{
              background: '#111111', borderRadius: '12px',
              border: '1px solid #374151', overflow: 'hidden',
              display: 'flex', marginBottom: '12px'
            }}>
              <div style={{ width: '4px', background: '#CCFF00', flexShrink: 0 }} />
              <div style={{
                padding: '16px', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
                width: '100%', flexWrap: 'wrap', gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    background: '#CCFF00', borderRadius: '10px',
                    width: '44px', height: '44px',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '22px', flexShrink: 0
                  }}>
                    {iconos[reserva.clases?.nombre] || '🏃'}
                  </div>
                  <div>
                    <p style={{
                      margin: '0 0 4px', fontWeight: 700, color: '#FFFFFF',
                      fontSize: '14px', fontFamily: 'var(--font-titulos)', textTransform: 'uppercase'
                    }}>{reserva.clases?.nombre}</p>
                    <p style={{ margin: '0 0 2px', color: '#9ca3af', fontSize: '12px' }}>
                      👤 {reserva.clases?.instructor}
                    </p>
                    <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>
                      🕐 {new Date(reserva.clases?.fecha_hora).toLocaleString('es-EC')}
                    </p>
                  </div>
                </div>
                <button onClick={() => cancelar(reserva.id)} style={{
                  padding: '8px 16px', background: 'transparent',
                  color: '#f87171', border: '1.5px solid #f87171',
                  borderRadius: '10px', fontFamily: 'var(--font-titulos)',
                  fontWeight: 700, fontSize: '12px', textTransform: 'uppercase'
                }}>Cancelar</button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
