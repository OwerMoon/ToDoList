// Находим элементы на странице
const form = document.querySelector('#form');
const taskTitleInput = document.querySelector('#taskTitleInput');
const taskDescriptionInput = document.querySelector('#taskDescriptionInput');
const tasksList = document.querySelector('#tasksList');

let tasks = [];

// Загружаем задачи из localStorage
if (localStorage.getItem('tasks')) {
    tasks = JSON.parse(localStorage.getItem('tasks'));
    tasks.forEach((task) => renderTask(task));
}

checkEmptyList();

// Автоматическое увеличение textarea при вводе
taskDescriptionInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Инициализация высоты при загрузке
if (taskDescriptionInput) {
    taskDescriptionInput.style.height = taskDescriptionInput.scrollHeight + 'px';
}

// Обработчики событий
form.addEventListener('submit', addTask);
tasksList.addEventListener('click', handleTaskActions);

// Функции  
function addTask(event) {
    event.preventDefault();

    const taskTitle = taskTitleInput.value.trim();
    const taskDescription = taskDescriptionInput.value.trim();

    if (!taskTitle) {
        showNotification('Введите заголовок задачи!', true);
        return;
    }

    const newTask = {
        id: Date.now(),
        title: taskTitle,
        description: taskDescription,
        done: false,
        expanded: false
    };

    tasks.push(newTask);
    saveToLocalStorage();
    renderTask(newTask);   
    
    // Очищаем поля
    taskTitleInput.value = "";
    taskDescriptionInput.value = "";
    taskTitleInput.focus();
    
    // Сбрасываем высоту textarea
    taskDescriptionInput.style.height = 'auto';

    checkEmptyList();
    showNotification('Задача добавлена!');
}

function handleTaskActions(event) {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;

    const taskItem = event.target.closest('.task-item');
    const id = Number(taskItem.id);
    const task = tasks.find(t => t.id === id);
    
    if (!task) return;

    switch (action) {
        case 'delete':
            deleteTask(task, taskItem);
            break;
        case 'done':
            doneTask(task, taskItem);
            break;
        case 'copy':
            copyTask(task);
            break;
        case 'edit':
            startEditTask(task, taskItem);
            break;
        case 'save-edit':
            saveEditTask(task, taskItem);
            break;
        case 'cancel-edit':
            cancelEditTask(task, taskItem);
            break;
        case 'toggle':
            toggleTask(task, taskItem);
            break;
    }
}

function deleteTask(task, taskItem) {
    tasks = tasks.filter(t => t.id !== task.id);
    saveToLocalStorage();
    taskItem.remove();
    checkEmptyList();
    showNotification('Задача удалена!');
}

function doneTask(task, taskItem) {
    task.done = !task.done;
    saveToLocalStorage();
    
    const taskTitle = taskItem.querySelector('.task-title');
    taskTitle.classList.toggle('task-title--done');
    
    showNotification(task.done ? 'Задача выполнена!' : 'Задача в работе');
}

function copyTask(task) {
    const textToCopy = task.description || '';
    
    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            showNotification('Описание скопировано!');
        })
        .catch(err => {
            console.error('Ошибка копирования: ', err);
            showNotification('Не удалось скопировать текст', true);
        });
}

function toggleTask(event) {
    // Проверяем, что клик был по заголовку
    if (!event.target.closest('.task-header')) return;
    
    const taskItem = event.target.closest('.task-item');
    const id = Number(taskItem.id);
    const task = tasks.find((task) => task.id === id);
    
    // Если задача в режиме редактирования - не раскрываем
    if (taskItem.classList.contains('editing')) return;
    
    task.expanded = !task.expanded;
    saveToLocalStorage();
    
    taskItem.classList.toggle('expanded');
}

function startEditTask(task, taskItem) {
    // Переводим задачу в режим редактирования
    taskItem.classList.add('editing');
    
    // Сохраняем оригинальные значения на случай отмены
    taskItem.dataset.originalTitle = task.title;
    taskItem.dataset.originalDescription = task.description;
    
    // Создаем элементы для редактирования
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'form-control task-edit-title mb-2';
    titleInput.value = task.title;
    
    const descriptionInput = document.createElement('textarea');
    descriptionInput.className = 'form-control task-edit-description';
    descriptionInput.value = task.description;
    
    // Увеличиваем высоту textarea
    descriptionInput.style.height = 'auto';
    descriptionInput.style.height = descriptionInput.scrollHeight + 'px';
    
    // Создаем кнопки управления
    const editControls = document.createElement('div');
    editControls.className = 'edit-controls';
    
    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'btn btn-success';
    saveButton.textContent = 'Сохранить';
    saveButton.dataset.action = 'save-edit';
    
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'btn btn-secondary';
    cancelButton.textContent = 'Отменить';
    cancelButton.dataset.action = 'cancel-edit';
    
    editControls.appendChild(saveButton);
    editControls.appendChild(cancelButton);
    
    // Находим контейнер описания
    const descriptionContainer = taskItem.querySelector('.task-description');
    
    // Заменяем содержимое
    descriptionContainer.innerHTML = '';
    descriptionContainer.appendChild(titleInput);
    descriptionContainer.appendChild(descriptionInput);
    descriptionContainer.appendChild(editControls);
    
    // Показываем описание, если оно было скрыто
    if (!taskItem.classList.contains('expanded')) {
        taskItem.classList.add('expanded');
    }
    
    // Фокусируемся на заголовке
    titleInput.focus();
    
    showNotification('Редактирование задачи');
}

function saveEditTask(task, taskItem) {
    const titleInput = taskItem.querySelector('.task-edit-title');
    const descriptionInput = taskItem.querySelector('.task-edit-description');
    
    const newTitle = titleInput.value.trim();
    const newDescription = descriptionInput.value.trim();
    
    if (!newTitle) {
        showNotification('Заголовок не может быть пустым!', true);
        return;
    }
    
    // Обновляем задачу
    task.title = newTitle;
    task.description = newDescription;
    saveToLocalStorage();
    
    // Выходим из режима редактирования
    taskItem.classList.remove('editing');
    
    // Обновляем отображение задачи
    renderTask(task);
    
    showNotification('Задача обновлена!');
}

function cancelEditTask(task, taskItem) {
    // Восстанавливаем оригинальные значения
    task.title = taskItem.dataset.originalTitle;
    task.description = taskItem.dataset.originalDescription;
    
    // Выходим из режима редактирования
    taskItem.classList.remove('editing');
    
    // Обновляем отображение задачи
    renderTask(task);
    
    showNotification('Редактирование отменено');
}

function checkEmptyList() {
    if (tasks.length === 0) {
        const emptyListHTML = `<li id="emptyList" class="list-group-item empty-list">
            <img src="./img/leaf.svg" alt="Empty" width="48" class="mt-3">
            <div class="empty-list__title">Список дел пуст</div>
        </li>`;
        tasksList.insertAdjacentHTML('afterbegin', emptyListHTML);
    } else {
        const emptyListEl = document.querySelector('#emptyList');
        if (emptyListEl) emptyListEl.remove();
    }
}

function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTask(task) {
    const cssClass = task.done ? 'task-title task-title--done' : 'task-title';
    const expandedClass = task.expanded ? 'expanded' : '';

    // Форматируем описание с сохранением переносов строк
    const descriptionHTML = task.description 
        ? task.description.replace(/\n/g, '<br>') 
        : '<span class="text-muted">Нет описания</span>';

    const taskHTML = `
        <li id="${task.id}" class="list-group-item task-item ${expandedClass}">
            <div class="task-header d-flex justify-content-between" data-action="toggle">
                <span class="${cssClass}">${task.title}</span>
                <div class="task-item__buttons">
                    <button type="button" data-action="copy" class="btn-action" title="Копировать описание">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16">
                            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                            <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                        </svg>
                    </button>
                    <button type="button" data-action="edit" class="btn-action" title="Редактировать задачу">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#000" class="bi bi-pencil" viewBox="0 0 16 16">
                            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                        </svg>
                    </button>
                    <button type="button" data-action="done" class="btn-action" title="Отметить как выполненное">
                        <img src="./img/tick.svg" alt="Done" width="18" height="18">
                    </button>
                    <button type="button" data-action="delete" class="btn-action" title="Удалить задачу">
                        <img src="./img/cross.svg" alt="Delete" width="18" height="18">
                    </button>
                </div>
            </div>
            <div class="task-description">${descriptionHTML}</div>
        </li>
    `;
    
    // Находим текущий элемент задачи
    const existingElement = document.getElementById(task.id.toString());
    if (existingElement) {
        existingElement.outerHTML = taskHTML;
    } else {
        tasksList.insertAdjacentHTML('beforeend', taskHTML);
    }
}

function showNotification(message, isError = false) {
    // Удаляем старые уведомления
    const oldNotification = document.querySelector('.alert-notification');
    if (oldNotification) oldNotification.remove();
    
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.classList.add('alert-notification');
    notification.classList.add(isError ? 'alert-error' : 'alert-success');
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}