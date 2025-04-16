import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TaskMetric {
  label: string;
  value: number;
  change?: number;
  changeType?: "increase" | "decrease" | "neutral";
}

interface TaskMetricsProps {
  metrics: TaskMetric[];
}

export function TaskMetrics({ metrics }: TaskMetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.label}
            </CardTitle>
            {metric.change !== undefined && (
              <div
                className={`text-xs ${
                  metric.changeType === "increase"
                    ? "text-green-500"
                    : metric.changeType === "decrease"
                    ? "text-red-500"
                    : "text-gray-500"
                }`}
              >
                {metric.change > 0 && "+"}
                {metric.change}%
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-muted-foreground">
              {metric.changeType === "increase"
                ? "Increased from previous period"
                : metric.changeType === "decrease"
                ? "Decreased from previous period"
                : "No change from previous period"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}