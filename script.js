// ===== Utils =====
// Small DOM helpers
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

// Format YYYY-MM-DD (or ISO) to a readable date for UI
const fmtDate = (iso, locale = 'en-US') =>
    iso
        ? new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''))
            .toLocaleDateString(locale)
        : '';

// Today as YYYY-MM-DD (used by <input type="date" min>)
const todayStr = () => {
    const d = new Date();
    const y = d.getFullYear(),
        m = String(d.getMonth() + 1).padStart(2, '0'),
        dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
};

// Simple random id
const uid = () => Math.random().toString(36).slice(2, 9);

// ===== Storage Layer (localStorage) =====
const LS = {
    usersKey: 'tdl_users',
    meKey: 'tdl_current_user',
    tasksKey(email) {
        return `tdl_tasks_${email}`;
    },

    getUsers() {
        return JSON.parse(localStorage.getItem(this.usersKey) || '[]');
    },
    setUsers(list) {
        localStorage.setItem(this.usersKey, JSON.stringify(list));
    },

    getMe() {
        return JSON.parse(localStorage.getItem(this.meKey) || 'null');
    },
    setMe(u) {
        localStorage.setItem(this.meKey, JSON.stringify(u));
    },
    clearMe() {
        localStorage.removeItem(this.meKey);
    },

    getTasks(email) {
        const raw = localStorage.getItem(this.tasksKey(email));
        return raw ? JSON.parse(raw) : [];
    },
    setTasks(email, tasks) {
        localStorage.setItem(this.tasksKey(email), JSON.stringify(tasks));
    }
};

// ===== Auth =====
const Auth = {
    register({ name, email, password }) {
        email = email.trim().toLowerCase();
        const users = LS.getUsers();
        if (users.some(u => u.email === email)) throw new Error('Email already registered.');
        if (password.length < 4) throw new Error('Password must be at least 4 characters.');
        const user = { id: uid(), name: name.trim(), email, password };
        users.push(user);
        LS.setUsers(users);
        LS.setMe({ id: user.id, name: user.name, email: user.email });
        // start with an empty task list for this user
        LS.setTasks(email, []);
        return user;
    },
    login({ email, password }) {
        email = email.trim().toLowerCase();
        const user = LS.getUsers().find(u => u.email === email && u.password === password);
        if (!user) throw new Error('Invalid credentials.');
        LS.setMe({ id: user.id, name: user.name, email: user.email });
        return user;
    },
    logout() {
        LS.clearMe();
    }
};

// ===== Tasks API =====
const Tasks = {
    list({ ownerEmail, status = 'all' }) {
        let list = LS.getTasks(ownerEmail);
        if (status !== 'all') {
            const wantDone = status === 'done';
            list = list.filter(t => !!t.done === wantDone);
        }
        // order: not-done first, then nearest due date
        return list.sort(
            (a, b) =>
                a.done - b.done ||
                new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31')
        );
    },
    add(ownerEmail, data) {
        const task = {
            id: uid(),
            title: data.title.trim(),
            description: (data.description || '').trim(),
            level: data.level, // 'high' | 'medium' | 'low'
            dueDate: data.dueDate || null, // 'YYYY-MM-DD'
            done: false,
            createdAt: new Date().toISOString()
        };
        const list = LS.getTasks(ownerEmail);
        list.push(task);
        LS.setTasks(ownerEmail, list);
        return task;
    },
    toggleDone(ownerEmail, id) {
        const list = LS.getTasks(ownerEmail);
        const task = list.find(t => t.id === id);
        if (task) {
            task.done = !task.done;
            LS.setTasks(ownerEmail, list);
        }
        return task;
    },
    remove(ownerEmail, id) {
        let list = LS.getTasks(ownerEmail);
        list = list.filter(t => t.id !== id);
        LS.setTasks(ownerEmail, list);
    }, // <-- important comma

    // new methods
    update(ownerEmail, id, data) {
        const list = LS.getTasks(ownerEmail);
        const i = list.findIndex(t => t.id === id);
        if (i > -1) {
            list[i] = {
                ...list[i],
                title: data.title.trim(),
                description: (data.description || '').trim(),
                level: data.level,
                dueDate: data.dueDate || null
            };
            LS.setTasks(ownerEmail, list);
            return list[i];
        }
    },
    get(ownerEmail, id) {
        return LS.getTasks(ownerEmail).find(t => t.id === id);
    }
};

// ===== Router (hash-based) =====
const routes = {
    '/login': renderLogin,
    '/register': renderRegister,
    '/dashboard': guard(renderDashboard),
    '/add': guard(renderAdd),
    '/calendar': guard(renderCalendar)
};

function guard(viewFn) {
    return params => {
        const me = LS.getMe();
        if (!me) {
            navigate('/login');
            return;
        }
        return viewFn(params);
    };
}

function navigate(path) {
    if (location.hash !== `#${path}`) location.hash = `#${path}`;
    else onRouteChange();
}

function onRouteChange() {
    const meForDefault = LS.getMe();
    const defaultRoute = meForDefault ? '/dashboard' : '/login';
    const hash = location.hash.replace(/^#/, '') || defaultRoute;

    const view = routes[hash] || routes[defaultRoute];
    setActiveNav(hash);

    // login/register = separate page (hide sidebar/topbar/footer)
    const isAuthScreen = hash === '/login' || hash === '/register';
    document.body.classList.toggle('auth-screen', isAuthScreen);

    view();
    setTimeout(() => $('#app')?.focus(), 0);
}

// ===== Shared UI helpers =====
function setActiveNav(hash) {
    $$('.nav-item').forEach(a => a.classList.remove('active'));
    const link = $(`.nav a[href="#${hash}"]`);
    if (link) link.classList.add('active');
    const me = LS.getMe();
    $$('.auth-only-logged-in').forEach(el => el.classList.toggle('hidden', !me));
    $$('.auth-only-logged-out').forEach(el => el.classList.toggle('hidden', !!me));
    $('#hello').textContent = me ? `Hello, ${me.name}!` : '';
}

function renderEmpty(text) {
    return `<div class="empty">${text}</div>`;
}

function levelBadge(level) {
    const map = { high: 'High', medium: 'Medium', low: 'Low' };
    return `<span class="badge ${level}">${map[level] || level}</span>`;
}

// ===== Views =====
function renderLogin() {
    $('#app').innerHTML = `
    <section class="section auth-box">
      <h2>Login</h2>
      <form id="form-login" class="form">
        <div class="input"><label>Email</label><input type="email" required name="email" placeholder="you@email.com" /></div>
        <div class="input"><label>Password</label><input type="password" required name="password" placeholder="••••" /></div>
        <div class="btn-row">
          <button class="btn" type="submit">Sign in</button>
          <a href="#/register" class="btn ghost">Register here</a>
        </div>
      </form>
      <p style="margin-top:12px;color:var(--muted)">
        Small To-Do List app with levels (high/medium/low), due date, and a monthly calendar.
      </p>
    </section>
  `;
    $('#form-login').addEventListener('submit', e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        try {
            Auth.login(data);
            navigate('/dashboard');
        } catch (err) {
            alert(err.message);
        }
    });
}

function renderRegister() {
    $('#app').innerHTML = `
    <section class="section auth-box">
      <h2>Register</h2>
      <form id="form-register" class="form">
        <div class="input"><label>Name</label><input name="name" required placeholder="Your name" /></div>
        <div class="input"><label>Email</label><input type="email" name="email" required placeholder="you@email.com" /></div>
        <div class="input"><label>Password</label><input type="password" name="password" required placeholder="min. 4 characters" /></div>
        <div class="btn-row">
          <button class="btn" type="submit">Create account</button>
          <a href="#/login" class="btn ghost">Back to Login</a>
        </div>
      </form>
    </section>
  `;
    $('#form-register').addEventListener('submit', e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        try {
            Auth.register(data);
            navigate('/dashboard');
        } catch (err) {
            alert(err.message);
        }
    });
}

function renderDashboard() {
    const me = LS.getMe();
    const container = document.createElement('div');
    container.className = 'grid cols-3';

    const levels = ['high', 'medium', 'low'];
    levels.forEach(level => {
        const tasks = Tasks.list({ ownerEmail: me.email }).filter(t => t.level === level);
        const section = document.createElement('section');
        section.className = 'section';
        section.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
        <h3 style="margin:0">${level === 'high' ? 'High Priority' : level === 'medium' ? 'Medium Priority' : 'Low Priority'}</h3>
        ${levelBadge(level)}
      </div>
      <div id="col-${level}" class="col">
        ${tasks.length ? '' : renderEmpty('No tasks in this column.')}
      </div>
    `;
        container.appendChild(section);

        const col = section.querySelector(`#col-${level}`);
        tasks.forEach(t => col.appendChild(taskRow(t, me.email)));
    });

    $('#app').innerHTML = '';
    $('#app').appendChild(container);
}

function taskRow(task, ownerEmail) {
    const el = document.createElement('div');
    el.className = 'task';
    el.innerHTML = `
    <div>
      <div class="title">${task.title}</div>
      <div class="meta">
        ${levelBadge(task.level)}
        ${task.dueDate ? `• <span>Due: ${fmtDate(task.dueDate)}</span>` : ''}
        • <span class="status ${task.done ? 'done' : 'pending'}">${task.done ? 'Done' : 'Pending'}</span>
      </div>
      ${task.description ? `<div style="margin-top:6px;color:var(--muted)">${task.description}</div>` : ''}
    </div>
    <div class="task-controls">
      <button class="btn ${task.done ? 'warn' : ''}" data-act="toggle">${task.done ? 'Mark pending' : 'Mark done'}</button>
      <button class="btn" data-act="edit">Edit</button>
      <button class="btn danger" data-act="delete">Delete</button>
    </div>
  `;

    el.querySelector('[data-act="toggle"]').addEventListener('click', () => {
        Tasks.toggleDone(ownerEmail, task.id);
        renderDashboard();
    });

    el.querySelector('[data-act="edit"]').addEventListener('click', () => {
        sessionStorage.setItem('tdl_edit_id', task.id);
        navigate('/add');
    });

    el.querySelector('[data-act="delete"]').addEventListener('click', () => {
        if (confirm('Delete this task?')) {
            Tasks.remove(ownerEmail, task.id);
            renderDashboard();
        }
    });

    return el;
}

function renderAdd() {
    const me = LS.getMe();
    const editId = sessionStorage.getItem('tdl_edit_id');
    const existing = editId ? Tasks.get(me.email, editId) : null;

    $('#app').innerHTML = `
    <div class="grid cols-2">
      <section class="section">
        <h2 id="add-title">${existing ? 'Edit task' : 'Add task'}</h2>
        <form id="form-add" class="form">
          <div class="input"><label>Title</label><input name="title" required placeholder="e.g. Study JavaScript" /></div>
          <div class="input"><label>Description (optional)</label><textarea name="description" rows="3" placeholder="Details..."></textarea></div>
          <div class="grid cols-2">
            <div class="input">
              <label>Level</label>
              <select name="level" required>
                <option value="high">High level</option>
                <option value="medium">Medium level</option>
                <option value="low">Low level</option>
              </select>
            </div>
            <div class="input">
              <label>Due date</label>
              <input type="date" name="dueDate" min="${todayStr()}" />
            </div>
          </div>
          <div class="btn-row">
            <button class="btn" id="submit-add" type="submit">${existing ? 'Save changes' : 'Add task'}</button>
            <button class="btn ghost ${existing ? '' : 'hidden'}" id="cancel-edit" type="button">Cancel editing</button>
            <a href="#/dashboard" class="btn ghost">Go to Dashboard</a>
          </div>
        </form>
      </section>

      <section class="section">
        <h3>Preview</h3>
        <div class="chips" id="chips-filter">
          <button class="chip active" data-filter="all">All</button>
          <button class="chip" data-filter="pending">Pending</button>
          <button class="chip" data-filter="done">Done</button>
        </div>
        <div id="list-preview" style="margin-top:12px"></div>
      </section>
    </div>
  `;

    const form = $('#form-add');

    // Pre-fill when editing
    if (existing) {
        form.title.value = existing.title;
        form.description.value = existing.description || '';
        form.level.value = existing.level;
        form.dueDate.value = existing.dueDate || '';
        $('#cancel-edit').onclick = () => {
            sessionStorage.removeItem('tdl_edit_id');
            navigate('/add');
        };
    }

    form.addEventListener('submit', e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        try {
            if (existing) {
                Tasks.update(me.email, existing.id, data);
                sessionStorage.removeItem('tdl_edit_id');
                alert('Task updated!');
                navigate('/dashboard');
            } else {
                Tasks.add(me.email, data);
                form.reset();
                updatePreview();
                alert('Task added!');
            }
        } catch (err) {
            alert(err.message);
        }
    });

    // Preview filters
    $('#chips-filter').addEventListener('click', e => {
        const btn = e.target.closest('.chip');
        if (!btn) return;
        $$('#chips-filter .chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        updatePreview(btn.dataset.filter);
    });

    function updatePreview(sel) {
        const selected = sel || $('#chips-filter .chip.active')?.dataset.filter || 'all';
        const map = { pending: 'pending', done: 'done', all: 'all' };
        const list = Tasks.list({ ownerEmail: me.email, status: map[selected] });
        const box = $('#list-preview');
        if (!list.length) {
            box.innerHTML = renderEmpty('Nothing here.');
            return;
        }
        box.innerHTML = list
            .map(
                t => `
      <div class="task" style="grid-template-columns:1fr">
        <div class="title">${t.title}</div>
        <div class="meta">
          ${levelBadge(t.level)}
          ${t.dueDate ? `• Due ${fmtDate(t.dueDate)}` : ''}
          • <span class="status ${t.done ? 'done' : 'pending'}">${t.done ? 'Done' : 'Pending'}</span>
        </div>
      </div>
    `
            )
            .join('');
    }
    updatePreview('all');
}

function renderCalendar() {
    const me = LS.getMe();
    const now = new Date();
    let state = { month: now.getMonth(), year: now.getFullYear() };

    $('#app').innerHTML = `
    <section class="calendar" id="calendar">
      <div class="cal-head">
        <button class="btn ghost" id="prev-month">◀</button>
        <div id="cal-title" style="font-weight:700"></div>
        <div class="btn-row">
          <button class="btn ghost" id="today-btn">Today</button>
          <button class="btn ghost" id="next-month">▶</button>
        </div>
      </div>
      <div class="cal-grid" id="cal-weekdays"></div>
      <div class="cal-grid" id="cal-cells"></div>
    </section>
  `;

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    $('#cal-weekdays').innerHTML = weekdays.map(d => `<div class="cal-weekday">${d}</div>`).join('');

    $('#prev-month').onclick = () => {
        step(-1);
    };
    $('#next-month').onclick = () => {
        step(+1);
    };
    $('#today-btn').onclick = () => {
        state.month = now.getMonth();
        state.year = now.getFullYear();
        draw();
    };

    function step(delta) {
        state.month += delta;
        if (state.month < 0) {
            state.month = 11;
            state.year -= 1;
        }
        if (state.month > 11) {
            state.month = 0;
            state.year += 1;
        }
        draw();
    }

    function draw() {
        const { month, year } = state;
        $('#cal-title').textContent = new Date(year, month, 1).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
        const firstDay = new Date(year, month, 1);
        const startWeekday = firstDay.getDay(); // 0 = Sun
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const tasks = Tasks.list({ ownerEmail: me.email, status: 'all' });
        const byDate = tasks.reduce((acc, t) => {
            if (!t.dueDate) return acc;
            const d = new Date(t.dueDate + 'T00:00:00');
            if (d.getMonth() === month && d.getFullYear() === year) {
                const k = d.getDate();
                (acc[k] ||= []).push(t);
            }
            return acc;
        }, {});

        // Build cells
        const cells = [];
        // leading blanks
        for (let i = 0; i < startWeekday; i++) cells.push('');
        // month days
        for (let day = 1; day <= daysInMonth; day++) {
            const list = byDate[day] || [];
            const pills = list
                .slice(0, 4)
                .map(t => `<div class="cal-pill ${t.level}" title="${t.title}">${t.title}</div>`)
                .join('');
            const extra = list.length > 4 ? `<div class="cal-pill">+${list.length - 4} more</div>` : '';
            cells.push(`
        <div class="cal-cell">
          <div class="cal-daynum">${String(day).padStart(2, '0')}</div>
          <div class="cal-tasks">${pills}${extra}</div>
        </div>
      `);
        }
        // trailing to complete rows
        while (cells.length % 7 !== 0) cells.push('');

        $('#cal-cells').innerHTML = cells.map(c => c || `<div class="cal-cell" aria-hidden="true"></div>`).join('');
    }

    draw();
}

// ===== Sidebar / Header wiring =====
function setupChrome() {
    const sidebar = $('#sidebar');
    const page = $('.page');
    const toggleButtons = ['#sidebar-toggle', '#topbar-toggle'].map(sel => $(sel));

    const setCollapsed = collapsed => {
        sidebar.classList.toggle('collapsed', collapsed);
        page.classList.toggle('sidebar-collapsed', collapsed);
        toggleButtons.forEach(btn => btn.setAttribute('aria-expanded', String(!collapsed)));
    };

    toggleButtons.forEach(btn =>
        btn.addEventListener('click', () => {
            setCollapsed(!sidebar.classList.contains('collapsed'));
        })
    );

    // persist sidebar preference for the session
    const saved = sessionStorage.getItem('tdl_sidebar_collapsed') === '1';
    setCollapsed(saved);
    sidebar.addEventListener('transitionend', () => {
        sessionStorage.setItem('tdl_sidebar_collapsed', sidebar.classList.contains('collapsed') ? '1' : '0');
    });

    // footer date ticker
    const f = $('#footer-date');
    const tick = () =>
    (f.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }));
    tick();
    setInterval(tick, 60_000);

    // logout
    $('#btn-logout').addEventListener('click', () => {
        Auth.logout();
        setActiveNav('/login');
        navigate('/login');
    });
}

// ===== Boot =====
setupChrome();
setActiveNav(location.hash.replace(/^#/, '') || '/login'); // login as default
onRouteChange();
window.addEventListener('hashchange', onRouteChange);

// Optional seed (uncomment to populate a first-time demo)
// ;(function seed(){
//   if (!LS.getMe() && !LS.getUsers().length){
//     Auth.register({name:'You', email:'you@example.com', password:'1234'});
//     const me = LS.getMe();
//     Tasks.add(me.email, {title:'Review project requirements', description:'Read carefully', level:'high', dueDate: todayStr()});
//     Tasks.add(me.email, {title:'Build HTML/CSS structure', level:'medium', dueDate: todayStr()});
//     Tasks.add(me.email, {title:'Refine styles', level:'low', dueDate: ''});
//   }
// })();
