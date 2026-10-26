import { useEffect, useId, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type BusinessType, type Category, type TopCategoryItem } from "@/lib/financial-types";
import {
  categorySharePercent,
  filterAvailableCategories,
  sumIncomePeriods,
} from "@/lib/business-comparison";
import {
  buildBusinessSummaryQuery,
  buildTopIncomeCategoriesQuery,
} from "@/lib/date-range";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const BUSINESS_GROUPS: BusinessType[] = ["B2B", "B2C"];

interface MetricsSummaryItem {
  period: string;
  income: number;
  outcome: number;
  net: number;
}

interface BusinessComparisonData {
  businessType: BusinessType;
  totalIncome: number;
  categories: TopCategoryItem[];
}

interface BusinessComparisonPageProps {
  startDate: string;
  endDate: string;
  availableCategories: Category[];
}

const CATEGORY_LABELS: Record<Category, string> = {
  suppliers: "Proveedores",
  sales: "Ventas",
  operational: "Operaciones",
  administrative: "Administración",
  others: "Otros",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

async function fetchGroupComparison(
  businessType: BusinessType,
  startDate: string,
  endDate: string,
  signal: AbortSignal,
): Promise<BusinessComparisonData> {
  const categoryQuery = buildTopIncomeCategoriesQuery(businessType, startDate, endDate);
  const summaryQuery = buildBusinessSummaryQuery(businessType, startDate, endDate);

  const [categories, summary] = await Promise.all([
    fetchJson<TopCategoryItem[]>(
      `${API_BASE_URL}/api/metrics/categories/top?${categoryQuery}`,
      signal,
    ),
    fetchJson<MetricsSummaryItem[]>(
      `${API_BASE_URL}/api/metrics/summary?${summaryQuery}`,
      signal,
    ),
  ]);

  return {
    businessType,
    totalIncome: sumIncomePeriods(summary),
    categories,
  };
}

function BusinessCategoryTable({
  group,
  availableCategories,
  totalIncome,
  loading,
}: {
  group: BusinessComparisonData;
  availableCategories: Category[];
  totalIncome: number;
  loading: boolean;
}) {
  const categories = filterAvailableCategories(group.categories, availableCategories);
  const titleId = useId();

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle as="h3" id={titleId} className="text-base font-semibold">{group.businessType}</CardTitle>
        <CardDescription>Total de ingresos: {formatCurrency(totalIncome)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div role="region" aria-labelledby={titleId} tabIndex={0} className="overflow-x-auto">
          <table aria-labelledby={titleId} aria-busy={loading} className="w-full min-w-[360px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-3">Categoría</th>
                <th scope="col" className="px-3 py-3 text-right">Ingresos</th>
                <th scope="col" className="px-3 py-3 text-right">% del grupo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-muted-foreground">
                    Cargando categorías…
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-muted-foreground">
                    No hay categorías de ingreso para este grupo y período.
                  </td>
                </tr>
              ) : categories.map((item) => (
                <tr key={item.category}>
                  <td className="px-3 py-3 font-medium text-foreground">
                    {CATEGORY_LABELS[item.category]}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-foreground">
                    {formatCurrency(item.total_amount)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-foreground">
                    {categorySharePercent(item.total_amount, totalIncome).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function BusinessComparisonPage({
  startDate,
  endDate,
  availableCategories,
}: BusinessComparisonPageProps) {
  const [groups, setGroups] = useState<BusinessComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartTitleId = useId();
  const chartDescriptionId = useId();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    Promise.all(
      BUSINESS_GROUPS.map((businessType) =>
        fetchGroupComparison(businessType, startDate, endDate, controller.signal),
      ),
    )
      .then(setGroups)
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("No se pudo cargar la comparativa B2B vs B2C.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [startDate, endDate]);

  const chartData = useMemo(
    () => groups.map(({ businessType, totalIncome }) => ({ businessType, totalIncome })),
    [groups],
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Comparativa B2B vs B2C</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ingresos y categorías principales por línea de negocio
        </p>
      </div>

      {error ? (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground">
          {error}
        </div>
      ) : null}

      <p role="status" className="sr-only">
        {loading ? "Cargando comparativa." : error ? "" : "Comparativa B2B y B2C actualizada para el rango seleccionado."}
      </p>

      <section aria-label="Principales categorías de ingresos por negocio" className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {BUSINESS_GROUPS.map((businessType) => {
          const group = groups.find((item) => item.businessType === businessType) ?? {
            businessType,
            totalIncome: 0,
            categories: [],
          };
          return (
            <BusinessCategoryTable
              key={businessType}
              group={group}
              availableCategories={availableCategories}
              totalIncome={group.totalIncome}
              loading={loading}
            />
          );
        })}
      </section>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle as="h3" id={chartTitleId} className="text-base font-semibold">Ingresos totales por línea</CardTitle>
          <CardDescription id={chartDescriptionId}>Comparación del total de ingresos en el período seleccionado</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              Cargando comparativa…
            </div>
          ) : error ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              No se pudo generar el gráfico.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart aria-labelledby={chartTitleId} aria-describedby={chartDescriptionId} data={chartData} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.6} />
                <XAxis dataKey="businessType" tick={{ fill: "var(--color-muted-foreground)" }} />
                <YAxis
                  tick={{ fill: "var(--color-muted-foreground)" }}
                  tickFormatter={(value) => `$${(Number(value) / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{ backgroundColor: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  itemStyle={{ color: "var(--foreground)" }}
                  labelStyle={{ color: "var(--foreground)" }}
                />
                <Bar dataKey="totalIncome" name="Ingresos" fill="var(--chart-income)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
