// Get references to HTML elements
const form = document.getElementById('todo-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const filterButtons = document.querySelectorAll('#filters button');

// Load tasks from localStorage or initialize an empty array
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let draggedIndex = null;

// Handle form submission (adding a new task)
form.addEventListener('submit', function (e) {
  e.preventDefault(); // Prevent page reload

  const taskText = taskInput.value.trim();
  if (taskText === '') return; // Ignore empty input

  const priority = document.getElementById('priority-input').value;
  const deadline = document.getElementById('deadline-input').value;

  // Create a new task object
  const newTask = {
    text: taskText,
    priority: priority,
    deadline: deadline,
    done: false
  };

  // Add new task to the list
  tasks.push(newTask);
  saveTasks();       // Save to localStorage
  taskInput.value = ''; // Clear input field
  renderTasks();     // Re-render task list
});

// Function to render tasks on the page
function renderTasks() {
  taskList.innerHTML = ''; // Clear current list

  // Apply filter (all, pending, or done)
  const filteredTasks = tasks
    .map((task, index) => ({ ...task, index })) // Add index to task object
    .filter(task => {
      if (currentFilter === 'pending') return !task.done;
      if (currentFilter === 'done') return task.done;
      return true;
    });

  // Loop through filtered tasks and add them to the DOM
  filteredTasks.forEach(task => {
    const li = document.createElement('li');
    li.setAttribute('draggable', 'true');
    li.dataset.index = task.index;

    if (task.done) {
      li.classList.add('done'); // Add class if task is marked done
    }

    // Task item HTML
    li.innerHTML = `
      <input type="checkbox" data-index="${task.index}" ${task.done ? 'checked' : ''}>

      <div style="flex: 1">
        <span style="display: block; text-decoration: ${task.done ? 'line-through' : 'none'}">
          ${task.text}
        </span>
        <small style="color: #666">Deadline: ${task.deadline || '—'}</small>
      </div>

      <span class="priority ${task.priority}">${task.priority}</span>
      <button class="edit-btn" data-edit="${task.index}">✏️</button>
      <button class="delete-btn" data-delete="${task.index}">❌</button>
    `;

    // Drag & drop functionality
    li.addEventListener('dragstart', () => {
      draggedIndex = task.index;
      li.classList.add('dragging');
    });

    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
    });

    li.addEventListener('dragover', e => {
      e.preventDefault(); // Allow dropping
    });

    li.addEventListener('drop', () => {
      const targetIndex = parseInt(li.dataset.index);
      if (draggedIndex !== null && draggedIndex !== targetIndex) {
        const movedTask = tasks.splice(draggedIndex, 1)[0];
        tasks.splice(targetIndex, 0, movedTask);
        saveTasks();
        renderTasks();
      }
    });

    // Add task to the list
    taskList.appendChild(li);
  });
}

// Save tasks to localStorage
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Toggle task completion status (checkbox)
taskList.addEventListener('change', function (e) {
  if (e.target.matches('input[type="checkbox"]')) {
    const index = e.target.dataset.index;
    tasks[index].done = !tasks[index].done;
    saveTasks();
    renderTasks();
  }
});

// Handle task deletion and editing
taskList.addEventListener('click', function (e) {
  // Delete task
  if (e.target.matches('.delete-btn')) {
    const index = parseInt(e.target.dataset.delete);
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
  }

  // Edit task
  if (e.target.matches('.edit-btn')) {
    const index = parseInt(e.target.dataset.edit);
    const currentTask = tasks[index];
  
    // Prompt user to edit task text
    const newText = prompt('Edit task text:', currentTask.text);
    if (newText === null || newText.trim() === '') return;
  
    // Prompt for new priority
    const newPriority = prompt(
      `Select priority:\n1 - Low\n2 - Medium\n3 - High`,
      currentTask.priority === 'low' ? '1' : currentTask.priority === 'medium' ? '2' : '3'
    );
  
    const priorityMap = { '1': 'low', '2': 'medium', '3': 'high' };
    const selectedPriority = priorityMap[newPriority];
  
    if (!selectedPriority) {
      alert('Invalid choice. Please enter 1, 2 or 3.');
      return;
    }
  
    // Apply changes to task
    tasks[index].text = newText.trim();
    tasks[index].priority = selectedPriority;
    saveTasks();
    renderTasks();
  }
});

// Filter buttons (All, Pending, Done)
filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    renderTasks();
  });
});

// Theme toggle functionality
const toggleBtn = document.getElementById('toggle-theme');

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
    toggleBtn.textContent = '☀️ Light Mode';
  } else {
    document.body.classList.remove('dark-mode');
    toggleBtn.textContent = '🌙 Dark Mode';
  }
  localStorage.setItem('theme', theme); // Save theme preference
}

// Toggle between light/dark theme on button click
toggleBtn.addEventListener('click', () => {
  const isDark = document.body.classList.contains('dark-mode');
  applyTheme(isDark ? 'light' : 'dark');
});

// On page load: apply saved theme and render tasks
const savedTheme = localStorage.getItem('theme') || 'light';
applyTheme(savedTheme);
renderTasks();
