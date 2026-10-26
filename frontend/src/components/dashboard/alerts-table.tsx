import { useId, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type MetricsAlert } from "@/lib/financial-types";

const formatAlertAmount = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

interface AlertsTableProps {
  alerts: MetricsAlert[]
  threshold: number
  loading: boolean
  error: string | null
  onThresholdChange: (threshold: number) => void
}

function ThresholdInput({
  threshold,
  onThresholdChange,
}: {
  threshold: number;
  onThresholdChange: (threshold: number) => void;
}) {
  const [thresholdInput, setThresholdInput] = useState(String(threshold));

  return (
    <input
      aria-label="Umbral de alerta"
      className="h-9 w-24 rounded-md border border-input bg-background px-2 text-sm text-foreground"
      type="number"
      min={0.01}
      max={1}
      step={0.01}
      value={thresholdInput}
      onChange={(event) => {
        const input = event.target.value;
        setThresholdInput(input);
        const value = Number(input);
        if (input !== "" && Number.isFinite(value) && value >= 0.01 && value <= 1) {
          onThresholdChange(value);
        }
      }}
      onBlur={() => {
        const value = Number(thresholdInput);
        const normalized = thresholdInput === "" || !Number.isFinite(value)
          ? threshold
          : Math.min(1, Math.max(0.01, value));
        setThresholdInput(String(normalized));
        onThresholdChange(normalized);
      }}
    />
  );
}

export function AlertsTable({
  alerts,
  threshold,
  loading,
  error,
  onThresholdChange,
}: AlertsTableProps) {
  const titleId = useId();

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-2">
          <CardTitle as="h2" id={titleId} className="text-base font-semibold">Alertas de anomalías</CardTitle>
          <CardDescription>
            Períodos con gasto superior a la media de todos los períodos anteriores
          </CardDescription>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          Umbral
          <ThresholdInput
            key={threshold}
            threshold={threshold}
            onThresholdChange={onThresholdChange}
          />
        </label>
      </CardHeader>
      <CardContent>
        <p role="status" className="sr-only">
          {loading ? "Cargando alertas." : error ? "" : `${alerts.length} alertas para el umbral y rango seleccionados.`}
        </p>
        <div role="region" aria-label="Tabla de alertas de anomalías" tabIndex={0} className="overflow-x-auto">
          <table aria-labelledby={titleId} aria-busy={loading} className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-3">Período</th>
                <th scope="col" className="px-3 py-3 text-right">Egresos registrados</th>
                <th scope="col" className="px-3 py-3 text-right">Media de períodos anteriores</th>
                <th scope="col" className="px-3 py-3 text-right">Incremento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {error ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-destructive">
                    <p role="alert">{error}</p>
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                    Cargando alertas…
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                    No se detectaron anomalías para el umbral y rango seleccionados.
                  </td>
                </tr>
              ) : alerts.map((alert) => (
                <tr key={alert.period}>
                  <td className="px-3 py-3 font-medium text-foreground">{alert.period}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-foreground">
                    {formatAlertAmount(alert.outcome_total)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-foreground">
                    {formatAlertAmount(alert.baseline_average)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-foreground">
                    {(alert.increase_ratio * 100).toFixed(1)}%
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