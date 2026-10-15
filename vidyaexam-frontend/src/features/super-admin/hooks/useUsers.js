import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchUsers } from "../services/user.service";

/**
 * Custom hook to fetch and manage users list from /super-admin/users.
 */
export default function useUsers() {
  const [attempt, setAttempt] = useState({ n: 0, force: false });
  const [state, setState] = useState({
    status: "loading",
    users: [],
    pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
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

    fetchUsers({ signal: controller.signal })
      .then((res) => {
        if (!cancelled) {
          setState({
            status: "ready",
            users: res.data,
            pagination: res.pagination,
            errorKind: "",
            errorMessage: "",
          });
        }
      })
      .catch((err) => {
        if (cancelled || err?.name === "CanceledError") return;
        setState({
          status: "error",
          users: [],
          pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
          errorKind: err?.kind || "network",
          errorMessage: err?.message || "Failed to load users",
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

  // Aggregated role and status counts
  const counts = useMemo(() => {
    const users = state.users || [];
    return {
      total: state.pagination?.total || users.length,
      active: users.filter((u) => u.isActive).length,
      students: users.filter((u) => u.defaultRole === "STUDENT").length,
      teachers: users.filter((u) => u.defaultRole === "TEACHER").length,
      admins: users.filter((u) => u.defaultRole === "ADMIN").length,
      superAdmins: users.filter((u) => u.defaultRole === "SUPER_ADMIN").length,
      unassigned: users.filter((u) => !u.defaultRole || u.defaultRole === "UNASSIGNED").length,
      verified: users.filter((u) => u.emailVerified).length,
    };
  }, [state.users, state.pagination]);

  return {
    ...state,
    counts,
    retry,
    refresh,
  };
}
