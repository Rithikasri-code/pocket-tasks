
# TODO with IndexedDB

A minimal TODO application implemented as a **Web Component** and powered by **IndexedDB** for persistent client‑side storage.

The project demonstrates how to build a lightweight browser application using only **native web technologies**.  
No frameworks, no libraries, and no build tools are required.

The component intentionally **does not use Shadow DOM**, allowing full control over styling from global CSS and easier integration with existing layouts.

---

# Features

- Create TODO items
- Persistent storage using **IndexedDB**
- Automatic task restoration after page reload
- Mark tasks as completed
- Delete tasks
- **Touch‑friendly swipe gestures**
- Implemented as a **reusable Web Component**
- **No frameworks**
- **No dependencies**
- **No Shadow DOM**
- Built‑in **sample task generator**

---

# Interaction

Each TODO item supports swipe gestures similar to mobile task applications.

| Gesture | Action |
|---|---|
| Swipe right | Delete task |
| Swipe left | Mark task as done |

These gestures work well on **touch devices, trackpads, and with mouse drag interactions**.

---

# Web Component

The application is packaged as a custom HTML element.

Example usage:

```html
<ts-todo></ts-todo>
```

Component registration:

```javascript
document.addEventListener('DOMContentLoaded', () => 
    window.customElements.define("ts-todo", TSTodo)
)
```

The component uses **standard DOM instead of Shadow DOM**, which means:

- full control through global CSS
- easier integration with existing design systems
- simpler debugging
- no style encapsulation conflicts

---

# Task Data Structure

Each TODO item is stored as a structured object.

```javascript
const obj = {
    title: title,
    text: text,
    category: category,
    done: done,
    date: date.split("T")[0],
}
```

Field description:

| Field | Description |
|---|---|
| title | Short task title |
| text | Additional task description |
| category | Task category label |
| done | Completion status |
| date | Task date in YYYY-MM-DD format |

---

# Built‑in Sample Tasks

The component contains built‑in logic for quickly generating example TODO items.

If the **Add Task** button is pressed while the input fields are empty, the application automatically creates **sample tasks**.  

This feature makes it easy to:

- quickly populate the interface
- test interactions
- demonstrate swipe actions

---

# Running the Project

Clone the repository:

```bash
git clone https://github.com/stacherski/TODO-with-indexedDB.git
```

Enter the project directory:

```bash
cd TODO-with-indexedDB
```

Run a simple local server:

```bash
npx serve
```

Then open:

```
http://localhost:3000
```

Opening `index.html` directly in the browser also works.

---

# Project Goals

This repository demonstrates:

- practical use of **IndexedDB for browser persistence**
- building UI using **Web Components**
- implementing **gesture‑based task interactions**
- creating small **framework‑free web applications**

The project is intentionally small and simple so developers can easily understand the full implementation.

---

# License

MIT
