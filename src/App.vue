<template>
  <div class="app">
    <h1>ToDo App</h1>

    <form @submit.prevent="createTask">
      <input v-model="newTask.title" placeholder="Task title" required />
      <input v-model="newTask.date" type="date" required />
      <button>Add Task</button>
    </form>

    <ul>
      <li v-for="task in tasks" :key="task.id">
        <input type="checkbox" v-model="task.status" @change="toggleStatus(task)" />
        {{ task.title }} - {{ task.date }}
        <button @click="deleteTask(task.id)">Delete</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from './services/api';

const tasks = ref([]);
const newTask = ref({ title: '', date: '', status: false });

const fetchTasks = async () => {
  const res = await api.get('/tasks');
  tasks.value = res.data;
};

const createTask = async () => {
  await api.post('/tasks', newTask.value);
  newTask.value = { title: '', date: '', status: false };
  fetchTasks();
};

const toggleStatus = async (task) => {
  await api.put(`/tasks/${task.id}`, {
    status: task.status,
  });
};

const deleteTask = async (id) => {
  await api.delete(`/tasks/${id}`);
  fetchTasks();
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
