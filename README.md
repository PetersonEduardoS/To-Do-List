# To-Do List Web App

**Live demo:** https://petersoneduardos.github.io/To-Do-List/

A responsive task manager built with pure **HTML, CSS and JavaScript** (no frameworks or build tools). It has client-side login and route protection, a priority board and a monthly calendar, with each user's data saved in `localStorage`.

## Features

- Login and Register screens with protected routes
- Dashboard with three columns by priority: High, Medium, Low
- Add and edit tasks with title, description, priority and deadline
- Mark tasks as Done/Pending and delete them
- Add Task page with a live preview and filters (All / Pending / Done)
- Monthly calendar showing tasks by due date (with "+N more" overflow)
- Collapsible sidebar and a topbar greeting
- Per-user persistence in `localStorage` (task lists isolated by email)
- Responsive layout with basic accessibility (focus management)

## Pages and Routes

| Page | Route | Description |
|---|---|---|
| Login | `#/login` | First page for unauthenticated users |
| Register | `#/register` | Create an account (name, email, password) |
| Dashboard | `#/dashboard` | Priority columns with task cards |
| Add Task | `#/add` | Form with preview and filters |
| Calendar | `#/calendar` | Monthly view of deadlines |

## Getting Started

Open the [live demo](https://petersoneduardos.github.io/To-Do-List/), or run it locally:

```bash
git clone https://github.com/PetersonEduardoS/To-Do-List.git
cd To-Do-List
```

Then open `index.html` in your browser. No installs or build step needed.

## File Structure

```
index.html   # markup and app containers
style.css    # layout, sidebar, cards, calendar
script.js    # hash routing, auth, tasks, calendar and storage logic
```

## Data and Security Notes

- Data is stored in the browser's `localStorage`; each user's tasks use a key like `tdl_tasks_<email>`.
- User-provided text is HTML-escaped before rendering to prevent XSS.
- This is an educational front-end project: credentials and data are **not** encrypted and the "auth" is client-side only. A real app would use a back-end API with hashed passwords and token-based authentication (see my [Hospital Appointment System](https://github.com/PetersonEduardoS/HospitalAppointmentSystem71557)).

## Roadmap

- Text search and date-range filters
- Drag-and-drop between columns (Kanban)
- Tags/categories and tag filtering
- Export/Import JSON
- Real back end (API) with secure authentication

## Browser Support

Modern browsers: Chrome, Firefox, Edge, Safari.

## Author

**Peterson Eduardo Sampaio Silva**
[LinkedIn](https://www.linkedin.com/in/peterson-eduardo-silva) · [GitHub](https://github.com/PetersonEduardoS)
