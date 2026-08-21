# ScratchJr Clone - Deep Dive Technical Documentation

This document serves as an exhaustive technical breakdown of the ScratchJr clone. It explains the project's monorepo architecture, the algorithms used for the block execution engine, frontend systems, and the backend infrastructure.

## 🏗️ 1. High-Level Architecture & Code Structure

The project is built as a **Turborepo Monorepo**, separating the client interface and the API server into distinct workspaces for modularity and build caching.

### 1.1 Repository Structure
```
scratch-jr/
├── frontend/ (Next.js Application)
│   ├── src/
│   │   ├── app/           # Next.js App Router pages and layouts
│   │   ├── features/      # Feature-sliced architecture (isolated domain logic)
│   │   │   ├── blocks/    # Drag-and-drop block logic, Block definitions, AST Engine
│   │   │   ├── editor/    # Main workspace, Scene Sidebar
│   │   │   ├── stage/     # PixiJS Canvas renderer
│   │   │   ├── audio/     # Howler.js sound management
│   │   │   └── ai/        # AI hint features
│   │   ├── store/         # Zustand global state (Project, Scenes, Sprites)
│   │   └── lib/           # Utility functions
├── backend/ (Express.js API)
│   ├── src/
│   │   ├── controllers/   # Request/Response handlers
│   │   ├── models/        # Mongoose Database schemas
│   │   ├── routes/        # Express API routing logic
│   │   ├── sockets/       # Socket.io real-time event handlers
│   │   ├── middlewares/   # Auth & Error handling layers
│   │   └── server.ts      # Main Express/HTTP server entrypoint
├── package.json           # Workspace manager
└── turbo.json             # Turbo pipeline configuration
```

---

## 🧠 2. Core Algorithms & Execution Engine

The heart of this application is how it executes visual programming blocks. This logic is handled by the `RuntimeEngine` (`frontend/src/features/blocks/RuntimeEngine.ts`).

### 2.1 Abstract Syntax Tree (AST) Recursive Execution
When blocks are snapped together, they form a linked list or an Abstract Syntax Tree. 
- **The Algorithm**: The Engine uses an asynchronous recursive execution model (`executeScratchNode`). It takes a "head" block (e.g., "When Green Flag Clicked"), executes its specific logic (like moving or playing a sound), and then traverses to `block.next`. 
- **Substacks**: For control blocks like "Repeat" or "Forever", the algorithm recurses into the `substack` property before continuing down the main branch.
- **Yielding**: The execution engine uses an async `sleep()` mechanism to yield to the main browser thread. This ensures that a `forever` loop does not freeze the browser, mimicking a real game loop pacing.

### 2.2 Event & Broadcast System (Pub/Sub)
- The execution engine implements a global Pub/Sub mechanism (`broadcastListeners`) for inter-sprite communication.
- When a `broadcast("message")` block executes, it pushes the message to all active `RuntimeEngine` instances, dynamically triggering any block stacks headed by a `When I receive "message"` block.

### 2.3 Smooth Animated Motion Interpolation
Instead of teleporting sprites instantly, movement blocks (Move Right, Jump, Go Home) use a **Time-based Interpolation Algorithm**:
1. It records `startX/startY` and `startTime`.
2. It runs a `while()` loop constrained by a calculated duration (default 250ms, scaled by the global `speedMultiplier`).
3. **Ease-Out Quad Interpolation**: `const ease = 1 - (1 - progress) * (1 - progress);` is used to create a natural, deceleration effect rather than linear, robotic movement.
4. It yields execution using `await sleep(16)` to target a smooth 60 FPS animation loop.

### 2.4 Collision Detection (Hitboxes)
Collision detection is integrated directly into the motion loop. 
- Every frame of an animation, the engine calculates the Euclidean distance between the moving sprite and all other sprites in the scene using Pythagoras theorem: `Math.hypot(curX - other.x, curY - other.y)`.
- If the distance falls below a radius threshold (e.g., 50px), it triggers a system-wide `touch` event, activating any block stacks starting with a "Touch" hat block.

---

## 🎨 3. Frontend Implementation Details

### 3.1 Rendering Engine (PixiJS)
- Web DOM is too slow for real-time game rendering. The app uses **PixiJS** via `@pixi/react`. 
- PixiJS utilizes WebGL to draw the stage, sprites, and backgrounds on an HTML5 `<canvas>`.
- The Zustand state acts as the single source of truth, and the React tree re-renders PixiJS components whenever a sprite's coordinates (`x`, `y`), `rotation`, or `scale` is updated by the `RuntimeEngine`.

### 3.2 State Management (Zustand)
- Global state is handled by Zustand (`useProjectStore`). It stores the entire Project hierarchy: `Project -> Scenes -> Sprites -> ScratchBlocks`.
- This ensures that drag-and-drop actions on the block workspace instantly reflect in the runtime engine data structures without deep prop-drilling.

### 3.3 Drag and Drop (`@dnd-kit`)
- `@dnd-kit` manages the block workspace. When a user drags a block, the algorithm calculates overlapping bounding boxes to determine "snap points" (parent-child block connections).

---

## ⚙️ 4. Backend Architecture & Data Flow

The backend provides persistence, authentication, and real-time multiplayer features.

### 4.1 Tech Stack
- **Express.js**: REST API routing.
- **MongoDB + Mongoose**: NoSQL database, ideal for storing nested JSON structures like Scratch blocks and scenes.
- **Socket.io**: Real-time bidirectional event-based communication.

### 4.2 Database Models
1. **User**: Stores authentication details and encrypted passwords (using `bcrypt`).
2. **Project**: Stores the metadata (Name, Thumbnail) and the massive serialized JSON object containing all scenes, sprites, and blocks.
3. **Asset**: Stores metadata for uploaded custom sounds and images.

### 4.3 Authentication
- Uses **JSON Web Tokens (JWT)**.
- When a user logs in via the `authController`, a JWT is signed and returned. All subsequent API calls to save/load projects are protected by an `authMiddleware` that verifies the token signature against the `JWT_SECRET`.

### 4.4 Real-time Sockets
- Built for future collaborative editing. The `server.ts` establishes a Socket.io server. When changes occur on the frontend, diffs can be broadcasted to a socket room associated with a specific project ID, allowing multiple users to edit the same ScratchJr project concurrently. 

---

## 🚀 5. Getting Started & Running

1. **Install Dependencies**: Run `npm install` at the root.
2. **Environment Variables**:
   - Backend `.env`: Needs `PORT`, `MONGODB_URI`, `JWT_SECRET`
   - Frontend `.env.local`: Needs `NEXT_PUBLIC_API_URL`
3. **Run Services**:
   Execute `npm run dev` in the root folder. Turborepo will start both the Next.js frontend (default `:3000`) and the Express backend concurrently.
