<template>
  <div class="app">
    <h1>ToDo App</h1>

    <form @submit.prevent="createTask">
      <input v-model="newTask.title" placeholder="Task title" required />
              <input v-model="newTask.date" type="date" required />
      <button>Add Task</button>
    </form>

    <ul>
      <li v-for="task in incompleteTasks" :key="task.id">
        <input type="checkbox" v-model="task.status" @change="toggleStatus(task)" />
        {{ task.title }} - {{ task.date }}
        <button @click="deleteTask(task.id)">Delete</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from './services/api';

const tasks = ref([]);
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

onMounted(fetchTasks);
</script>

<style>
body {
  font-family: Arial, sans-serif;
  padding: 2rem;
}
input[type="text"], input[type="date"] {
  margin-right: 10px;
}
</style>
