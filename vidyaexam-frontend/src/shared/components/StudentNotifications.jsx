import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, RefreshCw, X } from "lucide-react";
import toast from "./ui/toast";
import {
  deleteNotification,
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../features/notifications/services/notifications.service";

function formatNotificationDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function StudentNotifications() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyIds, setBusyIds] = useState(() => new Set());
  const [markingAll, setMarkingAll] = useState(false);
  const rootRef = useRef(null);
  const loadedRef = useRef(false);

  const loadNotifications = useCallback(async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    try {
      const result = await getMyNotifications();
      setNotifications(result.data);
      setUnreadCount(result.unreadCount);
      loadedRef.current = true;
    } catch (error) {
      if (!loadedRef.current) setNotifications([]);
      toast.error("Notifications could not be loaded.", {
        description: error?.message || "Please try again.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    getMyNotifications({ signal: controller.signal })
      .then((result) => {
        setNotifications(result.data);
        setUnreadCount(result.unreadCount);
        loadedRef.current = true;
      })
      .catch((error) => {
        if (error?.name !== "CanceledError" && error?.code !== "ERR_CANCELED") {
          toast.error("Notifications could not be loaded.", {
            description: error?.message || "Please try again.",
          });
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const setBusy = (id, busy) => {
    setBusyIds((current) => {
      const next = new Set(current);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  async function handleNotificationClick(notification) {
    const id = notification.notification_id;
    if (!id || notification.is_read || busyIds.has(id)) return;
    setBusy(id, true);
    try {
      await markNotificationAsRead(id);
      setNotifications((current) =>
        current.map((item) =>
          item.notification_id === id
            ? { ...item, is_read: true, read_at: new Date().toISOString() }
            : item,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      toast.error("Notification could not be marked as read.", {
        description: error?.message || "Please try again.",
      });
    } finally {
      setBusy(id, false);
    }
  }

  async function handleDismiss(event, notification) {
    event.stopPropagation();
    const id = notification.notification_id;
    if (!id || busyIds.has(id)) return;
    setBusy(id, true);
    try {
      await deleteNotification(id);
      setNotifications((current) => current.filter((item) => item.notification_id !== id));
      if (!notification.is_read) setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      toast.error("Notification could not be dismissed.", {
        description: error?.message || "Please try again.",
      });
    } finally {
      setBusy(id, false);
    }
  }

  async function handleMarkAllRead() {
    if (!unreadCount || markingAll) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read.");
    } catch (error) {
      toast.error("Notifications could not be marked as read.", {
        description: error?.message || "Please try again.",
      });
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="ve-student-notifications" ref={rootRef}>
      <button
        type="button"
        className="ve-notifications-trigger"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}>
        <Bell size={19} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="ve-notifications-count">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section className="ve-notifications-panel" role="dialog" aria-label="Notifications">
          <header className="ve-notifications-header">
            <div>
              <h2>Notifications</h2>
              <p>{unreadCount ? `${unreadCount} unread` : "You’re all caught up"}</p>
            </div>
            <div className="ve-notifications-header-actions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="ve-notifications-mark-all"
                  onClick={handleMarkAllRead}
                  disabled={markingAll}>
                  <CheckCheck size={15} aria-hidden="true" />
                  <span>{markingAll ? "Saving…" : "Mark all read"}</span>
                </button>
              )}
              <button
                type="button"
                className="ve-notifications-refresh"
                aria-label="Refresh notifications"
                onClick={() => loadNotifications({ quiet: true })}
                disabled={refreshing}>
                <RefreshCw size={16} aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="ve-notifications-list">
            {loading ? (
              <div className="ve-notifications-state">Loading notifications…</div>
            ) : notifications.length === 0 ? (
              <div className="ve-notifications-state">
                <span className="ve-notifications-empty-icon"><Bell size={20} aria-hidden="true" /></span>
                <strong>No notifications yet</strong>
                <span>New exam updates will appear here.</span>
              </div>
            ) : (
              notifications.map((notification) => {
                const id = notification.notification_id;
                return (
                  <article
                    key={id}
                    className={`ve-notification-item${notification.is_read ? " is-read" : " is-unread"}`}>
                    <button
                      type="button"
                      className="ve-notification-content"
                      onClick={() => handleNotificationClick(notification)}
                      disabled={busyIds.has(id)}>
                      <span className="ve-notification-indicator" aria-hidden="true" />
                      <span className="ve-notification-copy">
                        <strong>{notification.title}</strong>
                        <span>{notification.message}</span>
                        <time dateTime={notification.created_at}>{formatNotificationDate(notification.created_at)}</time>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="ve-notification-dismiss"
                      aria-label={`Dismiss ${notification.title || "notification"}`}
                      onClick={(event) => handleDismiss(event, notification)}
                      disabled={busyIds.has(id)}>
                      <X size={17} aria-hidden="true" />
                    </button>
                  </article>
                );
              })
            )}
          </div>
        </section>
      )}
    </div>
  );
}
