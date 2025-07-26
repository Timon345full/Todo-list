const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const categoryFilter = document.getElementById('categoryFilter');

let tasks = [];
let currentFilter = 'all';

async function loadTasks() {
  const res = await fetch('/api/tasks');
  tasks = await res.json();
  renderTasks();
}

function renderTasks() {
  taskList.innerHTML = '';
  let filteredTasks = tasks;

  if (currentFilter === 'active') {
    filteredTasks = tasks.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    filteredTasks = tasks.filter(t => t.completed);
  }

  if (filteredTasks.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'Задач нет';
    emptyMessage.style.color = '#777';
    emptyMessage.style.fontSize = 'clamp(12px, 2vw, 18px)';
    taskList.appendChild(emptyMessage);
    return;
  }

  filteredTasks.forEach(task => {
    const message = document.createElement('div');
    message.className = 'message' + (task.completed ? ' completed' : '');
    message.dataset.id = task.id;

    const checkboxDiv = document.createElement('div');
    checkboxDiv.className = 'checkbox';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleCompleted(task.id));
    checkboxDiv.appendChild(checkbox);

    const descDiv = document.createElement('div');
    descDiv.className = 'description';
    const p = document.createElement('p');
    p.textContent = task.text;
    descDiv.appendChild(p);

    const btnDiv = document.createElement('div');
    btnDiv.className = 'btn';

    const editBtn = document.createElement('button');
    editBtn.title = 'Редактировать';
    editBtn.innerHTML = '<i class="bi bi-pencil-fill"></i>';
    editBtn.addEventListener('click', () => editTask(task.id));
    btnDiv.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.title = 'Удалить';
    delBtn.innerHTML = '<i class="bi bi-trash"></i>';
    delBtn.addEventListener('click', () => deleteTask(task.id));
    btnDiv.appendChild(delBtn);

    message.appendChild(checkboxDiv);
    message.appendChild(descDiv);
    message.appendChild(btnDiv);

    taskList.appendChild(message);
  });
}

async function addTask() {
  const text = taskInput.value.trim();
  if (!text) {
    alert('Введите текст задачи');
    return;
  }
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({text})
  });
  if (res.ok) {
    taskInput.value = '';
    await loadTasks();
  } else {
    const data = await res.json();
    alert(data.error || 'Ошибка при добавлении задачи');
  }
}

async function deleteTask(id) {
  const res = await fetch(`/api/tasks/${id}`, {method: 'DELETE'});
  if (res.ok) {
    await loadTasks();
  }
}

async function toggleCompleted(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({completed: !task.completed})
  });
  if (res.ok) {
    await loadTasks();
  }
}

function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const messageDiv = taskList.querySelector(`.message[data-id="${id}"]`);
  if (!messageDiv) return;

  const descDiv = messageDiv.querySelector('.description');
  descDiv.innerHTML = '';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = task.text;
  input.style.fontSize = 'clamp(10px, 2vw, 16px)';
  input.style.width = '100%';
  descDiv.appendChild(input);
  input.focus();

  async function saveEdit() {
    const newText = input.value.trim();
    if (!newText) {
      alert('Текст задачи не может быть пустым');
      input.focus();
      return;
    }
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({text: newText})
    });
    if (res.ok) {
      await loadTasks();
    }
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      renderTasks();
    }
  });

  input.addEventListener('blur', () => {
    saveEdit();
  });
}

categoryFilter.addEventListener('click', e => {
  if (e.target.dataset.category) {
    currentFilter = e.target.dataset.category;
    Array.from(categoryFilter.children).forEach(div => {
      div.classList.toggle('active', div === e.target);
    });
    renderTasks();
  }
});

addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

loadTasks();
