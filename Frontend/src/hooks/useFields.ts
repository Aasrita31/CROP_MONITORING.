import { useState, useEffect } from "react";
import { fieldApi } from "../services/fieldApi";
import { Field, FieldHealth } from "../types/Field";
import { FieldNDVIHistory } from "../types/NDVI";

export function useFieldDetails(fieldId: string | null) {
  const [field, setField] = useState<Field | null>(null);
  const [health, setHealth] = useState<FieldHealth | null>(null);
  const [ndviHistory, setNdviHistory] = useState<FieldNDVIHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!fieldId) {
      setField(null);
      setHealth(null);
      setNdviHistory(null);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([
      fieldApi.getFieldById(fieldId),
      fieldApi.getFieldHealth(fieldId),
      fieldApi.getFieldNdvi(fieldId)
    ])
      .then(([fData, hData, nData]) => {
        setField(fData);
        setHealth(hData);
        setNdviHistory(nData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [fieldId]);

  return { field, health, ndviHistory, loading, error };
}
