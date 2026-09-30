"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import type { Note } from "@/lib/types";
import { cardClass, inputClass, miniBtn, primaryBtn, secondaryBtn } from "./ui";

export interface NoteInput {
  title: string;
  content: string;
}

export function NoteQuickAdd({
  onCreate,
}: {
  onCreate: (input: NoteInput) => Promise<boolean>;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    const success = await onCreate({ title: title.trim(), content });
    setSaving(false);
    if (success) {
      setTitle("");
      setContent("");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2" aria-label="Quick add note">
      <input
        required
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Note title"
        aria-label="Note title"
        className={inputClass}
      />
      <textarea
        required
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Write something…"
        rows={3}
        aria-label="Note content"
        className={inputClass}
      />
      <button type="submit" disabled={saving} className={`${primaryBtn} w-full`}>
        {saving ? "…" : "Add note"}
      </button>
    </form>
  );
}

function NoteCard({
  note,
  onUpdate,
  onDelete,
}: {
  note: Note;
  onUpdate: (id: string, patch: Partial<NoteInput>) => Promise<boolean>;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function save() {
    if (saving) return;
    setSaving(true);
    const success = await onUpdate(note.id, { title: title.trim(), content });
    setSaving(false);
    if (success) setEditing(false);
  }

  if (editing) {
    return (
      <li className={cardClass}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
          className="space-y-2 p-4"
        >
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            aria-label="Note title"
            className={inputClass}
          />
          <textarea
            required
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={4}
            aria-label="Note content"
            className={inputClass}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setTitle(note.title);
                setContent(note.content);
                setEditing(false);
              }}
              className={secondaryBtn}
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className={primaryBtn}>
              {saving ? "…" : "Save"}
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className={`${cardClass} p-4`}>
      <h3 className="border-b-2 border-[var(--brutal-border)] pb-2 font-mono text-sm font-semibold uppercase tracking-wide">
        {note.title}
      </h3>
      <p className="mt-2 text-sm whitespace-pre-wrap break-words text-neutral-700 dark:text-neutral-300">
        {note.content}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Upd {new Date(note.updatedAt).toLocaleString()}
        </span>
        <div className="flex gap-1">
          <button type="button" onClick={() => setEditing(true)} className={miniBtn}>
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirming) {
                onDelete(note.id);
                return;
              }
              setConfirming(true);
              setTimeout(() => setConfirming(false), 3000);
            }}
            aria-label={confirming ? "Confirm delete note" : "Delete note"}
            title={confirming ? "Click again to delete" : "Delete note"}
            className={
              confirming
                ? "b2 bg-red-400 px-2 py-1 font-mono text-[10px] font-semibold uppercase text-black"
                : miniBtn
            }
          >
            {confirming ? "Sure?" : "Del"}
          </button>
        </div>
      </div>
    </li>
  );
}

export function NoteList({
  notes,
  emptyLabel,
  onUpdate,
  onDelete,
}: {
  notes: Note[];
  emptyLabel: string;
  onUpdate: (id: string, patch: Partial<NoteInput>) => Promise<boolean>;
  onDelete: (id: string) => void;
}) {
  if (notes.length === 0) {
    return (
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
        — {emptyLabel} —
      </p>
    );
  }
  return (
    <ul className="space-y-4">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </ul>
  );
}
