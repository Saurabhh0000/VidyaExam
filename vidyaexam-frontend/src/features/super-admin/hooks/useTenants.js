import { useCallback, useEffect, useState } from "react";
import { fetchTenants } from "../services/tenant.service";

/**
 * Custom hook to fetch and manage tenants list from /super-admin/tenants.
 *
 * @returns {{
 *   status: "loading" | "ready" | "error",
 *   tenants: Array<object>,
 *   count: number,
 *   errorKind: string,
 *   errorMessage: string,
 *   retry: () => void,
 *   refresh: () => void
 * }}
 */
export default function useTenants() {
  const [attempt, setAttempt] = useState({ n: 0, force: false });
  const [state, setState] = useState({
    status: "loading",
    tenants: [],
    count: 0,
    errorKind: "",
    errorMessage: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    setState((prev) => ({
      ...prev,
      status: "loading",
      errorKind: "",
      errorMessage: "",
    }));

    fetchTenants({ signal: controller.signal })
      .then((res) => {
        if (!cancelled) {
          setState({
            status: "ready",
            tenants: res.data,
            count: res.count,
            errorKind: "",
            errorMessage: "",
          });
        }
      })
      .catch((err) => {
        if (cancelled || err?.name === "CanceledError") return;
        setState({
          status: "error",
          tenants: [],
          count: 0,
          errorKind: err?.kind || "network",
          errorMessage: err?.message || "Failed to load tenants",
        });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setAttempt((a) => ({ n: a.n + 1, force: true }));
  }, []);

  const refresh = useCallback(() => {
    setAttempt((a) => ({ n: a.n + 1, force: true }));
  }, []);

  return {
    ...state,
    retry,
    refresh,
  };
}
