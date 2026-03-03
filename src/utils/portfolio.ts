// Legacy portfolio utilities - not currently used
interface Stock {
  shares: number
  price: number
  buy: number
}

export function calcPortfolioValue(stocks: Stock[]): number {
  return stocks.reduce((s, st) => s + st.shares * st.price, 0)
}

export function calcCost(stocks: Stock[]): number {
  return stocks.reduce((s, st) => s + st.shares * st.buy, 0)
}

export function calcPnl(stocks: Stock[]): number {
  return calcPortfolioValue(stocks) - calcCost(stocks)
}

export function pct(a: number, b: number): string {
  return (((a - b) / b) * 100).toFixed(2)
}

export function fmt(n: number): string {
  return new Intl.NumberFormat("fr-FR", { 
    style: "currency", 
    currency: "EUR", 
    maximumFractionDigits: 0 
  }).format(n)
}
