import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { KPIRow } from "@/components/dashboard/kpi-row";
import { IncomeOutcomeChart } from "@/components/dashboard/income-outcome-chart";
import { ProfitPercentChart } from "@/components/dashboard/profit-percent-chart";
import {
  type FinancialMovement,
  type MetricsAlert,
  type KPIMetrics,
  type MetricsFacets,
  type MonthlyDataPoint,
} from "@/lib/financial-types";
import { computeKPIs, computeMonthlyData } from "@/lib/financial-utils";
import { buildAlertsQuery, buildDateRangeQuery } from "@/lib/date-range";
import { AlertsTable } from "@/components/dashboard/alerts-table";
import { BusinessComparisonPage } from "@/components/dashboard/business-comparison-page";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function fetchFinancialData(
  startDate: string,
  endDate: string,
  signal?: AbortSignal,
): Promise<FinancialMovement[]> {
  const queryString = buildDateRangeQuery(startDate, endDate);
  const response = await fetch(
    `${API_BASE_URL}/api/metrics${queryString ? `?${queryString}` : ""}`,
    { signal },
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch financial data: ${response.status}`);
  }
  return response.json();
}

async function fetchMetricsFacets(signal?: AbortSignal): Promise<MetricsFacets> {
  const response = await fetch(`${API_BASE_URL}/api/metrics/facets`, { signal });
  if (!response.ok) {
    throw new Error(`Failed to fetch metrics facets: ${response.status}`);
  }
  return response.json();
}

async function fetchMetricsAlerts(
  threshold: number,
  startDate: string,
  endDate: string,
  signal?: AbortSignal,
): Promise<MetricsAlert[]> {
  const query = buildAlertsQuery(threshold, startDate, endDate);
  const response = await fetch(`${API_BASE_URL}/api/metrics/alerts?${query}`, {
    signal,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch metrics alerts: ${response.status}`);
  }
  return response.json();
}

function App() {
  const [metrics, setMetrics] = useState<KPIMetrics | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
  const [alerts, setAlerts] = useState<MetricsAlert[]>([]);
  const [facets, setFacets] = useState<MetricsFacets | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [alertThreshold, setAlertThreshold] = useState(0.3);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<"overview" | "comparison">("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchMetricsFacets(controller.signal)
      .then(setFacets)
      .catch(() => {
        if (!controller.signal.aborted) {
          setError(
            "No se pudo cargar la informacion financiera. Revisa la API de backend.",
          );
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchFinancialData(startDate, endDate, controller.signal)
      .then((movements) => {
        setMetrics(computeKPIs(movements));
        setMonthlyData(computeMonthlyData(movements));
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError(
            "No se pudo cargar la informacion financiera. Revisa la API de backend.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [startDate, endDate]);

  useEffect(() => {
    const controller = new AbortController();
    setAlertsLoading(true);
    setAlertsError(null);

    fetchMetricsAlerts(
      alertThreshold,
      startDate,
      endDate,
      controller.signal,
    )
      .then(setAlerts)
      .catch(() => {
        if (!controller.signal.aborted) {
          setAlertsError("No se pudieron cargar las alertas de anomalías.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setAlertsLoading(false);
      });

    return () => controller.abort();
  }, [alertThreshold, startDate, endDate]);

  const period = startDate || endDate
    ? `${startDate || "…"} – ${endDate || "…"}`
    : "All available dates";

  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <DashboardHeader period={period} />

          <nav aria-label="Dashboard pages" className="flex gap-2 border-b border-border">
            <button
              type="button"
              aria-current={activePage === "overview" ? "page" : undefined}
              className={`border-b-2 px-3 py-2 text-sm font-medium ${activePage === "overview" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
              onClick={() => setActivePage("overview")}
            >
              Resumen
            </button>
            <button
              type="button"
              aria-current={activePage === "comparison" ? "page" : undefined}
              className={`border-b-2 px-3 py-2 text-sm font-medium ${activePage === "comparison" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
              onClick={() => setActivePage("comparison")}
            >
              Comparativa B2B vs B2C
            </button>
          </nav>

          <section
            aria-label="Date range filter"
            className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-4 sm:flex-row sm:items-end sm:justify-between"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                Fecha de inicio
                <input
                  aria-label="Fecha de inicio"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  type="date"
                  value={startDate}
                  min={facets?.min_date}
                  max={endDate || facets?.max_date}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                Fecha de fin
                <input
                  aria-label="Fecha de fin"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  type="date"
                  value={endDate}
                  min={startDate || facets?.min_date}
                  max={facets?.max_date}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              Rango disponible: {facets ? `${facets.min_date} — ${facets.max_date}` : "cargando…"}
            </p>
          </section>

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground">
              {error}
            </div>
          ) : null}

          {activePage === "overview" ? (
            <>
              <section aria-label="Key performance indicators">
                <KPIRow metrics={metrics} loading={loading} />
              </section>

              <section
                aria-label="Financial charts"
                className="grid grid-cols-1 gap-4 xl:grid-cols-2"
              >
                <IncomeOutcomeChart data={monthlyData} loading={loading} />
                <ProfitPercentChart data={monthlyData} loading={loading} />
              </section>

              <section aria-label="Anomaly alerts">
                <AlertsTable
                  alerts={alerts}
                  threshold={alertThreshold}
                  loading={alertsLoading}
                  error={alertsError}
                  onThresholdChange={setAlertThreshold}
                />
              </section>
            </>
          ) : (
            <BusinessComparisonPage
              startDate={startDate}
              endDate={endDate}
              availableCategories={facets?.categories ?? []}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
