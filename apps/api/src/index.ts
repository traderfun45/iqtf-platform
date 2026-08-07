import { tradingRoutes } from './routes/trading.routes'

// ... ในส่วน routes
app.register(authRoutes, { prefix: '/api' })
app.register(tradingRoutes, { prefix: '/api' }) // ✅ เพิ่มบรรทัดนี้
