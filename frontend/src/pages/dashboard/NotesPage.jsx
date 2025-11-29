import React from "react";
import { useOutletContext } from "react-router-dom";
import {
  FiUpload,
  FiDownload,
  FiEye,
  FiX,
  FiFileText,
  FiSearch,
  FiAlertCircle,
  FiTrash2,
} from "react-icons/fi";
import { buildApiUrl, fetchResource } from "../../utils/fetchResource";

const EMPTY_NOTES = [];

const formatDateTime = (value) => {
  if (!value) return "Unknown";
  try {
    return new Date(value).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch (error) {
    return "Unknown";
  }
};

const FILE_ACCEPT = [".pdf", ".doc", ".docx"].join(",");

const toDownloadLabel = (count = 0) => {
  if (!Number.isFinite(count) || count < 0) return "0 downloads";
  if (count === 1) return "1 download";
  return `${count} downloads`;
};

const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "Unknown";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

export default function NotesPage() {
  const outletContext = useOutletContext?.() ?? {};
  const { role = "user" } = outletContext;
  const isAdmin = role === "admin";
  const [notes, setNotes] = React.useState(EMPTY_NOTES);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [selectedNote, setSelectedNote] = React.useState(null);
  const [uploadState, setUploadState] = React.useState({ loading: false, error: null });
  const [formValues, setFormValues] = React.useState({ title: "", subject: "", description: "" });
  const [selectedFile, setSelectedFile] = React.useState(null);
  const fileInputRef = React.useRef(null);
  const [deleteState, setDeleteState] = React.useState({ id: null, error: "" });

  React.useEffect(() => {
    let ignore = false;

    async function loadNotes() {
      setLoading(true);
      const { data, error: fetchError } = await fetchResource(
        "/api/notes/all",
        { success: false, notes: EMPTY_NOTES }
      );

      if (ignore) return;

      if (fetchError) {
        setError(fetchError);
      } else {
        setError(null);
        setNotes(Array.isArray(data?.notes) ? data.notes : EMPTY_NOTES);
      }
      setLoading(false);
    }

    loadNotes();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredNotes = React.useMemo(() => {
    if (!searchTerm) return notes;
    const lower = searchTerm.toLowerCase();
    return notes.filter((note) => {
      const parts = [
        note?.title,
        note?.description,
        note?.subject,
        note?.uploader?.name,
        note?.uploader?.email,
      ];
      return parts.some((value) => value && value.toLowerCase().includes(lower));
    });
  }, [notes, searchTerm]);

  const closeUploadModal = () => {
    setIsUploadOpen(false);
    setUploadState({ loading: false, error: null });
    setFormValues({ title: "", subject: "", description: "" });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setUploadState({ loading: true, error: null });

    if (!selectedFile) {
      setUploadState({ loading: false, error: "Please choose a PDF or DOC/DOCX file." });
      return;
    }

    const formData = new FormData();
    formData.append("title", formValues.title.trim());
    formData.append("subject", formValues.subject.trim());
    formData.append("description", formValues.description.trim());
    formData.append("file", selectedFile);

    try {
      const response = await fetch(buildApiUrl("/api/notes/upload"), {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload?.note) {
        const message = payload?.message || "Failed to upload the note.";
        setUploadState({ loading: false, error: message });
        return;
      }

      setNotes((prev) => {
        const withoutDuplicate = prev.filter((item) => item._id !== payload.note._id);
        return [payload.note, ...withoutDuplicate];
      });
      setUploadState({ loading: false, error: null });
      closeUploadModal();
      setSelectedNote(payload.note);
    } catch (uploadError) {
      setUploadState({
        loading: false,
        error: uploadError?.message || "Failed to upload the note.",
      });
    }
  };

  const handlePreview = (note) => {
    setSelectedNote(note);
  };

  const handleClosePreview = () => {
    setSelectedNote(null);
  };

  const handleDownloadClick = React.useCallback((noteId) => {
    setNotes((prev) =>
      prev.map((item) =>
        item._id === noteId
          ? { ...item, downloads: (item.downloads || 0) + 1 }
          : item
      )
    );
    setSelectedNote((prev) =>
      prev && prev._id === noteId
        ? { ...prev, downloads: (prev.downloads || 0) + 1 }
        : prev
    );
  }, []);

  const handleDeleteNote = React.useCallback(
    async (noteId) => {
      if (!noteId) return;
      const confirmed = window.confirm("Delete this note? This action cannot be undone.");
      if (!confirmed) {
        return;
      }

      setDeleteState({ id: noteId, error: "" });

      try {
        const response = await fetch(buildApiUrl(`/api/notes/${noteId}`), {
          method: "DELETE",
          credentials: "include",
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.message || "Failed to delete note.");
        }

        setNotes((prev) => prev.filter((item) => item._id !== noteId));
        setSelectedNote((prev) => (prev && prev._id === noteId ? null : prev));
        setDeleteState({ id: null, error: "" });
      } catch (err) {
        console.error("Note delete error", err);
        setDeleteState({ id: null, error: err.message || "Unable to delete note." });
      }
    },
    []
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notes Sharing</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload and browse study materials shared by the Campus Connect community.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-400"
        >
          <FiUpload className="text-base" />
          Upload Notes
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search by title, subject, or uploader"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            <FiAlertCircle className="text-base" />
            <span>{error}</span>
          </div>
        )}
        {!error && deleteState.error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            <FiAlertCircle className="text-base" />
            <span>{deleteState.error}</span>
          </div>
        )}
      </div>

      <section>
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/70">
            <p className="text-sm font-medium text-gray-500">Loading shared notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white/70 text-center">
            <FiFileText className="text-3xl text-gray-300" />
            <p className="text-sm font-medium text-gray-600">
              {searchTerm ? "No notes match your search." : "No notes have been shared yet."}
            </p>
            {!searchTerm && (
              <p className="text-xs text-gray-400">
                Be the first to share helpful study materials with the community.
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredNotes.map((note) => (
              <article
                key={note._id}
                className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-500">
                      {note.subject || "General"}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">{note.title}</h3>
                    <p className="text-sm text-gray-500">{note.description}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note._id)}
                        disabled={deleteState.id === note._id}
                        className="inline-flex items-center justify-center rounded-full border border-red-200 bg-white p-2 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <FiTrash2 className="text-base" />
                      </button>
                    )}
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                      {toDownloadLabel(note.downloads)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex flex-1 flex-col justify-end gap-3 text-sm text-gray-500">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span className="font-medium text-gray-700">
                      {note?.uploader?.name || "Shared anonymously"}
                    </span>
                    <span className="hidden h-1.5 w-1.5 rounded-full bg-gray-300 sm:inline-block" aria-hidden="true" />
                    <span>{formatDateTime(note.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePreview(note)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-orange-200 px-3 py-2 text-sm font-semibold text-orange-500 transition hover:border-orange-300 hover:bg-orange-50"
                    >
                      <FiEye className="text-base" />
                      Preview
                    </button>
                    <a
                      href={buildApiUrl(note.downloadUrl || `/api/notes/${note._id}/download`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleDownloadClick(note._id)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-400"
                    >
                      <FiDownload className="text-base" />
                      Download
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {isUploadOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Share New Notes</h2>
              <button
                type="button"
                onClick={closeUploadModal}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <FiX className="text-lg" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm font-medium text-gray-700">
                  <span>Title</span>
                  <input
                    type="text"
                    name="title"
                    value={formValues.title}
                    onChange={handleFormChange}
                    required
                    minLength={3}
                    maxLength={120}
                    placeholder="E.g. Advanced Calculus Notes"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </label>
                <label className="space-y-1 text-sm font-medium text-gray-700">
                  <span>Subject</span>
                  <input
                    type="text"
                    name="subject"
                    value={formValues.subject}
                    onChange={handleFormChange}
                    required
                    minLength={2}
                    maxLength={80}
                    placeholder="E.g. Mathematics"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </label>
              </div>
              <label className="space-y-1 text-sm font-medium text-gray-700">
                <span>Description</span>
                <textarea
                  name="description"
                  value={formValues.description}
                  onChange={handleFormChange}
                  required
                  minLength={10}
                  maxLength={500}
                  rows={4}
                  placeholder="Provide a short summary and key takeaways from the notes."
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </label>
              <label className="block rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 p-6 text-center">
                <span className="flex flex-col items-center gap-3 text-sm text-orange-600">
                  <FiUpload className="text-2xl" />
                  <span className="font-semibold">Upload PDF or Word document</span>
                  <span className="text-xs text-orange-500">
                    Maximum size 15MB. Supported formats: PDF, DOC, DOCX.
                  </span>
                </span>
                <input
                  type="file"
                  accept={FILE_ACCEPT}
                  onChange={handleFileChange}
                  required
                  ref={fileInputRef}
                  className="sr-only"
                />
                {selectedFile && (
                  <p className="mt-3 text-xs font-medium text-orange-600">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </label>
              {uploadState.error && (
                <p className="text-sm text-red-500">{uploadState.error}</p>
              )}
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={closeUploadModal}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadState.loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-orange-300"
                >
                  {uploadState.loading ? "Uploading..." : "Share Notes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedNote && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedNote.title}</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Shared by {selectedNote?.uploader?.name || "Unknown"} on {formatDateTime(selectedNote.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClosePreview}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <FiX className="text-lg" />
              </button>
            </div>
            <div className="grid gap-0 md:grid-cols-2">
              <div className="space-y-4 border-b border-gray-100 p-6 md:border-b-0 md:border-r">
                <div>
                  <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-500">
                    {selectedNote.subject || "General"}
                  </span>
                  <p className="mt-3 text-sm text-gray-600">{selectedNote.description}</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li>
                    <span className="font-semibold text-gray-700">File name:</span> {selectedNote.fileName}
                  </li>
                  <li>
                    <span className="font-semibold text-gray-700">File type:</span> {selectedNote.fileType}
                  </li>
                  <li>
                    <span className="font-semibold text-gray-700">File size:</span> {formatFileSize(selectedNote.fileSize)}
                  </li>
                  <li>
                    <span className="font-semibold text-gray-700">Downloads:</span> {selectedNote.downloads || 0}
                  </li>
                </ul>
                <div className="flex gap-3">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(selectedNote._id)}
                      disabled={deleteState.id === selectedNote._id}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FiTrash2 className="text-base" />
                      {deleteState.id === selectedNote._id ? "Deleting..." : "Delete"}
                    </button>
                  )}
                  <a
                    href={buildApiUrl(selectedNote.downloadUrl || `/api/notes/${selectedNote._id}/download`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleDownloadClick(selectedNote._id)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400"
                  >
                    <FiDownload className="text-base" />
                    Download
                  </a>
                </div>
              </div>
              <div className="relative min-h-[340px] bg-gray-50">
                {selectedNote.fileType?.includes("pdf") ? (
                  <iframe
                    title={`Preview of ${selectedNote.title}`}
                    src={buildApiUrl(selectedNote.previewUrl || `/api/notes/${selectedNote._id}/preview`)}
                    className="absolute inset-0 h-full w-full rounded-br-3xl"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-gray-500">
                    <FiFileText className="text-3xl text-gray-300" />
                    <p>
                      Preview is available for PDF files only. Please download the document to view it on your
                      device.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
