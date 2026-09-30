import { randomUUID } from "node:crypto";

import type { Note, Task } from "./types";

/**
 * Demo content created on first run only — once per database (Postgres mode)
 * or per data directory (file mode). Deleting all items afterwards stays
 * permanent; the seed never comes back.
 */
export function buildSeed(): { tasks: Task[]; notes: Note[] } {
  const now = new Date().toISOString();
  const inDays = (days: number) =>
    new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

  return {
    tasks: [
      {
        id: randomUUID(),
        title: "Read the App Router docs",
        description: "Skim routing, route handlers and caching before Stage 2.",
        priority: "medium",
        dueDate: inDays(2),
        completed: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        title: "Buy groceries",
        description: "Rice, beans, plantain, eggs.",
        priority: "high",
        dueDate: inDays(1),
        completed: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        title: "Water the plants",
        description: "",
        priority: "low",
        dueDate: null,
        completed: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
    notes: [
      {
        id: randomUUID(),
        title: "Standup notes",
        content:
          "Blocked: none. Today: finish the TaskDeck UI. Tomorrow: deploy and submit.",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        title: "Stage 2 ideas",
        content: "Drag-and-drop ordering, a calendar view and CSV export.",
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}
