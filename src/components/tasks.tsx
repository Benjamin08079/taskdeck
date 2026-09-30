"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import type { Priority, Task } from "@/lib/types";
import { cardClass, inputClass, miniBtn, primaryBtn, secondaryBtn } from "./ui";

export interface TaskInput {
  title: string;
  description: string;
  priority: Priority;
  dueDate: string | null;
}

const PRIORITY_BADGE: Record<Priority, string> = {
  low: "b2 bg-sky-300 text-black",
  medium: "b2 bg-amber-300 text-black",
  high: "b2 bg-orange-400 text-black",
};

export function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.completed) return false;
  return task.dueDate < todayISO();
}

function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${PRIORITY_BADGE[priority]}`}
    >
      {priority}
    </span>
  );
}

export function QuickAdd({
  onCreate,
}: {
  onCreate: (input: TaskInput) => Promise<boolean>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [details, setDetails] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving || title.trim() === "") return;
    setSaving(true);
    const success = await onCreate({
      title: title.trim(),
      description,
      priority,
      dueDate: dueDate === "" ? null : dueDate,
    });
    setSaving(false);
    if (success) {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate("");
      setDetails(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3" aria-label="Quick add task">
      <div className="flex flex-wrap gap-2">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a task and hit Enter…"
          aria-label="Task title"
          className={`${inputClass} min-w-40 flex-1`}
        />
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value as Priority)}
          aria-label="Priority"
          className={`${inputClass} w-auto`}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          aria-label="Due date"
          className={`${inputClass} w-auto`}
        />
        <button type="submit" disabled={saving} className={primaryBtn}>
          {saving ? "…" : "Add"}
        </button>
      </div>
      {details ? (
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className={inputClass}
        />
      ) : (
        <button
          type="button"
          onClick={() => setDetails(true)}
          className={miniBtn}
        >
          + Description
        </button>
      )}
    </form>
  );
}

function TaskCard({
  task,
  onToggle,
  onUpdate,
  onDelete,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onUpdate: (id: string, patch: Partial<TaskInput>) => Promise<boolean>;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function save() {
    if (saving) return;
    setSaving(true);
    const success = await onUpdate(task.id, {
      title: title.trim(),
      description,
      priority,
      dueDate: dueDate === "" ? null : dueDate,
    });
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
          className="space-y-3 p-4"
        >
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            aria-label="Task title"
            className={inputClass}
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className={inputClass}
          />
          <div className="flex flex-wrap gap-3">
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as Priority)}
              aria-label="Priority"
              className={`${inputClass} w-auto`}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              aria-label="Due date"
              className={`${inputClass} w-auto`}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setTitle(task.title);
                setDescription(task.description);
                setPriority(task.priority);
                setDueDate(task.dueDate ?? "");
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
    <li
      className={`${cardClass} p-4 transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_var(--brutal-shadow)]`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onToggle(task)}
          aria-label={task.completed ? "Mark as active" : "Mark as completed"}
          className={`b2 flex h-6 w-6 shrink-0 items-center justify-center font-bold transition ${
            task.completed
              ? "bg-lime-400 text-black"
              : "bg-[var(--brutal-surface)] text-transparent hover:bg-lime-200"
          }`}
        >
          X
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`font-bold ${
                task.completed ? "text-neutral-400 line-through dark:text-neutral-500" : ""
              }`}
            >
              {task.title}
            </h3>
            <PriorityBadge priority={task.priority} />
            {task.dueDate && (
              <span
                className={`b2 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${
                  isOverdue(task)
                    ? "bg-red-400 text-black"
                    : "bg-[var(--brutal-surface)] text-[var(--brutal-text)]"
                }`}
              >
                {isOverdue(task) ? "LATE" : "DUE"} {task.dueDate}
              </span>
            )}
          </div>
          {task.description && (
            <p className="mt-1 text-sm break-words text-neutral-600 dark:text-neutral-400">
              {task.description}
            </p>
          )}
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Upd {new Date(task.updatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <button type="button" onClick={() => setEditing(true)} className={miniBtn}>
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirming) {
                onDelete(task.id);
                return;
              }
              setConfirming(true);
              setTimeout(() => setConfirming(false), 3000);
            }}
            aria-label={confirming ? "Confirm delete task" : "Delete task"}
            title={confirming ? "Click again to delete" : "Delete task"}
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

export function TaskList({
  tasks,
  emptyLabel,
  onToggle,
  onUpdate,
  onDelete,
}: {
  tasks: Task[];
  emptyLabel: string;
  onToggle: (task: Task) => void;
  onUpdate: (id: string, patch: Partial<TaskInput>) => Promise<boolean>;
  onDelete: (id: string) => void;
}) {
  if (tasks.length === 0) {
    return (
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
        — {emptyLabel} —
      </p>
    );
  }
  return (
    <ul className="space-y-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onToggle={onToggle}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
