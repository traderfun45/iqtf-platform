import { strategyRoutes } from './routes/strategy.routes'

// ... ในส่วน routes
app.register(authRoutes, { prefix: '/api' })
app.register(tradingRoutes, { prefix: '/api' })
app.register(strategyRoutes, { prefix: '/api' }) // ✅ เพิ่มบรรทัดนี้
