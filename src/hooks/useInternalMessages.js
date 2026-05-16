import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getFirestore, onSnapshot, query, where } from 'firebase/firestore';
import {
  getStudentTeacherRelationships,
  isMessageUnreadForUser,
  markMessageRead,
  sendInternalMessage,
  sortMessagesNewestFirst,
} from '../services/internalMessages';

const getMessagePermissionError = () => (
  'Messaging is not available yet. Please deploy the updated Firestore rules and try again.'
);

export const useInternalMessages = ({
  appId,
  userId,
  enabled = true,
  suppressPermissionErrors = false,
} = {}) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled && userId));
  const [error, setError] = useState(null);
  const db = getFirestore();

  useEffect(() => {
    if (!enabled || !appId || !userId) {
      setMessages([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError(null);

    const messagesRef = collection(db, 'artifacts', appId, 'messages');
    const messagesQuery = query(messagesRef, where('participantIds', 'array-contains', userId));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const nextMessages = snapshot.docs.map((messageDoc) => ({
        id: messageDoc.id,
        ...messageDoc.data(),
      }));
      setMessages(sortMessagesNewestFirst(nextMessages));
      setLoading(false);
    }, (err) => {
      console.error('[useInternalMessages] Failed to load messages', err);
      if (err?.code === 'permission-denied') {
        setMessages([]);
        setError(suppressPermissionErrors ? null : getMessagePermissionError());
      } else {
        setError(err?.message || 'Failed to load messages');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [appId, db, enabled, suppressPermissionErrors, userId]);

  const unreadCount = useMemo(() => (
    messages.filter((message) => isMessageUnreadForUser(message, userId)).length
  ), [messages, userId]);

  const sendMessage = useCallback((messageInput) => (
    sendInternalMessage({ db, appId, ...messageInput })
  ), [appId, db]);

  const markRead = useCallback((messageId) => (
    markMessageRead({ db, appId, messageId, userId })
  ), [appId, db, userId]);

  return {
    messages,
    loading,
    error,
    unreadCount,
    sendMessage,
    markRead,
  };
};

export const useUnreadMessageCount = ({ appId, userId, enabled = true }) => {
  const { unreadCount } = useInternalMessages({
    appId,
    userId,
    enabled,
    suppressPermissionErrors: true,
  });
  return unreadCount;
};

export const useStudentTeacherRelationships = ({ appId, studentId, enabled = true }) => {
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled && studentId));
  const [error, setError] = useState(null);
  const db = getFirestore();

  useEffect(() => {
    let cancelled = false;

    const loadRelationships = async () => {
      if (!enabled || !appId || !studentId) {
        setRelationships([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const nextRelationships = await getStudentTeacherRelationships({ db, appId, studentId });
        if (!cancelled) {
          setRelationships(nextRelationships);
        }
      } catch (err) {
        console.error('[useStudentTeacherRelationships] Failed to load relationships', err);
        if (!cancelled) {
          setError(err?.message || 'Failed to load teachers');
          setRelationships([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRelationships();

    return () => {
      cancelled = true;
    };
  }, [appId, db, enabled, studentId]);

  return { relationships, loading, error };
};

export default useInternalMessages;
