document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const taskNameInput = document.getElementById('task-name');
    const taskDueDateInput = document.getElementById('task-due-date');
    const taskTimeInput = document.getElementById('task-time');
    const addTaskBtn = document.getElementById('add-task-btn');
    const upcomingTasksList = document.getElementById('upcoming-tasks-list');
    const completedTasksList = document.getElementById('completed-tasks-list');
    const priorityMessage = document.getElementById('priority-message');
    const pageViews = document.querySelectorAll('.page-view');
    const navItems = document.querySelectorAll('.nav-item');

    // --- State ---
    let tasks = [];

    // --- Local Storage Functions ---
    const saveTasks = () => {
        localStorage.setItem('studyPlannerTasks', JSON.stringify(tasks));
    };

    const loadTasks = () => {
        const storedTasks = localStorage.getItem('studyPlannerTasks');
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
        }
    };

    // --- Routing Functions ---

    // Function to set the active navigation link
    const updateNav = (page) => {
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === page) {
                item.classList.add('active');
            }
        });
    };

    // Main rendering function that decides which page content to show
    const handleRouting = () => {
        // Get current hash, default to dashboard
        let hash = window.location.hash.slice(1) || 'dashboard';
        
        // Ensure the hash corresponds to a valid page
        if (!['dashboard', 'upcoming', 'completed'].includes(hash)) {
            hash = 'dashboard';
        }

        // Show/Hide pages
        pageViews.forEach(page => {
            page.classList.remove('active-page');
            if (page.id.startsWith(hash)) {
                page.classList.add('active-page');
            }
        });

        // Update navigation UI
        updateNav(hash);

        // Render content based on the page
        if (hash === 'upcoming') {
            renderUpcomingTasks();
        } else if (hash === 'completed') {
            renderCompletedTasks();
        }
        // Dashboard page doesn't need task rendering, only the form
    };

    // --- Task Manipulation Functions ---

    // Function to add a new task
    const addTask = () => {
        const name = taskNameInput.value.trim();
        const dueDate = taskDueDateInput.value;
        const timeEstimate = parseInt(taskTimeInput.value);

        if (name === '' || dueDate === '' || isNaN(timeEstimate) || timeEstimate <= 0) {
            alert('Please fill in all fields with valid data.');
            return;
        }

        const newTask = {
            id: Date.now(),
            name: name,
            dueDate: dueDate,
            timeEstimate: timeEstimate,
            completed: false
        };

        tasks.push(newTask);
        saveTasks();

        // Clear input fields
        taskNameInput.value = '';
        taskDueDateInput.value = '';
        taskTimeInput.value = '';
        
        // Show success and move to upcoming page
        alert(`Task "${name}" added!`);
        window.location.hash = 'upcoming';
    };

    // Function to toggle task completion status
    const toggleComplete = (id) => {
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            saveTasks();
            
            // Re-render the current page to reflect changes
            handleRouting();
        }
    };

    // Function to delete a task
    const deleteTask = (id) => {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        
        // Re-render the current page to reflect changes
        handleRouting();
    };


    // --- Task Rendering Functions (Page Specific) ---

    const sortUpcomingTasks = (taskList) => {
        // Sort by Due Date (Earliest first), then by Estimated Time (Shortest first)
        return taskList.sort((a, b) => {
            const dateA = new Date(a.dueDate);
            const dateB = new Date(b.dueDate);

            // Compare by due date first
            if (dateA.getTime() !== dateB.getTime()) {
                return dateA - dateB;
            }
            
            // If due dates are the same, compare by estimated time (SPT)
            return a.timeEstimate - b.timeEstimate;
        });
    };

    const renderUpcomingTasks = () => {
        upcomingTasksList.innerHTML = '';
        priorityMessage.style.display = 'none';

        const upcomingTasks = tasks.filter(task => !task.completed);
        const sortedTasks = sortUpcomingTasks(upcomingTasks);
        
        if (sortedTasks.length === 0) {
            upcomingTasksList.innerHTML = '<li class="task-item" style="justify-content: center;">🎉 All caught up! No upcoming tasks.</li>';
            return;
        }

        // Display the priority message for the first upcoming task
        const firstTaskName = sortedTasks[0].name;
        priorityMessage.innerHTML = `Your top priority: <span class="highlight-name">${firstTaskName}</span>`;
        priorityMessage.style.display = 'block';

        // Render tasks
        sortedTasks.forEach((task, index) => {
            const taskItem = document.createElement('li');
            // Highlight the first task
            taskItem.className = `task-item ${index === 0 ? 'first-priority-task' : ''}`;
            taskItem.dataset.id = task.id;

            const taskDetails = document.createElement('div');
            taskDetails.className = 'task-details';
            taskDetails.innerHTML = `
                <div class="name">${task.name}</div>
                <div class="meta">
                    Due: ${task.dueDate} &bull; Est. time: ${task.timeEstimate} min
                </div>
            `;

            const taskActions = document.createElement('div');
            taskActions.className = 'task-actions';

            const completeBtn = document.createElement('button');
            completeBtn.className = 'complete-btn';
            completeBtn.textContent = 'Complete';
            completeBtn.addEventListener('click', () => toggleComplete(task.id));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => deleteTask(task.id));

            taskActions.appendChild(completeBtn);
            taskActions.appendChild(deleteBtn);
            
            taskItem.appendChild(taskDetails);
            taskItem.appendChild(taskActions);

            upcomingTasksList.appendChild(taskItem);
        });
    };

    const renderCompletedTasks = () => {
        completedTasksList.innerHTML = '';
        
        const completedTasks = tasks.filter(task => task.completed).reverse(); // Show most recent completed first
        
        if (completedTasks.length === 0) {
            completedTasksList.innerHTML = '<li class="task-item" style="justify-content: center;">Go get some work done! Nothing completed yet.</li>';
            return;
        }

        completedTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = 'task-item completed';
            taskItem.dataset.id = task.id;

            const taskDetails = document.createElement('div');
            taskDetails.className = 'task-details';
            taskDetails.innerHTML = `
                <div class="name">${task.name}</div>
                <div class="meta">
                    Completed &bull; Was Due: ${task.dueDate} &bull; Time: ${task.timeEstimate} min
                </div>
            `;
            
            const taskActions = document.createElement('div');
            taskActions.className = 'task-actions';

            const unmarkBtn = document.createElement('button');
            unmarkBtn.className = 'complete-btn';
            unmarkBtn.textContent = 'Unmark';
            unmarkBtn.addEventListener('click', () => toggleComplete(task.id));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => deleteTask(task.id));

            taskActions.appendChild(unmarkBtn);
            taskActions.appendChild(deleteBtn);

            taskItem.appendChild(taskDetails);
            taskItem.appendChild(taskActions);

            completedTasksList.appendChild(taskItem);
        });
    };


    // --- Initialization and Event Listeners ---

    // Listen for hash changes (when user clicks navigation links)
    window.addEventListener('hashchange', handleRouting);
    
    // Listen for Add Task button click
    addTaskBtn.addEventListener('click', addTask);

    // Initial load sequence
    loadTasks();
    
    // Set initial route (will default to #dashboard if no hash is present)
    handleRouting();
});