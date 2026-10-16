import { useCallback, useEffect, useState } from "react";
import { getTopics } from "../../../shared/services/taxonomy.service";
import { getQuestions } from "../services/question.service";

export default function useQuestionBankData(role, tenantId, { loadTopics = true } = {}) {
  const [questions, setQuestions] = useState([]);
  const [count, setCount] = useState(0);
  const [topics, setTopics] = useState([]);
  const [status, setStatus] = useState("loading");
  const [topicsStatus, setTopicsStatus] = useState("loading");
  const [error, setError] = useState("");
  const [topicsError, setTopicsError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [topicsRefreshVersion, setTopicsRefreshVersion] = useState(0);

  const refresh = useCallback(() => setRefreshVersion((value) => value + 1), []);
  const refreshTopics = useCallback(() => setTopicsRefreshVersion((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    if (role !== "SUPER_ADMIN" && !tenantId) {
      setQuestions([]);
      setCount(0);
      setStatus("error");
      setError("No active organization is linked to this account. Select an organization and try again.");
      return () => controller.abort();
    }

    setStatus("loading");
    setError("");
    getQuestions(role === "SUPER_ADMIN" ? "" : tenantId, { signal: controller.signal })
      .then((result) => {
        setQuestions(result.data);
        setCount(result.count);
        setStatus("ready");
      })
      .catch((requestError) => {
        if (requestError?.name === "CanceledError") return;
        setError(requestError?.message || "Questions could not be loaded.");
        setStatus("error");
      });

    return () => controller.abort();
  }, [role, tenantId, refreshVersion]);

  useEffect(() => {
    const controller = new AbortController();
    if (!loadTopics) {
      setTopics([]);
      setTopicsError("");
      setTopicsStatus("ready");
      return () => controller.abort();
    }
    setTopicsStatus("loading");
    setTopicsError("");
    getTopics({ signal: controller.signal })
      .then((result) => {
        setTopics(Array.isArray(result?.data) ? result.data : []);
        setTopicsStatus("ready");
      })
      .catch((requestError) => {
        if (requestError?.name === "CanceledError") return;
        setTopicsError(requestError?.message || "Topics could not be loaded.");
        setTopicsStatus("error");
      });
    return () => controller.abort();
  }, [role, tenantId, loadTopics, topicsRefreshVersion]);

  return {
    questions,
    count,
    topics,
    status,
    topicsStatus,
    error,
    topicsError,
    refresh,
    refreshTopics,
  };
}
