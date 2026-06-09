import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';

const TOAST_DURATION = 5000;

const ToastCard: React.FC<{
    toastId: string;
    title: string;
    message: string;
    eventId?: string | null;
    onDismiss: (toastId: string) => void;
    onRead: () => Promise<void>;
}> = ({ toastId, title, message, eventId, onDismiss, onRead }) => {
    const [progress, setProgress] = useState(100);
    const [exiting, setExiting] = useState(false);
    const startRef = useRef<number>(Date.now());
    const rafRef = useRef<number>(0);
    const navigate = useNavigate();

    const startExit = () => {
        setExiting(true);
        setTimeout(() => onDismiss(toastId), 300);
    };

    useEffect(() => {
        const tick = () => {
            const elapsed = Date.now() - startRef.current;
            const remaining = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100);
            setProgress(remaining);
            if (remaining > 0) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                startExit();
            }
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleClick = async () => {
        await onRead();
        if (eventId) navigate(`/events/${eventId}`);
    };

    return (
        <div
            className="notification-toast"
            style={{
                opacity: exiting ? 0 : 1,
                transform: exiting ? 'translateX(110%)' : 'translateX(0)',
                transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}
        >
            <div className="toast-header-row">
                <span className="toast-dot" />
                <span className="toast-label">New notification</span>
                <button
                    className="toast-close"
                    aria-label="Dismiss"
                    onClick={(e) => { e.stopPropagation(); startExit(); }}
                >
                    ×
                </button>
            </div>

            <div
                className="toast-body"
                onClick={handleClick}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && handleClick()}
            >
                <p className="toast-title">{title}</p>
                <p className="toast-message">{message}</p>
            </div>

            <div className="toast-progress-track">
                <div className="toast-progress-bar" style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
};

const NotificationToastContainer: React.FC = () => {
    const { toastQueue, dismissToast, markToastAsRead } = useNotifications();

    if (toastQueue.length === 0) return null;

    return (
        <>
            <style>{`
                .notification-toast-stack {
                    position: fixed;
                    bottom: 1.5rem;
                    right: 1.5rem;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column-reverse;
                    gap: 0.75rem;
                    pointer-events: none;
                }
                .notification-toast {
                    pointer-events: all;
                    width: 340px;
                    background: #ffffff;
                    border-radius: 14px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08);
                    overflow: hidden;
                    border: 1px solid rgba(0,0,0,0.06);
                }
                .toast-header-row {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.6rem 0.9rem 0.4rem;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                }
                .toast-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #0d6efd;
                    flex-shrink: 0;
                }
                .toast-label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: #0d6efd;
                    flex: 1;
                }
                .toast-close {
                    background: none;
                    border: none;
                    font-size: 1.1rem;
                    line-height: 1;
                    color: #aaa;
                    cursor: pointer;
                    padding: 0 0.15rem;
                    transition: color 0.15s;
                }
                .toast-close:hover { color: #333; }
                .toast-body {
                    padding: 0.7rem 0.9rem 0.65rem;
                    cursor: pointer;
                    outline: none;
                }
                .toast-body:hover { background: #f8f9ff; }
                .toast-body:focus-visible { box-shadow: inset 0 0 0 2px #0d6efd44; }
                .toast-title {
                    margin: 0 0 0.2rem;
                    font-size: 0.92rem;
                    font-weight: 700;
                    color: #111;
                    line-height: 1.3;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .toast-message {
                    margin: 0;
                    font-size: 0.82rem;
                    color: #555;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .toast-progress-track {
                    height: 3px;
                    background: #e9ecef;
                }
                .toast-progress-bar {
                    height: 100%;
                    background: #0d6efd;
                    transition: width 0.1s linear;
                    border-radius: 0 2px 2px 0;
                }
                @media (prefers-reduced-motion: reduce) {
                    .notification-toast { transition: none !important; }
                    .toast-progress-bar { transition: none !important; }
                }
                @media (max-width: 480px) {
                    .notification-toast-stack {
                        bottom: 0; right: 0; left: 0;
                        padding: 0 0.75rem 0.75rem;
                    }
                    .notification-toast { width: 100%; }
                }
            `}</style>

            <div className="notification-toast-stack" aria-live="polite" aria-atomic="false">
                {toastQueue.map(toast => (
                    <ToastCard
                        key={toast.toastId}
                        toastId={toast.toastId}
                        title={toast.title}
                        message={toast.message}
                        eventId={toast.event_id}
                        onDismiss={dismissToast}
                        onRead={() => markToastAsRead(toast)}
                    />
                ))}
            </div>
        </>
    );
};

export default NotificationToastContainer;