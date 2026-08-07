import { PrismaClient, AssetType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding assets...')

  const assets = [
    // ===== CRYPTO =====
    { symbol: 'BTCUSDT', name: 'Bitcoin', type: AssetType.CRYPTO, currency: 'USD', minQuantity: 0.001, tickSize: 0.01 },
    { symbol: 'ETHUSDT', name: 'Ethereum', type: AssetType.CRYPTO, currency: 'USD', minQuantity: 0.01, tickSize: 0.01 },
    { symbol: 'BNBUSDT', name: 'Binance Coin', type: AssetType.CRYPTO, currency: 'USD', minQuantity: 0.01, tickSize: 0.01 },
    { symbol: 'SOLUSDT', name: 'Solana', type: AssetType.CRYPTO, currency: 'USD', minQuantity: 0.1, tickSize: 0.01 },
    { symbol: 'ADAUSDT', name: 'Cardano', type: AssetType.CRYPTO, currency: 'USD', minQuantity: 1, tickSize: 0.001 },
    { symbol: 'XRPUSDT', name: 'Ripple', type: AssetType.CRYPTO, currency: 'USD', minQuantity: 1, tickSize: 0.001 },
    { symbol: 'DOTUSDT', name: 'Polkadot', type: AssetType.CRYPTO, currency: 'USD', minQuantity: 0.1, tickSize: 0.01 },
    { symbol: 'AVAXUSDT', name: 'Avalanche', type: AssetType.CRYPTO, currency: 'USD', minQuantity: 0.1, tickSize: 0.01 },
    { symbol: 'MATICUSDT', name: 'Polygon', type: AssetType.CRYPTO, currency: 'USD', minQuantity: 1, tickSize: 0.001 },
    { symbol: 'LINKUSDT', name: 'Chainlink', type: AssetType.CRYPTO, currency: 'USD', minQuantity: 0.1, tickSize: 0.01 },

    // ===== GOLD =====
    { symbol: 'XAUUSD', name: 'Gold Spot', type: AssetType.SPOT, exchange: 'FOREX', currency: 'USD', minQuantity: 0.01, tickSize: 0.01 },
    { symbol: 'XAUUSD', name: 'Gold Spot (OANDA)', type: AssetType.SPOT, exchange: 'OANDA', currency: 'USD', minQuantity: 0.01, tickSize: 0.01 },
    { symbol: 'GC', name: 'Gold Futures', type: AssetType.FUTURES, exchange: 'COMEX', currency: 'USD', minQuantity: 1, tickSize: 0.1 },
    { symbol: 'XAUUSD', name: 'Gold Spot (MT5)', type: AssetType.SPOT, exchange: 'MT5', currency: 'USD', minQuantity: 0.01, tickSize: 0.01 },
    { symbol: 'GOLD', name: 'Gold Spot (OANDA)', type: AssetType.SPOT, exchange: 'OANDA', currency: 'USD', minQuantity: 0.01, tickSize: 0.01 },

    // ===== SILVER =====
    { symbol: 'XAGUSD', name: 'Silver Spot', type: AssetType.SPOT, exchange: 'FOREX', currency: 'USD', minQuantity: 0.1, tickSize: 0.001 },
    { symbol: 'SI', name: 'Silver Futures', type: AssetType.FUTURES, exchange: 'COMEX', currency: 'USD', minQuantity: 1, tickSize: 0.001 },
    { symbol: 'XAGUSD', name: 'Silver Spot (OANDA)', type: AssetType.SPOT, exchange: 'OANDA', currency: 'USD', minQuantity: 0.1, tickSize: 0.001 },

    // ===== FOREX =====
    // Major Pairs
    { symbol: 'EURUSD', name: 'Euro/US Dollar', type: AssetType.FOREX, exchange: 'FOREX', currency: 'USD', minQuantity: 1000, tickSize: 0.00001 },
    { symbol: 'GBPUSD', name: 'British Pound/US Dollar', type: AssetType.FOREX, exchange: 'FOREX', currency: 'USD', minQuantity: 1000, tickSize: 0.00001 },
    { symbol: 'USDJPY', name: 'US Dollar/Japanese Yen', type: AssetType.FOREX, exchange: 'FOREX', currency: 'JPY', minQuantity: 1000, tickSize: 0.001 },
    { symbol: 'USDCHF', name: 'US Dollar/Swiss Franc', type: AssetType.FOREX, exchange: 'FOREX', currency: 'CHF', minQuantity: 1000, tickSize: 0.00001 },
    { symbol: 'AUDUSD', name: 'Australian Dollar/US Dollar', type: AssetType.FOREX, exchange: 'FOREX', currency: 'USD', minQuantity: 1000, tickSize: 0.00001 },
    { symbol: 'USDCAD', name: 'US Dollar/Canadian Dollar', type: AssetType.FOREX, exchange: 'FOREX', currency: 'CAD', minQuantity: 1000, tickSize: 0.00001 },
    { symbol: 'NZDUSD', name: 'New Zealand Dollar/US Dollar', type: AssetType.FOREX, exchange: 'FOREX', currency: 'USD', minQuantity: 1000, tickSize: 0.00001 },

    // ===== COMMODITIES =====
    { symbol: 'CL', name: 'Crude Oil Futures', type: AssetType.FUTURES, exchange: 'NYMEX', currency: 'USD', minQuantity: 1, tickSize: 0.01 },
    { symbol: 'NG', name: 'Natural Gas Futures', type: AssetType.FUTURES, exchange: 'NYMEX', currency: 'USD', minQuantity: 1, tickSize: 0.001 },
    { symbol: 'HG', name: 'Copper Futures', type: AssetType.FUTURES, exchange: 'COMEX', currency: 'USD', minQuantity: 1, tickSize: 0.001 },
    { symbol: 'ZC', name: 'Corn Futures', type: AssetType.FUTURES, exchange: 'CBOT', currency: 'USD', minQuantity: 1, tickSize: 0.25 },
    { symbol: 'ZS', name: 'Soybean Futures', type: AssetType.FUTURES, exchange: 'CBOT', currency: 'USD', minQuantity: 1, tickSize: 0.25 },

    // ===== INDICES =====
    { symbol: 'SPX', name: 'S&P 500', type: AssetType.INDEX, exchange: 'S&P', currency: 'USD', minQuantity: 0.1, tickSize: 0.01 },
    { symbol: 'NDX', name: 'Nasdaq 100', type: AssetType.INDEX, exchange: 'NASDAQ', currency: 'USD', minQuantity: 0.1, tickSize: 0.01 },
    { symbol: 'DJI', name: 'Dow Jones', type: AssetType.INDEX, exchange: 'DJIA', currency: 'USD', minQuantity: 0.1, tickSize: 0.01 },
    { symbol: 'FTSE', name: 'FTSE 100', type: AssetType.INDEX, exchange: 'FTSE', currency: 'GBP', minQuantity: 0.1, tickSize: 0.01 },
    { symbol: 'DAX', name: 'DAX 40', type: AssetType.INDEX, exchange: 'XETRA', currency: 'EUR', minQuantity: 0.1, tickSize: 0.01 },
    { symbol: 'HSI', name: 'Hang Seng Index', type: AssetType.INDEX, exchange: 'HKEX', currency: 'HKD', minQuantity: 0.1, tickSize: 0.01 },
  ]

  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { symbol: asset.symbol },
      update: {},
      create: asset,
    })
    console.log(`  ✅ ${asset.symbol} - ${asset.name}`)
  }

  console.log('✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
