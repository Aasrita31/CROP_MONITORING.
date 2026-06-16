import { useState, useEffect } from "react";
import { dashboardApi } from "../services/dashboardApi";
import { Alert, VillageComparison, HealthSummary } from "../types/Health";

export function useDashboard() {
  const [overview, setOverview] = useState<any>(null);
  const [riceBowlIndex, setRiceBowlIndex] = useState<HealthSummary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [comparison, setComparison] = useState<VillageComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      dashboardApi.getOverview(),
      dashboardApi.getRiceBowlIndex(),
      dashboardApi.getAlerts(),
      dashboardApi.getComparison()
    ])
      .then(([oData, rData, aData, cData]) => {
        setOverview(oData);
        setRiceBowlIndex(rData);
        setAlerts(aData);
        setComparison(cData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { overview, riceBowlIndex, alerts, comparison, loading, error };
}
