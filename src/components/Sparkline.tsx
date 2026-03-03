interface Props {
  up: boolean
}

export default function Sparkline({ up }: Props) {
  const pts = up
    ? "0,20 10,18 20,15 30,16 40,10 50,8 60,5 70,7 80,3 90,4 100,1"
    : "0,2 10,4 20,6 30,5 40,8 50,10 60,9 70,14 80,15 90,17 100,20"
  const color = up ? "#10B981" : "#EF4444"
  
  return (
    <svg width="80" height="22" viewBox="0 0 100 22">
      <polyline 
        points={pts} 
        fill="none" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
    </svg>
  )
}
