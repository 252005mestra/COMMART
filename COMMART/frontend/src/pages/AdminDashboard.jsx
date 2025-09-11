import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart // AGREGAR ESTA LÍNEA
} from 'recharts';
import { 
  BarChart3, ShoppingCart, DollarSign, Target, TrendingUp, Users, Palette, Package, Star, 
  Menu, Calendar, Eye, Activity, Award, User, Settings
} from 'lucide-react';
import '../styles/adminDashboard.css';

// Import TODOS los datos completos
import {
  muestrasPorDia, muestrasPorSemana, muestrasPorMes, muestrasPorAño,
  ventasPorDia, ventasPorSemana, ventasPorMes, ventasPorAño,
  ingresosPorDia, ingresosPorSemana, ingresosPorMes, ingresosPorAño,
  visitasPorDia, visitasPorSemana, visitasPorMes, visitasPorAño,
  distribucionVentas,
  artistasMasVistos,
  muestrasSubidasPorArtistas,
  pedidosPendientes
} from '../data/dummyData';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('Vista General');
  
  // Estados para los selectores de tiempo
  const [muestrasTimePeriod, setMuestrasTimePeriod] = useState('mes');
  const [ventasTimePeriod, setVentasTimePeriod] = useState('mes');
  const [ingresosTimePeriod, setIngresosTimePeriod] = useState('mes');
  const [visitasTimePeriod, setVisitasTimePeriod] = useState('mes');

  const sidebarItems = [
    { name: 'Vista General', icon: BarChart3 },
    { name: 'Pedidos', icon: ShoppingCart },
    { name: 'Comisiones', icon: DollarSign },
    { name: 'Paquetes', icon: Target },
    { name: 'Tráfico Web', icon: TrendingUp },
    { name: 'Usuarios', icon: Users },
    { name: 'Artistas', icon: Palette },
    { name: 'Gestión', icon: Package },
    { name: 'Crear Plan Premium', icon: Star }
  ];

  // Función para obtener datos según el período seleccionado
  const getDataByPeriod = (type, period) => {
    const dataMap = {
      muestras: {
        dia: muestrasPorDia,
        semana: muestrasPorSemana,
        mes: muestrasPorMes,
        año: muestrasPorAño
      },
      ventas: {
        dia: ventasPorDia,
        semana: ventasPorSemana,
        mes: ventasPorMes,
        año: ventasPorAño
      },
      ingresos: {
        dia: ingresosPorDia,
        semana: ingresosPorSemana,
        mes: ingresosPorMes,
        año: ingresosPorAño
      },
      visitas: {
        dia: visitasPorDia,
        semana: visitasPorSemana,
        mes: visitasPorMes,
        año: visitasPorAño
      }
    };
    return dataMap[type][period] || [];
  };

  const topArtists = [
    { name: 'Sofia_Art', samples: 45, avatar: '/default-artist.jpg' },
    { name: 'Mateo_Design', samples: 38, avatar: '/default-artist.jpg' },
    { name: 'Valentina_Draw', samples: 32, avatar: '/default-artist.jpg' },
    { name: 'Andres_Paint', samples: 29, avatar: '/default-artist.jpg' },
    { name: 'Luisa_Create', samples: 24, avatar: '/default-artist.jpg' }
  ];

  const recentSamples = muestrasSubidasPorArtistas.slice(0, 4);
  const recentOrders = pedidosPendientes.slice(0, 5).map(order => ({
    id: order.id,
    client: order.cliente,
    artist: order.muestra,
    amount: parseInt(order.total.replace(',', '')),
    status: order.estado.toLowerCase(),
    date: order.fecha
  }));

  // Colores para el pie chart
  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  // Función para mapear estados a clases CSS
  const getStatusClass = (estado) => {
    const statusMap = {
      'Completado': 'completed',
      'En Proceso': 'in_progress', 
      'Pendiente': 'pending',
      'Rechazado': 'rejected',
      'Cancelado': 'cancelled'
    };
    
    return statusMap[estado] || '';
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'Vista General':
        return (
          <section className="admindash-overview-section">
            {/* Stats Cards - CON CONTEXTO CORRECTO */}
            <div className="admindash-indicators-grid">
              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Paquetes Creados</h3>
                    <div className="admindash-indicator-value">2,847</div>
                    <div className="admindash-indicator-change">+12% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon users-icon">
                    <Package size={20} />
                  </div>
                </div>
              </div>

              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Pedidos Realizados</h3>
                    <div className="admindash-indicator-value">1,432</div>
                    <div className="admindash-indicator-change">+18% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon artists-icon">
                    <ShoppingCart size={20} />
                  </div>
                </div>
              </div>

              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Ganancia COMMART</h3>
                    <div className="admindash-indicator-value">$17,187,500</div>
                    <div className="admindash-indicator-change">+25% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon orders-icon">
                    <DollarSign size={20} />
                  </div>
                </div>
              </div>

              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Visitas Web</h3>
                    <div className="admindash-indicator-value">180,000</div>
                    <div className="admindash-indicator-change">+23% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon revenue-icon">
                    <Eye size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts - CON CONTEXTO CORRECTO */}
            <div className="admindash-overview-charts-grid">
              <div className="admindash-chart-card">
                <div className="admindash-chart-header">
                  <h3 className="admindash-chart-title">Paquetes creados por {muestrasTimePeriod}</h3>
                  <select 
                    className="admindash-time-selector"
                    value={muestrasTimePeriod}
                    onChange={(e) => setMuestrasTimePeriod(e.target.value)}
                  >
                    <option value="dia">Día</option>
                    <option value="semana">Semana</option>
                    <option value="mes">Mes</option>
                    <option value="año">Año</option>
                  </select>
                </div>
                <div className="admindash-chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getDataByPeriod('muestras', muestrasTimePeriod)}>
                      <defs>
                        <linearGradient id="colorPaquetes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="total" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorPaquetes)" name="Total Paquetes" />
                      <Area type="monotone" dataKey="vendidas" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Paquetes Vendidos" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="admindash-chart-card">
                <div className="admindash-chart-header">
                  <h3 className="admindash-chart-title">Pedidos realizados por {ventasTimePeriod}</h3>
                  <select 
                    className="admindash-time-selector"
                    value={ventasTimePeriod}
                    onChange={(e) => setVentasTimePeriod(e.target.value)}
                  >
                    <option value="dia">Día</option>
                    <option value="semana">Semana</option>
                    <option value="mes">Mes</option>
                    <option value="año">Año</option>
                  </select>
                </div>
                <div className="admindash-chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getDataByPeriod('ventas', ventasTimePeriod)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="ventas" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} name="Pedidos" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="admindash-chart-card">
                <div className="admindash-chart-header">
                  <h3 className="admindash-chart-title">Ingresos COMMART por {ingresosTimePeriod}</h3>
                  <select 
                    className="admindash-time-selector"
                    value={ingresosTimePeriod}
                    onChange={(e) => setIngresosTimePeriod(e.target.value)}
                  >
                    <option value="dia">Día</option>
                    <option value="semana">Semana</option>
                    <option value="mes">Mes</option>
                    <option value="año">Año</option>
                  </select>
                </div>
                <div className="admindash-chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getDataByPeriod('ingresos', ingresosTimePeriod)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="gastos" fill="#ef4444" name="Pagos a Artistas" />
                      <Bar dataKey="ingreso" fill="#10b981" name="Ganancia COMMART" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="admindash-chart-card">
                <div className="admindash-chart-header">
                  <h3 className="admindash-chart-title">Tráfico Web por {visitasTimePeriod}</h3>
                  <select 
                    className="admindash-time-selector"
                    value={visitasTimePeriod}
                    onChange={(e) => setVisitasTimePeriod(e.target.value)}
                  >
                    <option value="dia">Día</option>
                    <option value="semana">Semana</option>
                    <option value="mes">Mes</option>
                    <option value="año">Año</option>
                  </select>
                </div>
                <div className="admindash-chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getDataByPeriod('visitas', visitasTimePeriod)}>
                      <defs>
                        <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSesiones" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="visitas" stackId="1" stroke="#f59e0b" fill="url(#colorVisitas)" name="Visitas" />
                      <Area type="monotone" dataKey="sesiones" stackId="1" stroke="#8b5cf6" fill="url(#colorSesiones)" name="Sesiones" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Bottom Section - Distribución + Info */}
            <div className="admindash-overview-bottom-grid">
              <div className="admindash-info-card">
                <h3 className="admindash-info-card-title">Distribución por Estilos de Dibujo</h3>
                <div className="admindash-chart-wrapper small">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribucionVentas}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {distribucionVentas.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="admindash-info-card">
                <h3 className="admindash-info-card-title">Top Artistas (por pedidos)</h3>
                <ul className="admindash-artists-list">
                  {artistasMasVistos.slice(0, 5).map((artist) => (
                    <li key={artist.id} className="admindash-artist-item">
                      <img src={artist.avatar} alt={artist.name} className="admindash-artist-avatar" />
                      <div className="admindash-artist-info">
                        <p className="admindash-artist-name">{artist.name}</p>
                        <p className="admindash-artist-views">{artist.views} pedidos</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="admindash-info-card">
                <h3 className="admindash-info-card-title">Paquetes recientes</h3>
                <div className="admindash-samples-grid">
                  {recentSamples.map((sample) => (
                    <div key={sample.id} className="admindash-sample-card">
                      <img src={sample.image} alt={sample.title} className="admindash-sample-image" />
                      <div className="admindash-sample-info">
                        <h4 className="admindash-sample-title">{sample.title}</h4>
                        <p className="admindash-sample-artist">por <span className="admindash-artist-highlight">{sample.artist}</span></p>
                        <p className="admindash-sample-date">{new Date(sample.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Orders Table - CON CONTEXTO CORRECTO */}
            <div className="admindash-orders-card">
              <h3 className="admindash-orders-title">Pedidos recientes</h3>
              <div className="admindash-orders-table-container">
                <table className="admindash-orders-table">
                  <thead className="admindash-orders-thead">
                    <tr>
                      <th className="admindash-orders-th">ID</th>
                      <th className="admindash-orders-th">Cliente</th>
                      <th className="admindash-orders-th">Artista</th>
                      <th className="admindash-orders-th">Paquete</th>
                      <th className="admindash-orders-th">Total</th>
                      <th className="admindash-orders-th">Comisión COMMART</th>
                      <th className="admindash-orders-th">Estado</th>
                      <th className="admindash-orders-th">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidosPendientes.slice(0, 8).map((order) => {
                      const totalAmount = parseInt(order.total.replace(',', ''));
                      const commission = Math.round(totalAmount * 0.25); // 25% de comisión
                      
                      return (
                        <tr key={order.id} className="admindash-orders-tr">
                          <td className="admindash-orders-td">
                            <span className="admindash-order-id">{order.id}</span>
                          </td>
                          <td className="admindash-orders-td">{order.cliente}</td>
                          <td className="admindash-orders-td">{order.artista || 'Sofia_Art'}</td>
                          <td className="admindash-orders-td">{order.muestra}</td>
                          <td className="admindash-orders-td">${order.total}</td>
                          <td className="admindash-orders-td">
                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                              ${commission.toLocaleString()}
                            </span>
                          </td>
                          <td className="admindash-orders-td">
                          <span className={`admindash-order-status ${getStatusClass(order.estado)}`}>
                            {order.estado}
                          </span>
                        </td>
                          <td className="admindash-orders-td">{order.fecha}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        );

      // Otras secciones actualizadas
      case 'Paquetes':
        return (
          <section className="admindash-section-content">
            <h2 className="admindash-section-title">Análisis Detallado de Paquetes</h2>
            
            {/* Métricas específicas de paquetes */}
            <div className="admindash-indicators-grid">
              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Total Paquetes</h3>
                    <div className="admindash-indicator-value">2,847</div>
                    <div className="admindash-indicator-change">+12% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon">
                    <Package size={20} />
                  </div>
                </div>
              </div>

              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Paquetes Vendidos</h3>
                    <div className="admindash-indicator-value">1,432</div>
                    <div className="admindash-indicator-change">+18% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon">
                    <ShoppingCart size={20} />
                  </div>
                </div>
              </div>

              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Tasa de Conversión</h3>
                    <div className="admindash-indicator-value">50.3%</div>
                    <div className="admindash-indicator-change">+5% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon">
                    <TrendingUp size={20} />
                  </div>
                </div>
              </div>

              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Precio Promedio</h3>
                    <div className="admindash-indicator-value">$180,000</div>
                    <div className="admindash-indicator-change">+8% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon">
                    <DollarSign size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico principal de paquetes */}
            <div className="admindash-charts-full-grid">
              <div className="admindash-chart-card large">
                <div className="admindash-chart-header">
                  <h3 className="admindash-chart-title">Análisis de Paquetes por {muestrasTimePeriod}</h3>
                  <select 
                    className="admindash-time-selector"
                    value={muestrasTimePeriod}
                    onChange={(e) => setMuestrasTimePeriod(e.target.value)}
                  >
                    <option value="dia">Día</option>
                    <option value="semana">Semana</option>
                    <option value="mes">Mes</option>
                    <option value="año">Año</option>
                  </select>
                </div>
                <div className="admindash-chart-wrapper large">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={getDataByPeriod('muestras', muestrasTimePeriod)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" fill="#8b5cf6" name="Paquetes Creados" />
                      <Bar dataKey="vendidas" fill="#10b981" name="Paquetes Vendidos" />
                      <Line type="monotone" dataKey="vendidas" stroke="#3b82f6" strokeWidth={3} name="Tendencia Ventas" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Análisis adicional */}
            <div className="admindash-overview-charts-grid">
              <div className="admindash-chart-card">
                <div className="admindash-chart-header">
                  <h3 className="admindash-chart-title">Distribución por Estilos</h3>
                </div>
                <div className="admindash-chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribucionVentas}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {distribucionVentas.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="admindash-chart-card">
                <div className="admindash-chart-header">
                  <h3 className="admindash-chart-title">Rendimiento de Paquetes</h3>
                </div>
                <div className="admindash-chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getDataByPeriod('muestras', muestrasTimePeriod)}>
                      <defs>
                        <linearGradient id="colorConversion" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="vendidas" 
                        stroke="#10b981" 
                        fill="url(#colorConversion)" 
                        name="Tasa de Conversión"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        );

      case 'Pedidos':
        return (
          <section className="admindash-section-content">
            <h2 className="admindash-section-title">Análisis Detallado de Pedidos</h2>
            
            {/* Métricas específicas de pedidos */}
            <div className="admindash-indicators-grid">
              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Pedidos Totales</h3>
                    <div className="admindash-indicator-value">1,432</div>
                    <div className="admindash-indicator-change">+18% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon">
                    <ShoppingCart size={20} />
                  </div>
                </div>
              </div>

              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Pedidos Completados</h3>
                    <div className="admindash-indicator-value">1,127</div>
                    <div className="admindash-indicator-change">+15% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon">
                    <Award size={20} />
                  </div>
                </div>
              </div>

              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Tiempo Promedio</h3>
                    <div className="admindash-indicator-value">5.2 días</div>
                    <div className="admindash-indicator-change">-0.8 días vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon">
                    <Activity size={20} />
                  </div>
                </div>
              </div>

              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Valor Promedio</h3>
                    <div className="admindash-indicator-value">$195,000</div>
                    <div className="admindash-indicator-change">+12% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon">
                    <DollarSign size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Gráficos de pedidos */}
            <div className="admindash-charts-full-grid">
              <div className="admindash-chart-card large">
                <div className="admindash-chart-header">
                  <h3 className="admindash-chart-title">Análisis de Pedidos por {ventasTimePeriod}</h3>
                  <select 
                    className="admindash-time-selector"
                    value={ventasTimePeriod}
                    onChange={(e) => setVentasTimePeriod(e.target.value)}
                  >
                    <option value="dia">Día</option>
                    <option value="semana">Semana</option>
                    <option value="mes">Mes</option>
                    <option value="año">Año</option>
                  </select>
                </div>
                <div className="admindash-chart-wrapper large">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={getDataByPeriod('ventas', ventasTimePeriod)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="ventas" fill="#3b82f6" name="Pedidos Realizados" />
                      <Line type="monotone" dataKey="ventas" stroke="#8b5cf6" strokeWidth={3} name="Tendencia" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Estados de pedidos */}
            <div className="admindash-overview-charts-grid">
              <div className="admindash-chart-card">
                <div className="admindash-chart-header">
                  <h3 className="admindash-chart-title">Estados de Pedidos</h3>
                </div>
                <div className="admindash-chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Completados', value: 78, color: '#10b981' },
                          { name: 'En Proceso', value: 15, color: '#f59e0b' },
                          { name: 'Pendientes', value: 5, color: '#6b7280' },
                          { name: 'Rechazados', value: 2, color: '#ef4444' }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: 'Completados', value: 78, color: '#10b981' },
                          { name: 'En Proceso', value: 15, color: '#f59e0b' },
                          { name: 'Pendientes', value: 5, color: '#6b7280' },
                          { name: 'Rechazados', value: 2, color: '#ef4444' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="admindash-chart-card">
                <div className="admindash-chart-header">
                  <h3 className="admindash-chart-title">Satisfacción del Cliente</h3>
                </div>
                <div className="admindash-chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { rating: '5★', count: 890 },
                      { rating: '4★', count: 234 },
                      { rating: '3★', count: 45 },
                      { rating: '2★', count: 12 },
                      { rating: '1★', count: 3 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rating" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        );

      case 'Comisiones':
        return (
          <section className="admindash-section-content">
            <h2 className="admindash-section-title">Análisis Detallado de Comisiones</h2>
            
            {/* Métricas específicas de comisiones */}
            <div className="admindash-indicators-grid">
              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Comisiones COMMART</h3>
                    <div className="admindash-indicator-value">$17,187,500</div>
                    <div className="admindash-indicator-change">+25% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon">
                    <DollarSign size={20} />
                  </div>
                </div>
              </div>

              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Pagos a Artistas</h3>
                    <div className="admindash-indicator-value">$51,562,500</div>
                    <div className="admindash-indicator-change">+22% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon">
                    <Users size={20} />
                  </div>
                </div>
              </div>

              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Margen COMMART</h3>
                    <div className="admindash-indicator-value">25%</div>
                    <div className="admindash-indicator-change">Constante</div>
                  </div>
                  <div className="admindash-indicator-icon">
                    <TrendingUp size={20} />
                  </div>
                </div>
              </div>

              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Transacciones</h3>
                    <div className="admindash-indicator-value">1,432</div>
                    <div className="admindash-indicator-change">+18% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon">
                    <Activity size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico principal de comisiones */}
            <div className="admindash-charts-full-grid">
              <div className="admindash-chart-card large">
                <div className="admindash-chart-header">
                  <h3 className="admindash-chart-title">Distribución de Ingresos por {ingresosTimePeriod}</h3>
                  <select 
                    className="admindash-time-selector"
                    value={ingresosTimePeriod}
                    onChange={(e) => setIngresosTimePeriod(e.target.value)}
                  >
                    <option value="dia">Día</option>
                    <option value="semana">Semana</option>
                    <option value="mes">Mes</option>
                    <option value="año">Año</option>
                  </select>
                </div>
                <div className="admindash-chart-wrapper large">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={getDataByPeriod('ingresos', ingresosTimePeriod)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="gastos" fill="#ef4444" name="Pagos a Artistas (75%)" />
                      <Bar dataKey="ingreso" fill="#10b981" name="Ganancia COMMART (25%)" />
                      <Line type="monotone" dataKey="ingreso" stroke="#8b5cf6" strokeWidth={3} name="Tendencia Ganancia" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Análisis adicional de comisiones */}
            <div className="admindash-overview-charts-grid">
              <div className="admindash-chart-card">
                <div className="admindash-chart-header">
                  <h3 className="admindash-chart-title">Comisiones por Estilo</h3>
                </div>
                <div className="admindash-chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distribucionVentas} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="admindash-chart-card">
                <div className="admindash-chart-header">
                  <h3 className="admindash-chart-title">Tendencia de Crecimiento</h3>
                </div>
                <div className="admindash-chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getDataByPeriod('ingresos', ingresosTimePeriod)}>
                      <defs>
                        <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="ingreso" 
                        stroke="#8b5cf6" 
                        fill="url(#colorGrowth)" 
                        name="Crecimiento Mensual"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        );

      case 'Tráfico Web':
        return (
          <section className="admindash-section-content">
            <h2 className="admindash-section-title">Análisis de Tráfico Web</h2>
            <div className="admindash-charts-full-grid">
              <div className="admindash-chart-card large">
                <div className="admindash-chart-header">
                  <h3 className="admindash-chart-title">Visitas y Sesiones por {visitasTimePeriod}</h3>
                  <select 
                    className="admindash-time-selector"
                    value={visitasTimePeriod}
                    onChange={(e) => setVisitasTimePeriod(e.target.value)}
                  >
                    <option value="dia">Día</option>
                    <option value="semana">Semana</option>
                    <option value="mes">Mes</option>
                    <option value="año">Año</option>
                  </select>
                </div>
                <div className="admindash-chart-wrapper large">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getDataByPeriod('visitas', visitasTimePeriod)}>
                      <defs>
                        <linearGradient id="colorVisitas2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSesiones2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="visitas" stroke="#f59e0b" fill="url(#colorVisitas2)" name="Visitas" />
                      <Area type="monotone" dataKey="sesiones" stroke="#8b5cf6" fill="url(#colorSesiones2)" name="Sesiones" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Métricas adicionales de tráfico */}
            <div className="admindash-indicators-grid">
              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Páginas vistas</h3>
                    <div className="admindash-indicator-value">2.4M</div>
                    <div className="admindash-indicator-change">+18% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon">
                    <Eye size={20} />
                  </div>
                </div>
              </div>

              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Tiempo promedio</h3>
                    <div className="admindash-indicator-value">4:32</div>
                    <div className="admindash-indicator-change">+12% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon">
                    <Activity size={20} />
                  </div>
                </div>
              </div>

              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Tasa de rebote</h3>
                    <div className="admindash-indicator-value">32%</div>
                    <div className="admindash-indicator-change">-8% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon">
                    <TrendingUp size={20} />
                  </div>
                </div>
              </div>

              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Conversión</h3>
                    <div className="admindash-indicator-value">3.8%</div>
                    <div className="admindash-indicator-change">+15% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon">
                    <Target size={20} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      case 'Usuarios':
        return (
          <section className="admindash-section-content">
            <h2 className="admindash-section-title">Análisis de Usuarios</h2>
            
            {/* Métricas de usuarios */}
            <div className="admindash-indicators-grid">
              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Usuarios Totales</h3>
                    <div className="admindash-indicator-value">12,847</div>
                    <div className="admindash-indicator-change">+22% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon">
                    <Users size={20} />
                  </div>
                </div>
              </div>

              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Usuarios Activos</h3>
                    <div className="admindash-indicator-value">8,432</div>
                    <div className="admindash-indicator-change">+18% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon">
                    <Activity size={20} />
                  </div>
                </div>
              </div>

              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Nuevos Registros</h3>
                    <div className="admindash-indicator-value">1,247</div>
                    <div className="admindash-indicator-change">+35% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon">
                    <User size={20} />
                  </div>
                </div>
              </div>

              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Usuarios Premium</h3>
                    <div className="admindash-indicator-value">847</div>
                    <div className="admindash-indicator-change">+28% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon">
                    <Star size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico de distribución de usuarios */}
            <div className="admindash-charts-full-grid">
              <div className="admindash-chart-card large">
                <div className="admindash-chart-header">
                  <h3 className="admindash-chart-title">Distribución de Usuarios</h3>
                </div>
                <div className="admindash-chart-wrapper large">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Usuarios Regulares', value: 68, color: '#8b5cf6' },
                          { name: 'Artistas', value: 25, color: '#3b82f6' },
                          { name: 'Usuarios Premium', value: 7, color: '#10b981' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Usuarios Regulares', value: 68, color: '#8b5cf6' },
                          { name: 'Artistas', value: 25, color: '#3b82f6' },
                          { name: 'Usuarios Premium', value: 7, color: '#10b981' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        );

      case 'Artistas':
        return (
          <section className="admindash-section-content">
            <h2 className="admindash-section-title">Análisis de Artistas</h2>
            
            {/* Métricas de artistas */}
            <div className="admindash-indicators-grid">
              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Artistas Registrados</h3>
                    <div className="admindash-indicator-value">3,247</div>
                    <div className="admindash-indicator-change">+15% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon">
                    <Palette size={20} />
                  </div>
                </div>
              </div>

              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Artistas Activos</h3>
                    <div className="admindash-indicator-value">2,184</div>
                    <div className="admindash-indicator-change">+12% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon">
                    <Activity size={20} />
                  </div>
                </div>
              </div>

              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Promedio Pedidos/Artista</h3>
                    <div className="admindash-indicator-value">4.2</div>
                    <div className="admindash-indicator-change">+8% vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon">
                    <Target size={20} />
                  </div>
                </div>
              </div>

              <div className="admindash-indicator-card small">
                <div className="admindash-indicator-content">
                  <div className="admindash-indicator-info">
                    <h3>Rating Promedio</h3>
                    <div className="admindash-indicator-value">4.6★</div>
                    <div className="admindash-indicator-change">+0.2 vs mes anterior</div>
                  </div>
                  <div className="admindash-indicator-icon">
                    <Award size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Ranking de artistas */}
            <div className="admindash-overview-bottom-grid">
              <div className="admindash-info-card">
                <h3 className="admindash-info-card-title">Top Artistas del Mes</h3>
                <ul className="admindash-artists-list">
                  {artistasMasVistos.map((artist, index) => (
                    <li key={artist.id} className="admindash-artist-item">
                      <span className="ranking-number">#{index + 1}</span>
                      <img src={artist.avatar} alt={artist.name} className="admindash-artist-avatar" />
                      <div className="admindash-artist-info">
                        <p className="admindash-artist-name">{artist.name}</p>
                        <p className="admindash-artist-views">{artist.views} pedidos</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="admindash-info-card">
                <h3 className="admindash-info-card-title">Estilos Más Populares</h3>
                <div className="admindash-chart-wrapper small">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={distribucionVentas} 
                      layout="horizontal"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="admindash-info-card">
                <h3 className="admindash-info-card-title">Actividad Reciente</h3>
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-dot"></div>
                    <div className="activity-text">
                      <strong>Sofia_Art</strong> completó un pedido
                      <span className="activity-time">Hace 2 horas</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-dot"></div>
                    <div className="activity-text">
                      <strong>Carlos_Draw</strong> subió un nuevo paquete
                      <span className="activity-time">Hace 4 horas</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-dot"></div>
                    <div className="activity-text">
                      <strong>Ana_Design</strong> recibió una nueva reseña
                      <span className="activity-time">Hace 6 horas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      case 'Gestión':
        return (
          <section className="admindash-section-content">
            <h2 className="admindash-section-title">Herramientas de Gestión</h2>
            
            {/* Cards de gestión */}
            <div className="admindash-management-grid">
              <div className="admindash-management-card">
                <div className="management-card-icon">
                  <Settings size={40} />
                </div>
                <h3>Configuración del Sistema</h3>
                <p>Administrar configuraciones generales de la plataforma</p>
                <button className="management-btn">Acceder</button>
              </div>

              <div className="admindash-management-card">
                <div className="management-card-icon">
                  <Users size={40} />
                </div>
                <h3>Gestión de Usuarios</h3>
                <p>Administrar cuentas de usuarios y artistas</p>
                <button className="management-btn">Ver Usuarios</button>
              </div>

              <div className="admindash-management-card">
                <div className="management-card-icon">
                  <Package size={40} />
                </div>
                <h3>Gestión de Contenido</h3>
                <p>Moderar paquetes y contenido de artistas</p>
                <button className="management-btn">Moderar</button>
              </div>

              <div className="admindash-management-card">
                <div className="management-card-icon">
                  <DollarSign size={40} />
                </div>
                <h3>Gestión Financiera</h3>
                <p>Administrar pagos y comisiones</p>
                <button className="management-btn">Ver Finanzas</button>
              </div>

              <div className="admindash-management-card">
                <div className="management-card-icon">
                  <Award size={40} />
                </div>
                <h3>Sistema de Reputación</h3>
                <p>Gestionar ratings y reseñas</p>
                <button className="management-btn">Administrar</button>
              </div>

              <div className="admindash-management-card">
                <div className="management-card-icon">
                  <Eye size={40} />
                </div>
                <h3>Monitoreo</h3>
                <p>Supervisar actividad y rendimiento</p>
                <button className="management-btn">Monitorear</button>
              </div>
            </div>
          </section>
        );

      case 'Crear Plan Premium':
        return (
          <section className="admindash-section-content">
            <h2 className="admindash-section-title">Crear Plan Premium</h2>
            
            <div className="admindash-premium-container">
              <div className="premium-form-card">
                <h3>Configurar Nuevo Plan Premium</h3>
                <form className="premium-form">
                  <div className="form-group">
                    <label>Nombre del Plan</label>
                    <input type="text" placeholder="Plan Premium COMMART" />
                  </div>

                  <div className="form-group">
                    <label>Precio Mensual (COP)</label>
                    <input type="text" placeholder="25,000" />
                  </div>

                  <div className="form-group">
                    <label>Descripción</label>
                    <textarea placeholder="Descripción de los beneficios del plan premium"></textarea>
                  </div>

                  <div className="form-group">
                    <label>Beneficios</label>
                    <div className="benefits-list">
                      <div className="benefit-item">
                        <input type="checkbox" id="no-ads" />
                        <label htmlFor="no-ads">Sin publicidad</label>
                      </div>
                      <div className="benefit-item">
                        <input type="checkbox" id="priority" />
                        <label htmlFor="priority">Soporte prioritario</label>
                      </div>
                      <div className="benefit-item">
                        <input type="checkbox" id="features" />
                        <label htmlFor="features">Funciones exclusivas</label>
                      </div>
                      <div className="benefit-item">
                        <input type="checkbox" id="storage" />
                        <label htmlFor="storage">Almacenamiento extra</label>
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn-secondary">Cancelar</button>
                    <button type="submit" className="btn-primary">Crear Plan</button>
                  </div>
                </form>
              </div>

              <div className="premium-preview-card">
                <h3>Vista Previa del Plan</h3>
                <div className="plan-preview">
                  <div className="plan-header">
                    <h4>Plan Premium COMMART</h4>
                    <div className="plan-price">$25,000 COP/mes</div>
                  </div>
                  <div className="plan-benefits">
                    <ul>
                      <li>✓ Sin publicidad</li>
                      <li>✓ Soporte prioritario</li>
                      <li>✓ Funciones exclusivas</li>
                      <li>✓ Almacenamiento extra</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      default:
        return (
          <section className="admindash-section-content">
            <h2 className="admindash-section-title">{activeSection}</h2>
            <div className="admindash-section-card">
              <h3 className="admindash-section-subtitle">Funcionalidad de {activeSection}</h3>
              <p className="admindash-section-description">
                Esta sección está siendo desarrollada para proporcionar métricas específicas de {activeSection.toLowerCase()}.
              </p>
              <div className="admindash-development-notice">
                <Package className="admindash-notice-icon" />
                <p className="admindash-notice-text">Próximamente: Análisis detallado de {activeSection.toLowerCase()}</p>
              </div>
            </div>
          </section>
        );
    }
  };

  return (
    <>
      <div className="admindash-root">
        {/* Sidebar */}
        <aside className={`admindash-sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="admindash-sidebar-header">
            <div className="admindash-sidebar-logo">
              <div className="admindash-logo-circle">
                <Target size={24} />
              </div>
              <span>COMMART</span>
            </div>
          </div>

          <nav className="admindash-sidebar-nav">
            {sidebarItems.map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveSection(item.name)}
                className={`admindash-nav-item${activeSection === item.name ? ' active' : ''}`}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={`admindash-main-content${sidebarOpen ? ' sidebar-open' : ''}`}>
          {/* Header */}
          <header className="admindash-main-header">
            <div className="admindash-header-content">
              <div className="admindash-header-left">
                <button 
                  className="admindash-mobile-menu-btn"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu size={20} />
                </button>
                <div className="admindash-header-text">
                  <h1>Dashboard Administrativo</h1>
                  <p>Gestiona y visualiza tus métricas principales</p>
                </div>
              </div>
              <div className="admindash-header-right">
                <Calendar size={20} />
                <span>{new Date().toLocaleDateString('es-ES', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}</span>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="admindash-dashboard-main">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Overlay para móvil */}
      <div 
        className={`admindash-sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
    </>
  );
};

export default AdminDashboard;