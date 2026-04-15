import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_URL from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import './NotificationsDropdown.css';

const NotificationsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const socket = useSocket();

  useEffect(() => {
    fetchNotifications();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNewNotification = (payload) => {
        setNotifications((prev) => [payload, ...prev]);
        setUnreadCount((prev) => prev + 1);
      };
      socket.on('notification', handleNewNotification);
      return () => {
        socket.off('notification', handleNewNotification);
      };
    }
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notifications`);
      console.log('API Response (notifications):', response.data);
      const fetchedNotifs = Array.isArray(response.data.data) ? response.data.data : [];
      setNotifications(fetchedNotifs);
      setUnreadCount(fetchedNotifs.filter((n) => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkAsRead = async (id, currentReadStatus) => {
    if (currentReadStatus) return;
    try {
      await axios.put(`${API_URL}/api/notifications/${id}/read`);
      setNotifications((prev) =>
        (Array.isArray(prev) ? prev : []).map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await axios.put(`${API_URL}/api/notifications/read-all`);
      setNotifications((prev) =>
        (Array.isArray(prev) ? prev : []).map((n) => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read', error);
    }
  };

  const handleOpenNotificationLink = async (event, notif) => {
    event.stopPropagation();
    await handleMarkAsRead(notif._id, notif.read);
    if (notif.link) {
      window.location.href = notif.link;
    }
  };

  const handleAcceptHire = async (event, notif) => {
    event.stopPropagation();
    try {
      const response = await axios.put(`${API_URL}/api/notifications/${notif._id}/accept-hire`);
      setNotifications((prev) =>
        (Array.isArray(prev) ? prev : []).map((n) =>
          n._id === notif._id
            ? { ...n, actionStatus: 'accepted', read: true }
            : n
        )
      );
      if (!notif.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      if (response.data?.data?.sender) {
        // no-op: backend already emits notification to customer in realtime
      }
    } catch (error) {
      console.error('Error accepting direct hire:', error);
    }
  };

  return (
    <div className="notifications-container" ref={dropdownRef}>
      <motion.button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <motion.div
            className="unread-badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="notifications-dropdown glass-panel"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="dropdown-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <button className="mark-all-btn" onClick={handleMarkAllAsRead}>
                  Mark all as read
                </button>
              )}
            </div>

            <div className="notifications-list">
              {(!Array.isArray(notifications) || notifications.length === 0) ? (
                <div className="empty-state">No notifications yet.</div>
              ) : (
                (Array.isArray(notifications) ? notifications : []).map((notif) => (
                  <div
                    key={notif._id}
                    className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                    onClick={() => handleMarkAsRead(notif._id, notif.read)}
                  >
                    {!notif.read && <div className="unread-dot"></div>}
                    <div className="notification-content">
                      {notif.type === 'direct_hire_request' && (
                        <span className="notif-chip">Direct Hire</span>
                      )}
                      <h4 className="notif-title">{notif.title}</h4>
                      <p className="notif-message">{notif.message}</p>
                      <div className="notif-footer">
                        <span className="notif-time">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                        {notif.link && (
                          <button
                            type="button"
                            className="notif-link-btn"
                            onClick={(event) => handleOpenNotificationLink(event, notif)}
                          >
                            View
                          </button>
                        )}
                        {notif.type === 'direct_hire_request' && (
                          <button
                            type="button"
                            className="notif-link-btn"
                            onClick={(event) => handleAcceptHire(event, notif)}
                            disabled={notif.actionStatus === 'accepted'}
                          >
                            {notif.actionStatus === 'accepted' ? 'Accepted' : 'Accept'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="dropdown-footer">
              <button className="view-all-btn" onClick={() => setIsOpen(false)}>
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsDropdown;
