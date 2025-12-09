export function DiscussionCard({ discussion, isActive, onSelect }) {
  const handleClick = () => {
    if (typeof onSelect === "function") {
      onSelect(discussion);
    }
  };

  const cardClasses = [
    "rounded-3xl border px-8 py-6 transition-all duration-150",
    "bg-white/90 backdrop-blur-sm",
    isActive ? "border-orange-400 shadow-lg" : "border-orange-100 shadow-sm hover:border-orange-200",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={cardClasses}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-600">
            {discussion.topicTag || "Campus"}
          </span>
          <h3 className="text-xl font-semibold text-slate-900">
            {discussion.title}
          </h3>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
            {discussion.description}
          </p>
        </div>
        <div className="flex flex-col items-end gap-4">
          <div className="text-right text-xs uppercase tracking-wide text-slate-400">
            {new Date(discussion.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </div>
          <button
            type="button"
            onClick={handleClick}
            className="inline-flex items-center gap-2 rounded-full border border-orange-400 px-4 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-50"
          >
            {discussion.isJoined ? "Open discussion" : "View discussion"}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
      <footer className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
          {discussion.participantsCount} participant{discussion.participantsCount === 1 ? "" : "s"}
        </div>
        {discussion.creator && (
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-orange-100 text-sm font-semibold text-orange-600">
              {discussion.creator.firstName?.[0]}
              {discussion.creator.lastName?.[0]}
            </span>
            <span className="text-slate-600">
              {discussion.creator.firstName} {discussion.creator.lastName}
            </span>
          </div>
        )}
      </footer>
    </article>
  );
}
