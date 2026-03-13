import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts"
import { formatCurrency } from "@/lib/utils"
import api from "@/lib/api"

export function Forecast() {
    const { t } = useTranslation()
    const [data, setData] = useState(null)
    const [months, setMonths] = useState(3)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchForecast()
    }, [months]) // eslint-disable-line react-hooks/exhaustive-deps

    const fetchForecast = async () => {
        try {
            setLoading(true)
            const { data } = await api.get(`/forecast?months=${months}`)
            setData(data)
        } catch (err) {
            console.error("Forecast error:", err)
        } finally {
            setLoading(false)
        }
    }

    // Combine historical + forecast for the chart
    const chartData = data ? [
        ...data.historical.map(h => ({
            month: new Date(h.month).toLocaleDateString("vi-VN", { month: "short", year: "2-digit" }),
            income: parseFloat(h.income) || 0,
            expense: parseFloat(h.expense) || 0,
            type: "historical"
        })),
        ...data.forecast.map(f => ({
            month: f.month.slice(5), // "MM"
            income: f.predictedIncome,
            expense: f.predictedExpense,
            type: "forecast"
        }))
    ] : []

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{t("forecast.title")}</h1>
                <p className="text-muted-foreground">{t("forecast.desc")}</p>
            </div>

            {/* Warning / Healthy banner */}
            {data?.warningMonth ? (
                <Card className="p-4 border-amber-500/50 bg-amber-500/5">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">{t("forecast.warningMsg", { month: data.warningMonth })}</p>
                    </div>
                </Card>
            ) : data && (
                <Card className="p-4 border-green-500/50 bg-green-500/5">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">{t("forecast.healthy")}</p>
                    </div>
                </Card>
            )}

            {/* Period selector */}
            <div className="flex gap-2">
                {[3, 6, 12].map(m => (
                    <button
                        key={m}
                        onClick={() => setMonths(m)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${months === m
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        {m} {t("forecast.monthsLabel")}
                    </button>
                ))}
            </div>

            {/* Chart */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">{t("forecast.chartTitle")}</h2>
                {loading ? (
                    <div className="h-80 flex items-center justify-center text-muted-foreground">
                        {t("common.loading")}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Legend />
                            <ReferenceLine x={chartData.findIndex(d => d.type === "forecast") > 0 ? chartData[chartData.findIndex(d => d.type === "forecast")].month : null} stroke="#888" strokeDasharray="5 5" label={t("forecast.predicted")} />
                            <Line type="monotone" dataKey="income" name={t("forecast.income")} stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="expense" name={t("forecast.expense")} stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </Card>

            {/* Forecast Cards */}
            {data?.forecast && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {data.forecast.map((f, i) => (
                        <Card key={i} className="p-5">
                            <p className="text-sm text-muted-foreground mb-3">{f.month}</p>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-sm">
                                        <TrendingUp className="h-4 w-4 text-green-500" /> {t("forecast.income")}
                                    </span>
                                    <span className="font-medium text-green-600">{formatCurrency(f.predictedIncome)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-sm">
                                        <TrendingDown className="h-4 w-4 text-red-500" /> {t("forecast.expense")}
                                    </span>
                                    <span className="font-medium text-red-600">{formatCurrency(f.predictedExpense)}</span>
                                </div>
                                <hr />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{t("forecast.netFlow")}</span>
                                    <Badge variant={f.predictedNet >= 0 ? "default" : "destructive"}>
                                        {formatCurrency(f.predictedNet)}
                                    </Badge>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
