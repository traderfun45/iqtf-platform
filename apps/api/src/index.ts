import { strategyRoutes } from './routes/strategy.routes'

// ... ในส่วน routes
app.register(authRoutes, { prefix: '/api' })
app.register(tradingRoutes, { prefix: '/api' })
app.register(strategyRoutes, { prefix: '/api' }) // ✅ เพิ่มบรรทัดนี้

import { backtestRoutes } from './routes/backtest.routes'

// ... ในส่วน routes
app.register(authRoutes, { prefix: '/api' })
app.register(tradingRoutes, { prefix: '/api' })
app.register(strategyRoutes, { prefix: '/api' })
app.register(backtestRoutes, { prefix: '/api' }) // ✅ เพิ่มบรรทัดนี้

import { assetRoutes } from './routes/asset.routes'

// ... ในส่วน routes
app.register(authRoutes, { prefix: '/api' })
app.register(tradingRoutes, { prefix: '/api' })
app.register(strategyRoutes, { prefix: '/api' })
app.register(backtestRoutes, { prefix: '/api' })
app.register(assetRoutes, { prefix: '/api' }) // ✅ เพิ่มบรรทัดนี้
