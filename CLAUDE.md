### 🔄 Project Awareness & Context
- **Always read `PLANNING.md`** at the start of a new conversation to understand the project's architecture, goals, style, and constraints.
- **Check `TASK.md`** before starting a new task. If the task isn't listed, add it with a brief description and today's date.
- **Use consistent naming conventions, file structure, and architecture patterns** as described in `PLANNING.md`.

### 🧱 Code Structure & Modularity
- **Never create a file longer than 500 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files.
- **Organize code into clearly separated modules**, grouped by feature or responsibility.
- **Use clear, consistent imports** (prefer relative imports within packages).
- **Use dotenv for environment variables** (load with `require('dotenv').config()` in Node.js).

### 🧪 Testing & Reliability
- **Always create Jest unit tests for new features** (functions, classes, routes, API endpoints).
- **After updating any logic**, check whether existing unit tests need to be updated. If so, do it.
- **Tests should live in a `/tests` folder** (backend) or co-located with components (frontend).
  - Include at least:
    - 1 test for expected use
    - 1 edge case
    - 1 failure case

### ✅ Task Completion
- **Mark completed tasks in `TASK.md`** immediately after finishing them.
- Add new sub-tasks or TODOs discovered during development to `TASK.md` under a “Discovered During Work” section.

### 📎 Style & Conventions
- **Use JavaScript/Node.js** for backend, **JavaScript/JSX** for frontend (React).
- **Follow ES6+ syntax**: async/await, destructuring, arrow functions.
- **Use ESLint + Prettier** for consistent code formatting (2-space indentation, single quotes).
- **Use Joi or Zod** for data validation in backend.
- **Use Express.js** for RESTful API backend.
- **Use Neo4j driver** for database operations (no ORM).
- Write **JSDoc comments for all functions**:
  ```javascript
  /**
   * Brief summary.
   *
   * @param {string} param1 - Description
   * @returns {Promise<Object>} Description
   * @throws {Error} Description
   */
  async function example(param1) {
    // Implementation
  }
  ```

### 📚 Documentation & Explainability
- **Update `README.md`** when new features are added, dependencies change, or setup steps are modified.
- **Comment non-obvious code** and ensure everything is understandable to a mid-level developer.
- When writing complex logic, **add an inline `# Reason:` comment** explaining the why, not just the what.

### 🧠 AI Behavior Rules
- **Never assume missing context. Ask questions if uncertain.**
- **Never hallucinate libraries or functions** – only use known, verified npm packages.
- **Always confirm file paths and module names** exist before referencing them in code or tests.
- **Never delete or overwrite existing code** unless explicitly instructed to or if part of a task from `TASK.md`.

### 🎯 Project-Specific Guidelines
- **Technology Stack**: Node.js/Express (backend), React/Vite (frontend), Neo4j (database)
- **Authentication**: JWT-based authentication for multi-user support
- **External APIs**: TMDB for title metadata, Anthropic Claude API for AI recommendations
- **State Management**: React Context API + Custom Hooks (no Redux/MobX)
- **Testing**: Jest + Supertest (backend), Jest + React Testing Library (frontend)
- **Code Organization**: See PLANNING.md for complete directory structure
