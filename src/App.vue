<template>
  <div class="app">
    <!-- Show login component if user is not authenticated -->
    <Login v-if="!user" @authenticated="handleAuthentication" />
    
    <!-- Show todo app if user is authenticated -->
    <div v-else class="todo-container">
      <header class="app-header">
        <h1>Todo App</h1>
        <div class="user-info">
          <span>Welcome, {{ user.displayName || user.email }}!</span>
          <button @click="handleLogout" class="logout-button">Logout</button>
        </div>
      </header>

      <form @submit.prevent="createTask" class="task-form">
        <input v-model="newTask.title" placeholder="Task title" required class="task-input" />
        <input v-model="newTask.date" type="date" required class="task-input" />
        <button class="add-button">Add Task</button>
      </form>

      <ul class="task-list">
        <li v-for="task in incompleteTasks" :key="task.id" class="task-item">
          <input type="checkbox" v-model="task.status" @change="toggleStatus(task)" class="task-checkbox" />
          <span class="task-content">{{ task.title }} - {{ task.date }}</span>
          <button @click="deleteTask(task.id)" class="delete-button">Delete</button>
        </li>
      </ul>
      
      <div v-if="incompleteTasks.length === 0" class="empty-state">
        <p>🎉 All tasks completed! Add a new task to get started.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from './services/api';
import Login from './components/Login.vue';
import { onAuthStateChange, logout } from './services/firebase';

const tasks = ref([]);
const user = ref(null);
const newTask = ref({ 
  title: '', 
  date: new Date().toISOString().split('T')[0], 
  status: false 
});

// Filter to show only incomplete tasks (status: 0 or false)
const incompleteTasks = computed(() => {
  return tasks.value.filter(task => !task.status);
});

const fetchTasks = async () => {
  const res = await api.get('/tasks');
  tasks.value = res.data;
};

const createTask = async () => {
  await api.post('/tasks', newTask.value);
  newTask.value = { 
    title: '', 
    date: new Date().toISOString().split('T')[0], 
    status: false 
  };
  fetchTasks();
};

const toggleStatus = async (task) => {
  
  await api.put(`/tasks/${task.id}`, {
    status: task.status,
  });
  
  if (task.status) {
    playDingSound();
    fetchTasks();
  }
};

const deleteTask = async (id) => {
  await api.delete(`/tasks/${id}`);
  fetchTasks();
};

const playDingSound = () => {
  // Create a simple ding sound using Web Audio API
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
};

const handleAuthentication = (authenticatedUser) => {
  user.value = authenticatedUser;
  fetchTasks();
};

const handleLogout = async () => {
  try {
    await logout();
    user.value = null;
    tasks.value = [];
  } catch (error) {
    console.error('Logout error:', error);
  }
};

onMounted(() => {
  // Listen for authentication state changes
  onAuthStateChange((authUser) => {
    user.value = authUser;
    if (authUser) {
      fetchTasks();
    } else {
      tasks.value = [];
    }
  });
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f5f7fa;
  color: #333;
}

.app {
  min-height: 100vh;
}

.todo-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  color: #667eea;
  font-size: 2rem;
  font-weight: 700;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info span {
  color: #666;
  font-weight: 500;
}

.logout-button {
  padding: 8px 16px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.logout-button:hover {
  background: #ff5252;
}

.task-form {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.task-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.task-input:focus {
  outline: none;
  border-color: #667eea;
}

.add-button {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  white-space: nowrap;
}

.add-button:hover {
  background: #5a6fd8;
}

.task-list {
  list-style: none;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.task-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.3s;
}

.task-item:last-child {
  border-bottom: none;
}

.task-item:hover {
  background: #f8f9fa;
}

.task-checkbox {
  margin-right: 1rem;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.task-content {
  flex: 1;
  font-size: 16px;
  color: #333;
}

.delete-button {
  padding: 6px 12px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.delete-button:hover {
  background: #ff5252;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.empty-state p {
  font-size: 18px;
  color: #666;
}

@media (max-width: 768px) {
  .todo-container {
    padding: 1rem;
  }
  
  .app-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .task-form {
    flex-direction: column;
  }
  
  .task-item {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
}
</style>
