<template>
  <div class="app">
    <!-- Show login component if user is not authenticated -->
    <Login v-if="!user" @authenticated="handleAuthentication" />
    
    <!-- Show main app with sidebar if user is authenticated -->
    <div v-else class="min-h-screen bg-background">
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" as-child>
                  <div class="flex items-center gap-2">
                    <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div class="flex flex-col gap-0.5 leading-none">
                      <span class="font-semibold">TickWiser</span>
                      <span class="text-xs text-muted-foreground">Time Management</span>
                    </div>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel></SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    :is-active="currentView === 'tasks'"
                    @click="currentView = 'tasks'"
                  >
                    <CheckSquare class="h-4 w-4" />
                    <span>Tasks</span>
                    <SidebarMenuBadge>{{ incompleteTasks.length }}</SidebarMenuBadge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    :is-active="currentView === 'completed'"
                    @click="currentView = 'completed'"
                  >
                    <CheckCircle class="h-4 w-4" />
                    <span>Completed</span>
                    <SidebarMenuBadge>{{ completedTasks.length }}</SidebarMenuBadge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    :is-active="currentView === 'overdue'"
                    @click="currentView = 'overdue'"
                  >
                    <AlertTriangle class="h-4 w-4" />
                    <span>Overdue</span>
                    <SidebarMenuBadge v-if="overdueTasks.length > 0" variant="destructive">
                      {{ overdueTasks.length }}
                    </SidebarMenuBadge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <SidebarMenuButton>
                      <Avatar class="h-6 w-6">
                        <AvatarImage :src="user.photoURL" :alt="user.displayName || user.email" />
                        <AvatarFallback>
                          {{ getInitials(user.displayName || user.email) }}
                        </AvatarFallback>
                      </Avatar>
                      <span class="truncate">{{ user.displayName || user.email }}</span>
                      <ChevronUp class="ml-auto h-4 w-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" class="w-[--radix-popper-anchor-width]">
                    <DropdownMenuItem @click="handleLogout">
                      <LogOut class="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        
        <SidebarInset>
          <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger class="-ml-1" />
            <Separator orientation="vertical" class="mr-2 h-4" />
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2 text-sm font-mono bg-muted px-3 py-1 rounded-md">
                <Clock class="h-4 w-4 text-muted-foreground" />
                <span class="text-muted-foreground">{{ countdown.days }}d</span>
                <span class="text-muted-foreground">{{ countdown.hours }}h</span>
                <span class="text-muted-foreground">{{ countdown.minutes }}m</span>
                <span class="text-xs text-muted-foreground/70">to {{ new Date().getFullYear() + 1 }}</span>
              </div>
              <h1 class="text-2xl font-bold tracking-tight hidden sm:block">Make this time count!</h1>
            </div>
          </header>
          
          <div class="flex flex-1 flex-col gap-4 p-4">
            <!-- Loading Overlay -->
            <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div class="bg-background rounded-lg p-6 flex items-center gap-3">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span class="text-foreground font-medium">Processing...</span>
              </div>
            </div>
            
            <!-- Main Content -->
            <TasksPage 
              :tasks="getCurrentTasks()"
              :loading="loading"
              @task-created="handleTaskCreated"
              @task-created-confirmed="handleTaskCreatedConfirmed"
              @task-creation-failed="handleTaskCreationFailed"
              @task-updated="handleTaskUpdated"
              @task-updated-confirmed="handleTaskUpdatedConfirmed"
              @task-update-failed="handleTaskUpdateFailed"
              @task-deleted="fetchTasks"
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import api from './services/api';
import Login from './components/Login.vue';
import TasksPage from './components/TasksPage.vue';
import { onAuthStateChange, logout } from './services/firebase';

// Sidebar components
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

// Other UI components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

// Breadcrumb components (we'll need to add these)
const Breadcrumb = { template: '<nav class="flex" v-bind="$attrs"><slot /></nav>' };
const BreadcrumbList = { template: '<ol class="flex items-center gap-1.5" v-bind="$attrs"><slot /></ol>' };
const BreadcrumbItem = { template: '<li class="inline-flex items-center gap-1.5" v-bind="$attrs"><slot /></li>' };
const BreadcrumbPage = { template: '<span class="font-normal text-foreground" v-bind="$attrs"><slot /></span>' };

// Icons
import { 
  CheckSquare, 
  CheckCircle, 
  AlertTriangle, 
  ChevronUp, 
  LogOut,
  Clock
} from 'lucide-vue-next';

const tasks = ref([]);
const user = ref(null);
const loading = ref(false);
const currentView = ref('tasks');

// Countdown timer
const countdown = ref({
  days: 0,
  hours: 0,
  minutes: 0
});

let countdownInterval = null;

// Computed properties for different task views
const incompleteTasks = computed(() => {
  return tasks.value.filter(task => !task.status);
});

const completedTasks = computed(() => {
  return tasks.value.filter(task => task.status);
});

const overdueTasks = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of today
  
  return tasks.value.filter(task => {
    if (task.status) return false; // Skip completed tasks
    
    const taskDate = new Date(task.date);
    taskDate.setHours(0, 0, 0, 0); // Set to start of task date
    
    // Task is overdue if its date is before today
    return taskDate < today;
  });
});

const getCurrentTasks = () => {
  switch (currentView.value) {
    case 'completed':
      return completedTasks.value;
    case 'overdue':
      return overdueTasks.value;
    case 'tasks':
    default:
      return incompleteTasks.value;
  }
};

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

// Handle optimistic task creation
const handleTaskCreated = (optimisticTask) => {
  // Add the optimistic task immediately to the UI
  tasks.value = [...tasks.value, optimisticTask];
};

// Handle successful task creation confirmation
const handleTaskCreatedConfirmed = ({ tempId, realTask }) => {
  // Replace the optimistic task with the real one from server
  tasks.value = tasks.value.map(task => 
    task.id === tempId ? realTask : task
  );
};

// Handle failed task creation
const handleTaskCreationFailed = (tempId) => {
  // Remove the optimistic task that failed
  tasks.value = tasks.value.filter(task => task.id !== tempId);
};

// Handle optimistic task update
const handleTaskUpdated = (eventData) => {
  if (eventData && eventData.taskId && eventData.optimisticTask) {
    // Handle optimistic update
    const taskIndex = tasks.value.findIndex(task => task.id === eventData.taskId);
    if (taskIndex !== -1) {
      tasks.value[taskIndex] = eventData.optimisticTask;
    }
  } else {
    // Fallback to full refresh for legacy calls
    fetchTasks();
  }
};

// Handle successful task update confirmation
const handleTaskUpdatedConfirmed = (eventData) => {
  // Replace optimistic task with real server data
  const taskIndex = tasks.value.findIndex(task => task.id === eventData.taskId);
  if (taskIndex !== -1) {
    tasks.value[taskIndex] = eventData.realTask;
  }
};

// Handle failed task update
const handleTaskUpdateFailed = (eventData) => {
  // Revert to original task data
  const taskIndex = tasks.value.findIndex(task => task.id === eventData.taskId);
  if (taskIndex !== -1) {
    tasks.value[taskIndex] = eventData.originalTask;
  }
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

const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const updateCountdown = () => {
  const now = new Date();
  const nextYear = new Date(now.getFullYear() + 1, 0, 1); // January 1st of next year
  const timeDiff = nextYear - now;
  
  if (timeDiff > 0) {
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    countdown.value = { days, hours, minutes };
  } else {
    countdown.value = { days: 0, hours: 0, minutes: 0 };
  }
};

const startCountdown = () => {
  updateCountdown(); // Initial update
  countdownInterval = setInterval(updateCountdown, 60000); // Update every minute
};

const stopCountdown = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
};

onMounted(() => {
  // Start countdown timer
  startCountdown();
  
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

onUnmounted(() => {
  // Clean up countdown timer
  stopCountdown();
});
</script>


