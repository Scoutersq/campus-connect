import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  createLiveDiscussion,
  getLiveDiscussions,
} from "../../api/liveDiscussions";
import { DiscussionCard } from "../../components/discussions/DiscussionCard";
import { LiveDiscussionPanel } from "../../components/discussions/LiveDiscussionPanel";
import { CreateDiscussionModal } from "../../components/discussions/CreateDiscussionModal";

export default function DiscussionsPage() {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let didCancel = false;

    const loadDiscussions = async () => {
      setLoading(true);
      try {
        const response = await getLiveDiscussions({ limit: 30 });
        if (!didCancel) {
          setDiscussions(response.discussions || []);
          if (!response.discussions?.length) {
            setSelectedId(null);
          }
        }
      } catch (error) {
        if (!didCancel) {
          toast.error(error.message || "Unable to load discussions.");
        }
      } finally {
        if (!didCancel) {
          setLoading(false);
        }
      }
    };

    loadDiscussions();

    return () => {
      didCancel = true;
    };
  }, []);

  const selectedDiscussion = useMemo(
    () => discussions.find((item) => item.id === selectedId) || null,
    [discussions, selectedId]
  );

  const handleSelectDiscussion = (discussion) => {
    setSelectedId(discussion?.id || null);
  };

  const handleCreateDiscussion = async ({ title, description, topicTag }) => {
    try {
      setCreating(true);
      const response = await createLiveDiscussion({ title, description, topicTag });
      const createdDiscussion = response.discussion;
      setDiscussions((prev) => [createdDiscussion, ...prev]);
      setSelectedId(createdDiscussion.id);
      toast.success("Discussion created");
      setModalOpen(false);
    } catch (error) {
      toast.error(error.message || "Unable to create discussion.");
    } finally {
      setCreating(false);
    }
  };

  const handleMembershipChange = ({ discussionId, isJoined, participantsCount }) => {
    setDiscussions((prev) =>
      prev.map((item) =>
        item.id === discussionId
          ? {
              ...item,
              isJoined,
              participantsCount,
            }
          : item
      )
    );
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex flex-col justify-between gap-4 rounded-3xl border border-orange-100 bg-gradient-to-r from-orange-50 to-white px-8 py-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Discussions</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Connect and engage with your community. Join live threads to swap ideas, plan events, or
            get quick help from classmates.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:from-orange-600 hover:to-orange-500"
        >
          <span className="text-lg">+</span>
          New Discussion
        </button>
      </header>

      <section className="flex flex-1 flex-col gap-4 overflow-hidden rounded-3xl border border-orange-100 bg-white/80 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Browse discussions
          </h2>
          {!loading && (
            <span className="text-xs text-slate-400">
              {discussions.length} active thread{discussions.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse rounded-3xl border border-orange-100 bg-orange-50/60 p-6">
                  <div className="h-4 w-24 rounded bg-orange-100" />
                  <div className="mt-4 h-6 w-3/4 rounded bg-orange-100" />
                  <div className="mt-3 h-4 w-full rounded bg-orange-100" />
                </div>
              ))}
            </div>
          ) : discussions.length ? (
            discussions.map((discussion) => (
              <DiscussionCard
                key={discussion.id}
                discussion={discussion}
                isActive={selectedDiscussion?.id === discussion.id}
                onSelect={handleSelectDiscussion}
              />
            ))
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-orange-200 bg-orange-50/40 p-8 text-center text-sm text-orange-600">
              <p>No live discussions yet. Be the first to start one!</p>
            </div>
          )}
        </div>
      </section>

      {selectedDiscussion && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="relative flex h-full w-full max-h-[calc(100vh-3rem)] max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-full w-full">
              <LiveDiscussionPanel
                key={`dialog-${selectedDiscussion.id}`}
                discussion={selectedDiscussion}
                onClose={() => setSelectedId(null)}
                onMembershipChange={handleMembershipChange}
              />
            </div>
          </div>
        </div>
      )}

      <CreateDiscussionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateDiscussion}
        busy={creating}
      />
    </div>
  );
}
