import { useState, useEffect } from "react";
import { ndviApi } from "../services/ndviApi";
import { NDVITrend } from "../types/NDVI";

export function useNDVI(type: "state" | "district" | "village", targetId?: number | null) {
  const [ndviHistory, setNdviHistory] = useState<NDVITrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    let promise;

    if (type === "state") {
      promise = ndviApi.getStatewideNdviTrend();
    } else if (type === "district" && targetId) {
      promise = ndviApi.getDistrictNdvi(targetId);
    } else if (type === "village" && targetId) {
      promise = ndviApi.getVillageNdvi(targetId);
    } else {
      setNdviHistory([]);
      setLoading(false);
      return;
    }

    promise
      .then((data) => {
        setNdviHistory(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [type, targetId]);

  return { ndviHistory, loading, error };
}
