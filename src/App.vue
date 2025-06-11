<template>
  <div class="app">
    <!-- Show login component if user is not authenticated -->
    <Login v-if="!user" @authenticated="handleAuthentication" />
    
    <!-- Show todo app if user is authenticated -->
    <div v-else class="min-h-screen bg-gray-50 p-4">
      <!-- Loading Spinner Overlay -->
      <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 flex items-center gap-3">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span class="text-gray-700 font-medium">Processing...</span>
        </div>
      </div>

      <header class="card mx-auto max-w-4xl mb-8 p-6">
        <div class="flex justify-between items-center">
          <h1 class="text-3xl font-bold text-primary-600">Todo App</h1>
          <div class="flex items-center gap-4">
            <span class="text-gray-600 font-medium">Welcome, {{ user.displayName || user.email }}!</span>
            <button @click="handleLogout" class="btn btn-danger">Logout</button>
          </div>
        </div>
      </header>

      <div class="max-w-4xl mx-auto">
        <form @submit.prevent="createTask" class="card p-6 mb-8">
          <div class="flex gap-4">
            <input 
              v-model="newTask.title" 
              placeholder="Task title" 
              required 
              class="input flex-1"
              @keyup.enter="createTask" 
            />
            <input v-model="newTask.date" type="date" required class="input w-48" />
            <button class="btn btn-primary px-6 flex items-center gap-2" :disabled="loading || !newTask.title.trim()">
              <div v-if="loading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Add Task
            </button>
          </div>
        </form>

        <div class="card">
          <div v-if="incompleteTasks.length === 0" class="p-12 text-center">
            <div class="text-6xl mb-4">🎉</div>
            <p class="text-xl text-gray-600 font-medium">All tasks completed!</p>
            <p class="text-gray-500 mt-2">Add a new task to get started.</p>
          </div>
          
          <ul v-else class="divide-y divide-gray-200">
            <li v-for="task in incompleteTasks" :key="task.id" class="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors duration-200">
              <input 
                type="checkbox" 
                v-model="task.status" 
                @change="toggleStatus(task)" 
                :disabled="loading"
                class="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div class="flex-1">
                <span class="text-gray-900 font-medium">{{ task.title }}</span>
                <span class="text-gray-500 ml-2">{{ formatDate(task.date) }}</span>
              </div>
              <button @click="deleteTask(task.id)" class="btn btn-danger text-sm px-3 py-1 flex items-center gap-1" :disabled="loading">
                <div v-if="loading" class="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                Delete
              </button>
            </li>
          </ul>
        </div>
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
const loading = ref(false);
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
  try {
    loading.value = true;
    const res = await api.get('/tasks');
    tasks.value = res.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
  } finally {
    loading.value = false;
  }
};

const createTask = async () => {
  try {
    loading.value = true;
    await api.post('/tasks', newTask.value);
    newTask.value = { 
      title: '', 
      date: new Date().toISOString().split('T')[0], 
      status: false 
    };
    await fetchTasks();
  } catch (error) {
    console.error('Error creating task:', error);
    loading.value = false;
  }
};

const toggleStatus = async (task) => {
  try {
    loading.value = true;
    await api.put(`/tasks/${task.id}`, {
      status: task.status,
    });
    
    if (task.status) {
      playDingSound();
    }
    await fetchTasks();
  } catch (error) {
    console.error('Error updating task:', error);
    loading.value = false;
  }
};

const deleteTask = async (id) => {
  try {
    loading.value = true;
    await api.delete(`/tasks/${id}`);
    await fetchTasks();
  } catch (error) {
    console.error('Error deleting task:', error);
    loading.value = false;
  }
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

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
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


