import { useState, useEffect } from "react";
import { healthApi } from "../services/healthApi";
import { HealthSummary } from "../types/Health";

export function useHealth(villageId?: number | null) {
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [villageMetrics, setVillageMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    if (villageId) {
      healthApi.getVillageHealthMetrics(villageId)
        .then((data) => {
          setVillageMetrics(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err);
          setLoading(false);
        });
    } else {
      healthApi.getHealthSummary()
        .then((data) => {
          setHealthSummary(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err);
          setLoading(false);
        });
    }
  }, [villageId]);

  return { healthSummary, villageMetrics, loading, error };
}
