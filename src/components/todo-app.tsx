"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { Note, Priority, Stats, Task } from "@/lib/types";
import { inputClass, panelHeader } from "./ui";
import { NoteList, NoteQuickAdd, type NoteInput } from "./notes";
import { QuickAdd, TaskList, type TaskInput } from "./tasks";

type PriorityFilter = "all" | Priority;

interface ApiErrorBody {
  error?: unknown;
  details?: unknown;
}

/** Calls the API and unwraps the { data } envelope; throws readable errors. */
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON response — fall through to the generic error below.
  }

  if (!response.ok) {
    const body = (payload ?? {}) as ApiErrorBody;
    const details = Array.isArray(body.details)
      ? body.details.filter((item): item is string => typeof item === "string")
      : [];
    const message =
      details.length > 0
        ? details.join(" ")
        : typeof body.error === "string"
          ? body.error
          : undefined;
    throw new Error(message ?? `Request failed with status ${response.status}.`);
  }

  return (payload as { data: T }).data;
}

function Panel({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="brutal bg-[var(--brutal-surface)]">
      <header className={panelHeader}>
        <span>
          {label} [{count}]
        </span>
      </header>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}

export default function TodoApp() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(false);

  const handleError = useCallback((err: unknown) => {
    setError(err instanceof Error ? err.message : "Something went wrong.");
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      setStats(await api<Stats>("/api/stats"));
    } catch {
      // Stats are decorative; a transient failure here is not worth a banner.
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [taskData, noteData] = await Promise.all([
        api<{ tasks: Task[]; count: number }>("/api/tasks"),
        api<{ notes: Note[]; count: number }>("/api/notes"),
      ]);
      setTasks(taskData.tasks);
      setNotes(noteData.notes);
      setError(null);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
    void refreshStats();
  }, [handleError, refreshStats]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Private mode etc. — theme simply won't persist.
    }
  }

  // ---------- Task handlers ----------

  async function handleCreateTask(input: TaskInput): Promise<boolean> {
    try {
      const { task } = await api<{ task: Task }>("/api/tasks", {
        method: "POST",
        body: JSON.stringify(input),
      });
      setTasks((prev) => [task, ...prev]);
      setError(null);
      void refreshStats();
      return true;
    } catch (err) {
      handleError(err);
      return false;
    }
  }

  async function handleUpdateTask(
    id: string,
    patch: Partial<TaskInput> & { completed?: boolean }
  ): Promise<boolean> {
    try {
      const { task } = await api<{ task: Task }>(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setTasks((prev) => prev.map((item) => (item.id === task.id ? task : item)));
      setError(null);
      void refreshStats();
      return true;
    } catch (err) {
      handleError(err);
      return false;
    }
  }

  function handleToggleTask(task: Task) {
    void handleUpdateTask(task.id, { completed: !task.completed });
  }

  async function handleDeleteTask(id: string): Promise<boolean> {
    try {
      await api<{ task: Task }>(`/api/tasks/${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((item) => item.id !== id));
      setError(null);
      void refreshStats();
      return true;
    } catch (err) {
      handleError(err);
      return false;
    }
  }

  // ---------- Note handlers ----------

  async function handleCreateNote(input: NoteInput): Promise<boolean> {
    try {
      const { note } = await api<{ note: Note }>("/api/notes", {
        method: "POST",
        body: JSON.stringify(input),
      });
      setNotes((prev) => [note, ...prev]);
      setError(null);
      void refreshStats();
      return true;
    } catch (err) {
      handleError(err);
      return false;
    }
  }

  async function handleUpdateNote(
    id: string,
    patch: Partial<NoteInput>
  ): Promise<boolean> {
    try {
      const { note } = await api<{ note: Note }>(`/api/notes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setNotes((prev) => prev.map((item) => (item.id === note.id ? note : item)));
      setError(null);
      void refreshStats();
      return true;
    } catch (err) {
      handleError(err);
      return false;
    }
  }

  async function handleDeleteNote(id: string): Promise<boolean> {
    try {
      await api<{ note: Note }>(`/api/notes/${id}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((item) => item.id !== id));
      setError(null);
      void refreshStats();
      return true;
    } catch (err) {
      handleError(err);
      return false;
    }
  }

  // ---------- Derived (client-side filters mirror the API query filters) ----------

  const matches = useCallback(
    (task: Task) => {
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
      const needle = search.trim().toLowerCase();
      if (needle) {
        const haystack = `${task.title} ${task.description}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    },
    [priorityFilter, search]
  );

  const activeTasks = useMemo(
    () => tasks.filter((task) => !task.completed && matches(task)),
    [tasks, matches]
  );
  const doneTasks = useMemo(
    () => tasks.filter((task) => task.completed && matches(task)),
    [tasks, matches]
  );
  const visibleNotes = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return notes;
    return notes.filter((note) =>
      `${note.title} ${note.content}`.toLowerCase().includes(needle)
    );
  }, [notes, search]);

  const priorityChips: Array<{ value: PriorityFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "low", label: "Low" },
    { value: "medium", label: "Med" },
    { value: "high", label: "High" },
  ];

  const completionRate = stats?.completionRate ?? 0;

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10">
        <p className="brutal bg-[var(--brutal-surface)] p-10 text-center font-mono text-xs uppercase tracking-widest">
          Loading…
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="brutal-sm flex h-12 w-12 items-center justify-center bg-lime-400 font-bold text-black">
            TD
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">TaskDeck</h1>
            <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              A tasks &amp; notes board
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="brutal-sm bg-[var(--brutal-surface)] px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-wide"
          >
            {dark ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="brutal mt-6 flex items-start justify-between gap-3 bg-red-300 px-4 py-3 text-sm font-medium text-black"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            className="font-bold"
          >
            X
          </button>
        </div>
      )}

      {stats && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: "Tasks", value: stats.totalTasks },
              { label: "Done", value: stats.completedTasks },
              {
                label: "Late",
                value: stats.overdueTasks,
                danger: stats.overdueTasks > 0,
              },
              { label: "Notes", value: stats.totalNotes },
            ].map((chip) => (
              <span
                key={chip.label}
                className={`b2 px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide ${
                  chip.danger ? "bg-red-400 text-black" : "bg-[var(--brutal-surface)]"
                }`}
              >
                {chip.label} {chip.value}
              </span>
            ))}
          </div>
          <div className="b2 mt-3 h-4 bg-[var(--brutal-surface)]">
            <div
              className="h-full bg-lime-400 transition-all"
              style={{ width: `${Math.min(100, Math.max(0, completionRate))}%` }}
              role="progressbar"
              aria-valuenow={completionRate}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Completion rate"
            />
          </div>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            {completionRate}% complete
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Panel label="Tasks" count={tasks.length}>
            <div className="flex flex-wrap gap-2">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks…"
                aria-label="Search"
                className={`${inputClass} min-w-40 flex-1`}
              />
              {priorityChips.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setPriorityFilter(chip.value)}
                  className={`b2 px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide transition ${
                    priorityFilter === chip.value
                      ? "bg-lime-400 text-black"
                      : "bg-[var(--brutal-surface)]"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <QuickAdd onCreate={handleCreateTask} />

            <div className="space-y-2">
              <h2 className="font-mono text-xs font-semibold uppercase tracking-widest">
                Active
              </h2>
              <TaskList
                tasks={activeTasks}
                emptyLabel={
                  tasks.length === 0 ? "no tasks yet" : "nothing matches"
                }
                onToggle={handleToggleTask}
                onUpdate={handleUpdateTask}
                onDelete={(id) => void handleDeleteTask(id)}
              />
            </div>

            <div className="space-y-2">
              <h2 className="font-mono text-xs font-semibold uppercase tracking-widest">
                Done [{doneTasks.length}]
              </h2>
              <TaskList
                tasks={doneTasks}
                emptyLabel="nothing done yet"
                onToggle={handleToggleTask}
                onUpdate={handleUpdateTask}
                onDelete={(id) => void handleDeleteTask(id)}
              />
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-6">
            <Panel label="Notes" count={notes.length}>
              <NoteQuickAdd onCreate={handleCreateNote} />
              <NoteList
                notes={visibleNotes}
                emptyLabel={
                  notes.length === 0 ? "no notes yet" : "nothing matches"
                }
                onUpdate={handleUpdateNote}
                onDelete={(id) => void handleDeleteNote(id)}
              />
            </Panel>
          </div>
        </div>
      </div>

      <footer className="mt-12 text-center font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
        TaskDeck — tasks &amp; notes ·{" "}
        <a href="/api/health" className="underline hover:text-lime-500">
          /api/health
        </a>{" "}
        ·{" "}
        <a href="/api/stats" className="underline hover:text-lime-500">
          /api/stats
        </a>
      </footer>
    </main>
  );
}
