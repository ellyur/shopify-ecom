import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, ShoppingBag, Package, BarChart2, CalendarDays } from "lucide-react";
import { useAdminAnalytics } from "@/hooks/use-orders";
import { cn } from "@/lib/utils";

const STATUS_PIE_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  downpayment: "#3b82f6",
  paid: "#06b6d4",
  processing: "#8b5cf6",
  delivery: "#f97316",
  completed: "#22c55e",
  cancelled: "#ef4444",
};

const CHART_PRIMARY = "hsl(340 52% 40%)";
const CHART_MUTED = "hsl(340 30% 90%)";

function ChartSkeleton() {
  return (
    <div className="w-full h-48 flex items-center justify-center">
      <div className="space-y-2 w-full">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-24 w-full mt-4" />
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label, prefix = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border/50 shadow-lg px-3 py-2 text-xs">
      {label && <p className="font-bold text-foreground mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || CHART_PRIMARY }}>
          {p.name}: {prefix}{typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

export function AdminCharts() {
  const { data: analytics, isLoading } = useAdminAnalytics();

  return (
    <div className="space-y-6 mt-8">
      <div className="flex items-center gap-2 mb-2">
        <BarChart2 className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-serif">Analytics Overview</h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="border-none shadow-sm rounded-none bg-white">
          <CardHeader className="flex flex-row items-center gap-2 pb-4 border-b border-border/30">
            <TrendingUp className="h-4 w-4 text-primary" />
            <CardTitle className="font-serif text-lg">Revenue Trend</CardTitle>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest ml-auto">Last 12 months</span>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? <ChartSkeleton /> : (
              analytics?.revenueByMonth && analytics.revenueByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={analytics.revenueByMonth} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_PRIMARY} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={CHART_PRIMARY} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip prefix="₱" />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke={CHART_PRIMARY} strokeWidth={2} fill="url(#revGrad)" dot={{ fill: CHART_PRIMARY, r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm italic">No revenue data yet.</div>
              )
            )}
          </CardContent>
        </Card>

        {/* Order Status Breakdown */}
        <Card className="border-none shadow-sm rounded-none bg-white">
          <CardHeader className="flex flex-row items-center gap-2 pb-4 border-b border-border/30">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <CardTitle className="font-serif text-lg">Order Status</CardTitle>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest ml-auto">All time</span>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? <ChartSkeleton /> : (
              analytics?.orderStatusBreakdown && analytics.orderStatusBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={analytics.orderStatusBreakdown}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={85}
                      dataKey="count"
                      nameKey="status"
                      paddingAngle={2}
                    >
                      {analytics.orderStatusBreakdown.map((entry, i) => (
                        <Cell key={i} fill={STATUS_PIE_COLORS[entry.status] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any, n: any) => [v, n]} content={<CustomTooltip />} />
                    <Legend
                      iconSize={8}
                      wrapperStyle={{ fontSize: "10px" }}
                      formatter={(v) => <span className="uppercase tracking-wide text-[10px]">{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm italic">No orders yet.</div>
              )
            )}
          </CardContent>
        </Card>
      </div>

      {/* Most Purchased Products */}
      <Card className="border-none shadow-sm rounded-none bg-white">
        <CardHeader className="flex flex-row items-center gap-2 pb-4 border-b border-border/30">
          <ShoppingBag className="h-4 w-4 text-primary" />
          <CardTitle className="font-serif text-lg">Most Purchased Products</CardTitle>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest ml-auto">Top 10 by units sold</span>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? <ChartSkeleton /> : (
            analytics?.topProducts && analytics.topProducts.filter(p => p.totalSold > 0).length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(200, analytics.topProducts.filter(p => p.totalSold > 0).length * 38)}>
                <BarChart
                  layout="vertical"
                  data={analytics.topProducts.filter(p => p.totalSold > 0)}
                  margin={{ top: 4, right: 32, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={130} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="totalSold" name="Units Sold" fill={CHART_PRIMARY} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm italic">No sales data yet.</div>
            )
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Product Stock Levels */}
        <Card className="border-none shadow-sm rounded-none bg-white">
          <CardHeader className="flex flex-row items-center gap-2 pb-4 border-b border-border/30">
            <Package className="h-4 w-4 text-primary" />
            <CardTitle className="font-serif text-lg">Stock Levels</CardTitle>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest ml-auto">All products</span>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? <ChartSkeleton /> : (
              analytics?.stockLevels && analytics.stockLevels.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.min(320, Math.max(180, analytics.stockLevels.length * 28))}>
                  <BarChart
                    layout="vertical"
                    data={analytics.stockLevels}
                    margin={{ top: 4, right: 32, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={130} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="stock" name="In Stock" radius={[0, 3, 3, 0]}>
                      {analytics.stockLevels.map((entry, i) => (
                        <Cell key={i} fill={entry.stock <= 5 ? "#ef4444" : entry.stock <= 15 ? "#f59e0b" : CHART_PRIMARY} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground text-sm italic">No products yet.</div>
              )
            )}
          </CardContent>
        </Card>

        {/* Event Popularity */}
        <Card className="border-none shadow-sm rounded-none bg-white">
          <CardHeader className="flex flex-row items-center gap-2 pb-4 border-b border-border/30">
            <CalendarDays className="h-4 w-4 text-primary" />
            <CardTitle className="font-serif text-lg">Event Popularity</CardTitle>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest ml-auto">Orders per event</span>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? <ChartSkeleton /> : (
              analytics?.eventPopularity && analytics.eventPopularity.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(180, analytics.eventPopularity.length * 42)}>
                  <BarChart
                    layout="vertical"
                    data={analytics.eventPopularity}
                    margin={{ top: 4, right: 32, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={130} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="orders" name="Orders" fill="#8b5cf6" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground text-sm italic">No event data yet.</div>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
