import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import {
  getLiveDiscussionMessages,
  joinLiveDiscussion,
  leaveLiveDiscussion,
  requestLiveDiscussionSocketToken,
} from "../../api/liveDiscussions";
import { SOCKET_BASE_URL } from "../../api";

const MESSAGE_LOAD_STEP = 40;

const formatTime = (value) => {
  if (!value) {
    return "";
  }
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export function LiveDiscussionPanel({ discussion, onClose, onMembershipChange }) {
  const [isJoined, setIsJoined] = useState(Boolean(discussion?.isJoined));
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [participantCount, setParticipantCount] = useState(
    discussion?.participantsCount || 0
  );
  const [currentUserId, setCurrentUserId] = useState(null);

  const socketRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const listContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setIsJoined(Boolean(discussion?.isJoined));
    setParticipantCount(discussion?.participantsCount || 0);
  }, [discussion?.id, discussion?.isJoined, discussion?.participantsCount]);

  const scrollToBottom = (behavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom(messages.length > 40 ? "auto" : "smooth");
    }
  }, [messages]);

  useEffect(() => {
    shouldAutoScrollRef.current = true;
  }, [discussion?.id]);

  useEffect(() => {
    if (!discussion?.id) {
      return;
    }

    let didCancel = false;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const response = await getLiveDiscussionMessages(discussion.id, {
          limit: MESSAGE_LOAD_STEP,
        });
        if (didCancel) {
          return;
        }
        setMessages(response.messages || []);
        setHasMore(Boolean(response.hasMore));
        shouldAutoScrollRef.current = true;
      } catch (error) {
        if (!didCancel) {
          toast.error(error.message || "Failed to load messages.");
        }
      } finally {
        if (!didCancel) {
          setLoadingMessages(false);
        }
      }
    };

    loadMessages();

    return () => {
      didCancel = true;
      setMessages([]);
      setHasMore(false);
    };
  }, [discussion?.id]);

  const connectSocket = async () => {
    if (!isJoined || !discussion?.id) {
      return;
    }

    try {
      const { token, userId } = await requestLiveDiscussionSocketToken();

      setCurrentUserId(userId || null);

      const socket = io(SOCKET_BASE_URL, {
        transports: ["websocket", "polling"],
        withCredentials: true,
        auth: {
          token,
        },
      });

      socket.on("connect_error", (error) => {
        toast.error(error?.message || "Unable to connect to discussion.");
      });

      socket.on("discussion:error", (payload) => {
        if (payload?.message) {
          toast.error(payload.message);
        }
        if (payload?.tempId) {
          setMessages((prev) =>
            prev.filter((message) => message.tempId !== payload.tempId)
          );
        }
        setSending(false);
      });

      socket.on("discussion:message", (payload) => {
        setMessages((prev) => {
          const next = payload.tempId
            ? prev.filter((message) => message.tempId !== payload.tempId)
            : [...prev];
          next.push(payload);
          return next;
        });
        setSending(false);
      });

      socket.on("connect", () => {
        socket.emit("discussion:join", { discussionId: discussion.id });
      });

      socketRef.current = socket;
    } catch (error) {
      toast.error(error?.message || "Unable to start live chat.");
    }
  };

  useEffect(() => {
    if (!isJoined) {
      if (socketRef.current) {
        socketRef.current.emit("discussion:leave", { discussionId: discussion?.id });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("discussion:leave", { discussionId: discussion?.id });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isJoined, discussion?.id]);

  const handleLoadMore = async () => {
    if (!discussion?.id || !hasMore || loadingMessages) {
      return;
    }

    setLoadingMessages(true);
    try {
      const firstMessage = messages[0];
      const response = await getLiveDiscussionMessages(discussion.id, {
        limit: MESSAGE_LOAD_STEP,
        before: firstMessage ? firstMessage.createdAt : undefined,
      });

      setMessages((prev) => [...(response.messages || []), ...prev]);
      setHasMore(Boolean(response.hasMore));
      shouldAutoScrollRef.current = false;
    } catch (error) {
      toast.error(error.message || "Failed to load earlier messages.");
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleJoin = async () => {
    try {
      const response = await joinLiveDiscussion(discussion.id);
      setIsJoined(true);
      setParticipantCount(response?.discussion?.participantsCount ?? participantCount + 1);
      toast.success("Joined discussion");
      if (typeof onMembershipChange === "function") {
        onMembershipChange({
          discussionId: discussion.id,
          isJoined: true,
          participantsCount: response?.discussion?.participantsCount ?? participantCount + 1,
        });
      }
    } catch (error) {
      toast.error(error.message || "Unable to join.");
    }
  };

  const handleLeave = async () => {
    try {
      const response = await leaveLiveDiscussion(discussion.id);
      setIsJoined(false);
      setParticipantCount(
        response?.discussion?.participantsCount ?? Math.max(participantCount - 1, 0)
      );
      toast.success("Left discussion");
      if (typeof onMembershipChange === "function") {
        onMembershipChange({
          discussionId: discussion.id,
          isJoined: false,
          participantsCount: response?.discussion?.participantsCount ?? Math.max(participantCount - 1, 0),
        });
      }
    } catch (error) {
      toast.error(error.message || "Unable to leave.");
    }
  };

  const handleSendMessage = () => {
    const trimmed = messageInput.trim();
    if (!trimmed || sending || !socketRef.current) {
      return;
    }

    const tempId = `${discussion.id}-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      tempId,
      discussionId: discussion.id,
      content: trimmed,
      createdAt: new Date().toISOString(),
      sender: {
        id: currentUserId || "self",
        firstName: "You",
        lastName: "",
      },
      optimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageInput("");
    setSending(true);

    socketRef.current.emit("discussion:message", {
      discussionId: discussion.id,
      content: trimmed,
      tempId,
    });

    setTimeout(() => {
      setSending(false);
    }, 150);
  };

  const handleMessageInputKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessages = useMemo(() => {
    return messages.map((message) => {
      const isSelf = currentUserId
        ? String(message.sender?.id) === String(currentUserId)
        : message.sender?.id === "self";

      const senderLabelRaw = isSelf
        ? "You"
        : `${message.sender?.firstName ?? ""} ${message.sender?.lastName ?? ""}`.trim();
      const displayLabel = senderLabelRaw.length > 0 ? senderLabelRaw.replace(/\s+/g, " ") : "Participant";

      const bubbleBaseClasses = "max-w-[90%] md:max-w-[80%] inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap break-words";
      const bubbleVariantClasses = isSelf
        ? "rounded-br-sm bg-gradient-to-r from-orange-500 to-orange-400 text-white"
        : "rounded-bl-sm bg-white text-slate-800 border border-slate-100";
      const bubbleClasses = `${bubbleBaseClasses} ${bubbleVariantClasses}`;
      const messageWrapperClasses = `flex ${isSelf ? "justify-end" : "justify-start"}`;
      const metaColor = isSelf ? "text-white/70" : "text-slate-500";

      return (
        <div key={message.id} className={messageWrapperClasses}>
          <div className={`flex w-full max-w-full flex-col gap-1 ${isSelf ? "items-end text-right" : "items-start"}`}>
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${isSelf ? "text-orange-500" : "text-slate-500"}`}>
              {displayLabel}
            </span>
            <div className={bubbleClasses}>
              <p>{message.content}</p>
              <span className={`mt-1 block text-[11px] ${metaColor}`}>{formatTime(message.createdAt)}</span>
            </div>
          </div>
        </div>
      );
    });
  }, [messages, currentUserId]);

  return (
    <section className="flex h-full w-full flex-col rounded-3xl border border-orange-100 bg-gradient-to-b from-rose-50/60 to-white shadow-2xl">
      <header className="flex items-center justify-between rounded-t-3xl border-b border-orange-100 bg-white/90 px-6 py-5">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-600">
            {discussion.topicTag || "Campus"}
          </span>
          <h2 className="text-xl font-semibold text-slate-900">{discussion.title}</h2>
          <p className="text-sm text-slate-500">{discussion.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow">
            {participantCount} participant{participantCount === 1 ? "" : "s"}
          </div>
          {isJoined ? (
            <button
              type="button"
              onClick={handleLeave}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            >
              Leave discussion
            </button>
          ) : (
            <button
              type="button"
              onClick={handleJoin}
              className="rounded-full bg-gradient-to-r from-orange-500 to-orange-400 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:from-orange-600 hover:to-orange-500"
            >
              Join discussion
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-transparent p-2 text-slate-400 transition hover:text-slate-600"
            aria-label="Close discussion"
          >
            X
          </button>
        </div>
      </header>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div
          ref={listContainerRef}
          className="flex-1 overflow-y-auto bg-gradient-to-b from-white via-orange-50/40 to-white px-6 py-6"
          onScroll={(event) => {
            const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
            const nearBottom = scrollHeight - (scrollTop + clientHeight) < 80;
            shouldAutoScrollRef.current = nearBottom;
          }}
        >
          <div className="mx-auto flex w-full max-w-4xl flex-col space-y-4">
            {hasMore && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMessages}
                  className="rounded-full border border-orange-200 px-4 py-1 text-xs font-semibold text-orange-500 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingMessages ? "Loading..." : "Load previous messages"}
                </button>
              </div>
            )}
            {renderMessages}
            <span ref={messagesEndRef} />
          </div>
        </div>
        <footer className="border-t border-orange-100 bg-white/90 px-6 py-4">
          {isJoined ? (
            <div className="flex items-end gap-3">
              <textarea
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
                onKeyDown={handleMessageInputKeyDown}
                placeholder="Share an update or ask a question"
                rows={1}
                className="min-h-[52px] flex-1 resize-none rounded-2xl border border-orange-100 px-4 py-3 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || sending}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:from-orange-600 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Send
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 p-5 text-sm text-orange-600">
              Join this discussion to start chatting in real time.
            </div>
          )}
        </footer>
      </div>
    </section>
  );
}
