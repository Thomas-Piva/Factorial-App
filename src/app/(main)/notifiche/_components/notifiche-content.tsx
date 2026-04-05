'use client'

import { useCurrentUser } from '@/lib/queries/users'
import { useNotifications } from '@/lib/queries/notifications'
import { useMarkAsRead, useMarkAllAsRead } from '@/lib/mutations/notifications'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import type { Notification } from '@/types/database'

// ── Format date as DD/MM/YYYY ─────────────────────────────────────────────────
function formatDate(iso: string): string {
  const [year, month, day] = iso.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NotificheContent() {
  const { data: user } = useCurrentUser()
  const { data: notifications = [], isLoading } = useNotifications(user?.id)
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

  const unreadCount = notifications.filter((n) => !n.is_read).length

  function handleNotificationClick(notification: Notification) {
    if (!notification.is_read) {
      markAsRead.mutate({ id: notification.id })
    }
  }

  function handleMarkAllRead() {
    if (user) {
      markAllAsRead.mutate({ userId: user.id })
    }
  }

  return (
    <div data-testid="notifiche-page" className="px-6 pt-8 pb-6 max-w-lg mx-auto">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-primary tracking-tighter">
          Notifiche
        </h1>
        {unreadCount > 0 && (
          <button
            data-testid="mark-all-read-btn"
            onClick={handleMarkAllRead}
            className="text-sm font-medium text-primary hover:opacity-80 transition-opacity"
          >
            Segna tutto come letto
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner />
      ) : notifications.length === 0 ? (
        <div data-testid="notifiche-empty">
          <EmptyState icon="notifications_off" title="Nessuna notifica" />
        </div>
      ) : (
        <ul data-testid="notifiche-list" className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <button
                data-testid={`notif-${notification.id}`}
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className="w-full text-left flex items-start gap-3 bg-surface-container-lowest rounded-3xl px-4 py-3 shadow-sm hover:bg-surface-container transition-colors"
              >
                {/* Unread dot indicator */}
                {!notification.is_read && (
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm text-on-surface${!notification.is_read ? ' font-bold' : ''}`}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {notification.body}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {formatDate(notification.created_at)}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
