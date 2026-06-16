import { useState, useEffect } from "react";
import { villageApi } from "../services/villageApi";
import { Village, VillageAnalysis } from "../types/Village";
import { Field } from "../types/Field";

export function useVillages(districtId?: number | null) {
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    villageApi.getVillages()
      .then((data) => {
        // Filter by district if provided
        const filtered = districtId 
          ? data.filter(v => v.district_id === districtId)
          : data;
        setVillages(filtered);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [districtId]);

  return { villages, loading, error };
}

export function useVillageFields(villageId: number | null) {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!villageId) {
      setFields([]);
      return;
    }
    setLoading(true);
    villageApi.getFieldsByVillage(villageId)
      .then((data) => {
        setFields(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [villageId]);

  return { fields, loading, error };
}
