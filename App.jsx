
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const STORAGE_KEY = "taskflow-tasks-v1";

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (task) =>
        task &&
        typeof task.id === "string" &&
        typeof task.title === "string" &&
        typeof task.description === "string" &&
        typeof task.completed === "boolean"
    );
  } catch {
    return [];
  }
}

function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // The app can still work if browser storage is unavailable.
    }
  }, [tasks]);

  const completedCount = tasks.filter(
    (task) => task.completed
  ).length;

  const activeCount = tasks.length - completedCount;

  const progress = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;

  const visibleTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (filter === "Active") return !task.completed;
        if (filter === "Completed") return task.completed;
        return true;
      })
      .filter((task) => {
        const query = search.trim().toLowerCase();

        return (
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query)
        );
      });
  }, [tasks, filter, search]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setEditId(null);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (!cleanTitle) return;

    if (editId !== null) {
      setTasks((current) =>
        current.map((task) =>
          task.id === editId
            ? {
                ...task,
                title: cleanTitle,
                description: cleanDescription,
                priority,
              }
            : task
        )
      );
    } else {
      const newTask = {
        id: crypto.randomUUID(),
        title: cleanTitle,
        description: cleanDescription,
        priority,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      setTasks((current) => [newTask, ...current]);
    }

    resetForm();
  }

  function startEdit(task) {
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority || "Medium");
    setEditId(task.id);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleTask(id) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  }

  function deleteTask(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    setTasks((current) =>
      current.filter((task) => task.id !== id)
    );

    if (editId === id) resetForm();
  }

  function clearCompleted() {
    if (completedCount === 0) return;

    const confirmed = window.confirm(
      `Delete all ${completedCount} completed task(s)?`
    );

    if (!confirmed) return;

    setTasks((current) =>
      current.filter((task) => !task.completed)
    );
  }

  function formatDate(dateString) {
    if (!dateString) return "Recently added";

    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="TaskFlow home">
          <span className="brand-icon">✓</span>
          <span>TaskFlow</span>
        </a>

        <span className="topbar-label">
          Your day, organized.
        </span>
      </header>

      <main className="container" id="home">
        <section className="welcome">
          <div>
            <span className="eyebrow">YOUR PERSONAL WORKSPACE</span>
            <h1>Make today count.</h1>
            <p>
              Organize your tasks, focus on what matters,
              and celebrate every little win.
            </p>
          </div>

          <div className="date-card">
            <span className="date-icon">☀</span>
            <div>
              <strong>
                {new Date().toLocaleDateString(undefined, {
                  weekday: "long",
                })}
              </strong>
              <span>
                {new Date().toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </section>

        <section className="stats-grid" aria-label="Task statistics">
          <article className="stat-card">
            <span className="stat-icon blue">▤</span>
            <div>
              <span className="stat-label">Total tasks</span>
              <strong>{tasks.length}</strong>
            </div>
          </article>

          <article className="stat-card">
            <span className="stat-icon orange">◷</span>
            <div>
              <span className="stat-label">In progress</span>
              <strong>{activeCount}</strong>
            </div>
          </article>

          <article className="stat-card">
            <span className="stat-icon green">✓</span>
            <div>
              <span className="stat-label">Completed</span>
              <strong>{completedCount}</strong>
            </div>
          </article>
        </section>

        <section className="progress-card">
          <div className="progress-heading">
            <div>
              <h2>Your progress</h2>
              <p>Every completed task moves you forward.</p>
            </div>
            <strong className="progress-number">{progress}%</strong>
          </div>

          <div
            className="progress-track"
            role="progressbar"
            aria-label="Task completion"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        <div className="workspace">
          <section className="panel form-panel">
            <div className="panel-heading">
              <div className="heading-icon">＋</div>
              <div>
                <h2>{editId ? "Edit task" : "Create a task"}</h2>
                <p>
                  {editId
                    ? "Update your task details below."
                    : "Add something you want to accomplish."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <label htmlFor="task-title">Task title *</label>
              <input
                id="task-title"
                type="text"
                placeholder="e.g. Finish my assignment"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
                required
              />

              <label htmlFor="task-description">
                Description
              </label>
              <textarea
                id="task-description"
                placeholder="Add a few details..."
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                rows={4}
                maxLength={1000}
              />

              <label htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
              >
                <option value="Low">Low priority</option>
                <option value="Medium">Medium priority</option>
                <option value="High">High priority</option>
              </select>

              <button className="primary-button submit-button" type="submit">
                {editId ? "Save changes" : "＋ Add task"}
              </button>

              {editId && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={resetForm}
                >
                  Cancel editing
                </button>
              )}
            </form>

            <div className="form-tip">
              <span>✦</span>
              <p>Tip: Break big goals into smaller, manageable tasks.</p>
            </div>
          </section>

          <section className="panel tasks-panel">
            <div className="tasks-heading">
              <div>
                <h2>My tasks <span className="count-pill">{tasks.length}</span></h2>
                <p>Keep your priorities in sight.</p>
              </div>

              {completedCount > 0 && (
                <button
                  className="text-button"
                  onClick={clearCompleted}
                  type="button"
                >
                  Clear completed
                </button>
              )}
            </div>

            <div className="search-box">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                aria-label="Search tasks"
                placeholder="Search your tasks..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="filter-tabs" aria-label="Filter tasks">
              {["All", "Active", "Completed"].map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`filter-tab ${
                    filter === option ? "selected" : ""
                  }`}
                  onClick={() => setFilter(option)}
                  aria-pressed={filter === option}
                >
                  {option}
                  {option === "Active" && (
                    <span>{activeCount}</span>
                  )}
                  {option === "Completed" && (
                    <span>{completedCount}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="task-list">
              {visibleTasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    {search ? "⌕" : filter === "Completed" ? "✓" : "✧"}
                  </div>
                  <h3>
                    {search
                      ? "No matching tasks"
                      : filter === "Completed"
                        ? "Nothing completed yet"
                        : filter === "Active"
                          ? "You're all caught up!"
                          : "Your list starts here"}
                  </h3>
                  <p>
                    {search
                      ? "Try another search term."
                      : filter === "All"
                        ? "Create your first task to get started."
                        : "Tasks matching this filter will appear here."}
                  </p>
                </div>
              ) : (
                visibleTasks.map((task) => (
                  <article
                    className={`task-item ${
                      task.completed ? "task-completed" : ""
                    }`}
                    key={task.id}
                  >
                    <button
                      className={`check-button ${
                        task.completed ? "checked" : ""
                      }`}
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      aria-label={
                        task.completed
                          ? `Mark ${task.title} as active`
                          : `Complete ${task.title}`
                      }
                    >
                      {task.completed ? "✓" : ""}
                    </button>

                    <div className="task-content">
                      <h3>{task.title}</h3>

                      {task.description && (
                        <p className="task-description">
                          {task.description}
                        </p>
                      )}

                      <div className="task-meta">
                        <span
                          className={`priority priority-${(
                            task.priority || "Medium"
                          ).toLowerCase()}`}
                        >
                          <span className="priority-dot" />
                          {task.priority || "Medium"}
                        </span>
                        <span className="task-date">
                          {formatDate(task.createdAt)}
                        </span>
                        {task.completed && (
                          <span className="done-label">Done</span>
                        )}
                      </div>
                    </div>

                    <div className="task-actions">
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => startEdit(task)}
                        aria-label={`Edit ${task.title}`}
                        title="Edit task"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="icon-button delete-action"
                        onClick={() => deleteTask(task.id)}
                        aria-label={`Delete ${task.title}`}
                        title="Delete task"
                      >
                        ×
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>

            <footer className="list-footer">
              <span>
                Showing {visibleTasks.length} of {tasks.length} tasks
              </span>
              <span className="footer-status">
                <span /> Saved in this browser
              </span>
            </footer>
          </section>
        </div>

        <footer className="app-footer">
          <span>TaskFlow</span>
          <span>Small steps. Big progress.</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
