To-Do List Web App

Responsive and interactive To-Do List built with pure HTML, CSS, and JavaScript (no frameworks). 
Includes simple client-side auth and route protection, with per-user data saved in localStorage.

Features

-Login & Register on a dedicated screen (no sidebar), with protected routes
-Dashboard with three columns by priority: High, Medium, Low
-Add/Edit tasks: title, description, priority, and deadline (date picker)
-Mark as Done/Pending and Delete tasks
-Inline preview with filters (All / Pending / Done) on Add Task page
-Monthly Calendar showing tasks by day (with “+N more” overflow)
-Collapsible sidebar (☰) and a topbar greeting
-Sticky footer with credits (Peterson E S Silva) and today’s date
-Per-user persistence via localStorage (lists isolated by email)
-Responsive design with small accessibility touches (focus management, etc.)

Pages & Routes

Login – first page for unauthenticated users (#/login)
Register – create account (name, email, password) (#/register)
Dashboard – priority columns with task cards (#/dashboard)
Add Task – form + preview with filters (#/add)
Calendar – monthly deadlines view (#/calendar)

Getting Started

-Clone or download this repo
-Open index.html in your browser
-Register, then log in, and start adding tasks
-No build tools or installs required — everything runs client-side.


File Structure

index.html — main markup and app containers
styles.css — layout, sidebar, cards, calendar, etc.
app.js — routing, auth, tasks, calendar, and storage logic


Data & Security Notes:
Data is stored in the browser’s localStorage.
Each user’s tasks use a key like tdl_tasks_<email>.
This is an educational/demo app: credentials and data are not encrypted.


Roadmap (nice-to-haves)

-Text search and date-range filters
-Drag-and-drop between columns (Kanban)
-Tags/categories and tag filtering
-Export/Import JSON
-Real backend (API) and secure authentication

Browser Support

Works on modern browsers: Chrome, Firefox, Edge, Safari.


Author

Created by Peterson E S Silva as a personal exercise to build a clean, usable JavaScript web app 
using only the DOM API and localStorage.