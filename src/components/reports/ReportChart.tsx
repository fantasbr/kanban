
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
interface ReportChartProps {
  title: string
  description?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  type: 'bar' | 'pie'
  dataKey: string
  nameKey?: string
  color?: string
  height?: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export function ReportChart({
  title,
  description,
  data,
  type,
  dataKey,
  nameKey = 'name',
  color = '#8884d8',
  height = 350
}: ReportChartProps) {
  
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: height }}>
          <ResponsiveContainer>
            {type === 'bar' ? (
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={nameKey} />
                <YAxis />
                <Tooltip 
                  formatter={(value: number | string | undefined) => {
                    // Format currency if needed logic can be added here
                    return [value ?? '', title] 
                  }}
                />
                <Legend />
                <Bar dataKey={dataKey} fill={color} name={title} />
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey={dataKey}
                  nameKey={nameKey}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
