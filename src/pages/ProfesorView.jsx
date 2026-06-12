import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../supabaseClient'

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES_NOMBRES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function ProfesorView({ session }) {
  const [clases, setClases] = useState([])
  const [registros, setRegistros] = useState([])
  const [nombreProfesor, setNombreProfesor] = useState('')
  const [mesActual, setMesActual] = useState(new Date().getMonth())
  const [anioActual, setAnioActual] = useState(new Date().getFullYear())
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)
  const [seccion, setSeccion] = useState('clases')
  const [claseDetalle, setClaseDetalle] = useState(null)
  const [usuariosClase, setUsuariosClase] = useState([])
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [form, setForm] = useState({ nombre: '', fecha_hora: '', capacidad_max: '' })

  const email = session.user.email
  const qrData = JSON.stringify({ tipo: 'profesor', email, usuario_id: session.user.id })

  useEffect(() => {
    cargarClases()
    cargarRegistros()
    cargarNombre()
  }, [])

  async function cargarNombre() {
    const { data } = await supabase
      .from('profesores')
      .select('nombre')
      .eq('email', email)
      .single()
    if (data) setNombreProfesor(data.nombre)
  }

  async function cargarClases() {
    const { data } = await supabase
      .from('clases')
      .select('*')
      .eq('instructor', email)
      .order('fecha_hora')
    setClases(data || [])
  }

  async function cargarRegistros() {
    const { data } = await supabase
      .from('registros_profesores')
      .select('*')
      .eq('profesor_email', email)
      .order('fecha', { ascending: false })
      .limit(20)
    setRegistros(data || [])
  }

  async function crearClase() {
    if (!form.nombre || !form.fecha_hora || !form.capacidad_max) {
      setMensaje('⚠️ Completa todos los campos')
      return
    }
    const { error } = await supabase.from('clases').insert({
      nombre: form.nombre,
      instructor: email,
      fecha_hora: form.fecha_hora,
      capacidad_max: parseInt(form.capacidad_max)
    })
    if (error) setMensaje('❌ Error al crear clase')
    else {
      setMensaje('✅ Clase creada exitosamente')
      setForm({ nombre: '', fecha_hora: '', capacidad_max: '' })
      cargarClases()
    }
  }

  async function eliminarClase(id) {
    if (!window.confirm('¿Eliminar esta clase?')) return
    const { error } = await supabase.from('clases').delete().eq('id', id)
    if (error) setMensaje('❌ Error al eliminar')
    else { setMensaje('✅ Clase eliminada'); cargarClases() }
  }

  async function verUsuarios(clase) {
    setClaseDetalle(clase)
    setCargandoUsuarios(true)
    const { data } = await supabase
      .from('reservaciones')
      .select('*')
      .eq('clase_id', clase.id)
    setUsuariosClase(data || [])
    setCargandoUsuarios(false)
  }

  function getDiasDelMes() {
    const primerDia = new Date(anioActual, mesActual, 1).getDay()
    const totalDias = new Date(anioActual, mesActual + 1, 0).getDate()
    const dias = []
    for (let i = 0; i < primerDia; i++) dias.push(null)
    for (let i = 1; i <= totalDias; i++) dias.push(i)
    return dias
  }

  function clasesDelDia(dia) {
    if (!dia) return []
    return clases.filter(c => {
      const fecha = new Date(c.fecha_hora)
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
  const clasesDiaSeleccionado = diaSeleccionado ? clasesDelDia(diaSeleccionado) : []
  const ahora = new Date()
  const clasesFuturas = clases.filter(c => new Date(c.fecha_hora) > ahora)
  const clasesPasadas = clases.filter(c => new Date(c.fecha_hora) <= ahora)

  const inputStyle = {
    width: '100%', padding: '13px 16px', marginBottom: '12px',
    background: '#111111', border: '1.5px solid #374151',
    borderRadius: '10px', fontSize: '14px', color: '#FFFFFF',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-cuerpo)'
  }

  const tabStyle = (tab) => ({
    padding: '10px 20px', borderRadius: '10px',
    cursor: 'pointer', fontWeight: 700, fontSize: '12px',
    fontFamily: 'var(--font-titulos)', textTransform: 'uppercase', letterSpacing: '1px',
    background: seccion === tab ? '#CCFF00' : '#1a1a1a',
    color: seccion === tab ? '#111111' : '#9ca3af',
    border: seccion === tab ? 'none' : '1px solid #374151'
  })

  return (
    <div style={{ minHeight: '100vh', background: '#111111', padding: '40px 20px', fontFamily: 'var(--font-cuerpo)' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '32px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
            Portal <span style={{ color: '#CCFF00' }}>Entrenador</span>
          </h2>
          <p style={{ color: '#CCFF00', fontSize: '20px', fontFamily: 'var(--font-titulos)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px' }}>
            Hola, {nombreProfesor || 'Entrenador'} 👋
          </p>
          <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>{email}</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <button onClick={() => setSeccion('clases')} style={tabStyle('clases')}>🏃 Mis clases</button>
          <button onClick={() => setSeccion('calendario')} style={tabStyle('calendario')}>📅 Calendario</button>
          <button onClick={() => setSeccion('qr')} style={tabStyle('qr')}>📷 Mi QR</button>
          <button onClick={() => setSeccion('historial')} style={tabStyle('historial')}>🕐 Historial</button>
        </div>

        {/* CLASES */}
        {seccion === 'clases' && (
          <>
            {/* Crear clase */}
            <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '30px', marginBottom: '24px', border: '1px solid #374151' }}>
              <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '16px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>➕ Crear nueva clase</h3>
              <input
                placeholder="Nombre de la clase (ej: Spinning, Yoga...)"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                style={inputStyle}
              />
              <input
                type="datetime-local"
                value={form.fecha_hora}
                onChange={e => setForm({ ...form, fecha_hora: e.target.value })}
                style={inputStyle}
              />
              <input
                placeholder="Capacidad máxima de personas"
                type="number"
                value={form.capacidad_max}
                onChange={e => setForm({ ...form, capacidad_max: e.target.value })}
                style={inputStyle}
              />
              <button onClick={crearClase} style={{
                width: '100%', padding: '14px',
                background: '#CCFF00', color: '#111111',
                border: 'none', borderRadius: '10px',
                fontFamily: 'var(--font-titulos)', fontWeight: 700,
                fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px',
                cursor: 'pointer'
              }}>Crear clase</button>
              {mensaje && (
                <p style={{
                  marginTop: '16px', padding: '12px', borderRadius: '8px',
                  background: mensaje.includes('✅') ? 'rgba(204,255,0,0.1)' : 'rgba(255,100,100,0.1)',
                  border: `1px solid ${mensaje.includes('✅') ? '#CCFF00' : '#f87171'}`,
                  color: mensaje.includes('✅') ? '#CCFF00' : '#f87171',
                  textAlign: 'center', fontSize: '13px', fontWeight: 600
                }}>{mensaje}</p>
              )}
            </div>

            {/* Clases próximas */}
            <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '24px', marginBottom: '20px', border: '1px solid #374151' }}>
              <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '14px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                📅 Próximas clases <span style={{ color: '#CCFF00' }}>({clasesFuturas.length})</span>
              </h3>
              {clasesFuturas.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                  <p style={{ color: '#9ca3af', fontSize: '14px' }}>No tienes clases próximas</p>
                </div>
              )}
              {clasesFuturas.map(clase => (
                <div key={clase.id} style={{ padding: '16px', marginBottom: '10px', background: '#111111', borderRadius: '12px', border: '1px solid #374151' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#FFFFFF', fontSize: '14px', fontFamily: 'var(--font-titulos)', textTransform: 'uppercase' }}>{clase.nombre}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                        🕐 {new Date(clase.fecha_hora).toLocaleString('es-EC')} · 👥 {clase.capacidad_max} cupos
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => verUsuarios(clase)} style={{
                        padding: '8px 14px', background: 'rgba(204,255,0,0.1)',
                        color: '#CCFF00', border: '1.5px solid #CCFF00',
                        borderRadius: '8px', fontFamily: 'var(--font-titulos)',
                        fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer'
                      }}>👥 Ver inscritos</button>
                      <button onClick={() => eliminarClase(clase.id)} style={{
                        padding: '8px 14px', background: 'transparent',
                        color: '#f87171', border: '1.5px solid #f87171',
                        borderRadius: '8px', fontFamily: 'var(--font-titulos)',
                        fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer'
                      }}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Clases pasadas */}
            {clasesPasadas.length > 0 && (
              <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '24px', border: '1px solid #374151' }}>
                <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '14px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                  📋 Clases pasadas ({clasesPasadas.length})
                </h3>
                {clasesPasadas.slice(0, 5).map(clase => (
                  <div key={clase.id} style={{ padding: '14px', marginBottom: '8px', background: '#111111', borderRadius: '12px', border: '1px solid #374151', opacity: 0.6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <p style={{ margin: '0 0 3px', fontWeight: 700, color: '#9ca3af', fontSize: '13px', fontFamily: 'var(--font-titulos)', textTransform: 'uppercase' }}>{clase.nombre}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#374151' }}>🕐 {new Date(clase.fecha_hora).toLocaleString('es-EC')}</p>
                      </div>
                      <button onClick={() => verUsuarios(clase)} style={{
                        padding: '6px 12px', background: 'transparent',
                        color: '#9ca3af', border: '1px solid #374151',
                        borderRadius: '8px', fontFamily: 'var(--font-titulos)',
                        fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer'
                      }}>👥 Ver inscritos</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modal usuarios */}
            {claseDetalle && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ background: '#1a1a1a', borderRadius: '20px', border: '1px solid #374151', padding: '30px', width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '18px', color: '#CCFF00', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 6px' }}>{claseDetalle.nombre}</h3>
                      <p style={{ margin: 0, color: '#9ca3af', fontSize: '13px' }}>🕐 {new Date(claseDetalle.fecha_hora).toLocaleString('es-EC')} · 👥 {claseDetalle.capacidad_max} cupos</p>
                    </div>
                    <button onClick={() => { setClaseDetalle(null); setUsuariosClase([]) }} style={{ background: 'transparent', border: '1px solid #374151', borderRadius: '8px', padding: '6px 12px', color: '#9ca3af', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ background: '#111111', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid #374151' }}>
                      <p style={{ margin: '0 0 4px', color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'var(--font-titulos)' }}>Inscritos</p>
                      <p style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: '#CCFF00', fontFamily: 'var(--font-titulos)' }}>{usuariosClase.length}</p>
                    </div>
                    <div style={{ background: '#111111', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid #374151' }}>
                      <p style={{ margin: '0 0 4px', color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'var(--font-titulos)' }}>Cupos libres</p>
                      <p style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: claseDetalle.capacidad_max - usuariosClase.length <= 0 ? '#f87171' : '#CCFF00', fontFamily: 'var(--font-titulos)' }}>
                        {Math.max(0, claseDetalle.capacidad_max - usuariosClase.length)}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>Ocupación</span>
                      <span style={{ color: '#CCFF00', fontSize: '12px', fontWeight: 700 }}>{Math.round((usuariosClase.length / claseDetalle.capacidad_max) * 100)}%</span>
                    </div>
                    <div style={{ background: '#374151', borderRadius: '4px', height: '6px' }}>
                      <div style={{ height: '6px', borderRadius: '4px', width: `${Math.min(100, (usuariosClase.length / claseDetalle.capacidad_max) * 100)}%`, background: usuariosClase.length >= claseDetalle.capacidad_max ? '#f87171' : '#CCFF00', transition: 'width 0.3s' }} />
                    </div>
                  </div>

                  <h4 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '13px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Personas inscritas</h4>
                  {cargandoUsuarios && <p style={{ color: '#9ca3af', fontSize: '14px' }}>Cargando...</p>}
                  {!cargandoUsuarios && usuariosClase.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>👻</div>
                      <p style={{ color: '#9ca3af', fontSize: '14px' }}>Nadie inscrito aún</p>
                    </div>
                  )}
                  {usuariosClase.map((reserva, i) => (
                    <div key={reserva.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#111111', borderRadius: '10px', marginBottom: '8px', border: '1px solid #374151' }}>
                      <div style={{ background: '#CCFF00', borderRadius: '50%', width: '36px', height: '36px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '14px', color: '#111111' }}>{i + 1}</div>
                      <div>
                        <p style={{ margin: '0 0 3px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}>{reserva.email || 'Usuario'}</p>
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: '11px' }}>Reservó el {new Date(reserva.fecha_reserva).toLocaleDateString('es-EC')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* CALENDARIO */}
        {seccion === 'calendario' && (
          <>
            <div style={{ background: '#1a1a1a', borderRadius: '16px', border: '1px solid #374151', padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <button onClick={mesAnterior} style={{ background: 'transparent', border: '1px solid #374151', borderRadius: '8px', padding: '8px 14px', color: '#CCFF00', fontSize: '16px', cursor: 'pointer' }}>‹</button>
                <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '16px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                  {MESES_NOMBRES[mesActual]} {anioActual}
                </h3>
                <button onClick={mesSiguiente} style={{ background: 'transparent', border: '1px solid #374151', borderRadius: '8px', padding: '8px 14px', color: '#CCFF00', fontSize: '16px', cursor: 'pointer' }}>›</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                {DIAS_SEMANA.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', fontWeight: 700, fontFamily: 'var(--font-titulos)', textTransform: 'uppercase', padding: '4px 0' }}>{d}</div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {dias.map((dia, i) => {
                  const tieneClase = dia && clasesDelDia(dia).length > 0
                  const esSeleccionado = dia === diaSeleccionado
                  const esHoy = dia && new Date().getDate() === dia && new Date().getMonth() === mesActual && new Date().getFullYear() === anioActual
                  return (
                    <div key={i} onClick={() => dia && setDiaSeleccionado(dia === diaSeleccionado ? null : dia)} style={{
                      aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                      borderRadius: '8px', cursor: dia ? 'pointer' : 'default',
                      background: esSeleccionado ? '#CCFF00' : tieneClase ? 'rgba(204,255,0,0.1)' : 'transparent',
                      border: esHoy && !esSeleccionado ? '1px solid #CCFF00' : '1px solid transparent',
                      transition: 'all 0.15s'
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: esHoy ? 700 : 400, color: esSeleccionado ? '#111111' : dia ? '#FFFFFF' : 'transparent' }}>{dia}</span>
                      {tieneClase && !esSeleccionado && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#CCFF00', marginTop: '2px' }} />}
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #374151' }}>
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

            {diaSeleccionado && (
              <div style={{ background: '#1a1a1a', borderRadius: '16px', border: '1px solid #CCFF00', padding: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '14px', color: '#CCFF00', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                  {diaSeleccionado} de {MESES_NOMBRES[mesActual]}
                </h3>
                {clasesDiaSeleccionado.length === 0 ? (
                  <p style={{ color: '#9ca3af', fontSize: '14px' }}>No tienes clases este día</p>
                ) : (
                  clasesDiaSeleccionado.map(clase => (
                    <div key={clase.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: '#111111', borderRadius: '12px', border: '1px solid #374151', marginBottom: '10px' }}>
                      <div style={{ background: '#CCFF00', borderRadius: '10px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🏋️</div>
                      <div>
                        <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#FFFFFF', fontSize: '14px', fontFamily: 'var(--font-titulos)', textTransform: 'uppercase' }}>{clase.nombre}</p>
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>
                          🕐 {new Date(clase.fecha_hora).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })} · 👥 {clase.capacidad_max} cupos
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {/* QR */}
        {seccion === 'qr' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div style={{ background: '#1a1a1a', borderRadius: '16px', border: '1px solid #374151', padding: '30px', width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '14px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                Tu QR de asistencia
              </h3>
              <div style={{ background: 'white', padding: '16px', borderRadius: '12px' }}>
                <QRCodeSVG value={qrData} size={200} bgColor="#ffffff" fgColor="#111111" level="H" />
              </div>
              <p style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center', margin: 0 }}>{email}</p>
            </div>
            <div style={{ background: '#1a1a1a', borderRadius: '16px', border: '1px solid #374151', padding: '24px', width: '100%', maxWidth: '360px' }}>
              <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', lineHeight: '1.6', margin: 0 }}>
                Muestra este QR al administrador al <span style={{ color: '#CCFF00', fontWeight: 700 }}>entrar</span> y al <span style={{ color: '#CCFF00', fontWeight: 700 }}>salir</span> del gimnasio.
              </p>
            </div>
          </div>
        )}

        {/* HISTORIAL */}
        {seccion === 'historial' && (
          <div style={{ background: '#1a1a1a', borderRadius: '16px', border: '1px solid #374151', padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '14px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
              🕐 Mis registros de entrada/salida
            </h3>
            {registros.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>📭</div>
                <p style={{ color: '#9ca3af', fontSize: '14px' }}>No hay registros aún</p>
              </div>
            )}
            {registros.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#111111', borderRadius: '12px', border: '1px solid #374151', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: r.tipo === 'entrada' ? 'rgba(204,255,0,0.15)' : 'rgba(248,113,113,0.15)', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    {r.tipo === 'entrada' ? '🟢' : '🔴'}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 3px', color: '#FFFFFF', fontWeight: 600, fontSize: '14px', textTransform: 'capitalize' }}>{r.tipo}</p>
                    <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>
                      {new Date(r.fecha).toLocaleDateString('es-EC')} · {new Date(r.fecha).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span style={{ background: r.tipo === 'entrada' ? 'rgba(204,255,0,0.1)' : 'rgba(248,113,113,0.1)', color: r.tipo === 'entrada' ? '#CCFF00' : '#f87171', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-titulos)', textTransform: 'uppercase' }}>
                  {r.tipo}
                </span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
