import { useState, useEffect } from "react";
import { districtApi } from "../services/districtApi";
import { District } from "../types/District";

export function useDistricts() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    districtApi.getDistricts()
      .then((data) => {
        setDistricts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { districts, loading, error };
}
export default useDistricts;
