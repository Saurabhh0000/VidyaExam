import { useCallback, useEffect, useState } from "react";
import { getPlans } from "../services/subscription.service";

/**
 * -> { status: "loading" | "ready" | "error", plans, errorKind, retry }
 * plans = { individual: Plan[], tenant: Plan[] } once ready.
 */
export default function usePlans() {
  const [attempt, setAttempt] = useState({ n: 0, force: false });
  const [state, setState] = useState({ status: "loading", plans: null, errorKind: "" });

  useEffect(() => {
    let cancelled = false;
    getPlans({ force: attempt.force })
      .then((plans) => {
        if (!cancelled) setState({ status: "ready", plans, errorKind: "" });
      })
      .catch((error) => {
        if (!cancelled) {
          setState({ status: "error", plans: null, errorKind: error?.kind ?? "network" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading", plans: null, errorKind: "" });
    setAttempt((a) => ({ n: a.n + 1, force: true }));
  }, []);

  return { ...state, retry };
}