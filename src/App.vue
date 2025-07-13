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
                    <div
                      class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
                    >
                      <svg
                        class="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        />
                      </svg>
                    </div>
                    <div class="flex flex-col gap-0.5 leading-none">
                      <span class="font-semibold">TickWiser</span>
                      <span class="text-xs text-muted-foreground"
                        >Time Management</span
                      >
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
                <template
                  v-for="(sideMenu, index) in sideBarMenus"
                  :key="index"
                >
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      :is-active="currentView === sideMenu.key"
                      @click="currentView = sideMenu.key"
                    >
                      <component :is="sideMenu.icon" class="h-4 w-4" />
                      <span>{{ sideMenu.label }}</span>
                      <SidebarMenuBadge>{{ sideMenu.total }}</SidebarMenuBadge>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </template>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>
                <div class="flex items-center justify-between w-full">
                  <h2
                    class="text-lg font-semibold cursor-pointer hover:text-primary transition-colors"
                    @click="openProjectsManagement"
                    title="Manage all projects"
                  >
                    Projects
                  </h2>
                  <SidebarMenuButton
                    size="sm"
                    class="h-6 w-6 p-0 hover:bg-muted/50 ml-2"
                    @click="handleAddProject"
                    title="Add Project"
                  >
                    <Plus class="h-3 w-3" />
                  </SidebarMenuButton>
                </div>
              </SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem
                  v-for="project in activeProjects"
                  :key="project.id"
                >
                  <SidebarMenuButton
                    :is-active="
                      currentView === 'project' &&
                      selectedProject?.id === project.id
                    "
                    @click="openProjectTasks(project)"
                  >
                    <FolderOpen class="h-4 w-4" />
                    <span>{{ project.name }}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem v-if="activeProjects.length === 0">
                  <div class="px-2 py-1 text-sm text-muted-foreground">
                    No active projects
                  </div>
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
                        <AvatarImage
                          :src="user.photoURL"
                          :alt="user.displayName || user.email"
                        />
                        <AvatarFallback>
                          {{ getInitials(user.displayName || user.email) }}
                        </AvatarFallback>
                      </Avatar>
                      <span class="truncate">{{
                        user.displayName || user.email
                      }}</span>
                      <ChevronUp class="ml-auto h-4 w-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="top"
                    class="w-[--radix-popper-anchor-width]"
                  >
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
              <div
                class="flex items-center gap-2 text-sm font-mono bg-muted px-3 py-1 rounded-md"
              >
                <Clock class="h-4 w-4 text-muted-foreground" />
                <span class="text-muted-foreground">{{ countdown.days }}d</span>
                <span class="text-muted-foreground"
                  >{{ countdown.hours }}h</span
                >
                <span class="text-muted-foreground"
                  >{{ countdown.minutes }}m</span
                >
                <span class="text-xs text-muted-foreground/70"
                  >to {{ new Date().getFullYear() + 1 }}</span
                >
              </div>
              <h1 class="text-2xl font-bold tracking-tight hidden sm:block">
                Make this time count!
              </h1>
            </div>
          </header>

          <div class="flex flex-1 flex-col gap-4 p-4">
            <!-- Loading Overlay -->
            <div
              v-if="loading"
              class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <div class="bg-background rounded-lg p-6 flex items-center gap-3">
                <div
                  class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"
                ></div>
                <span class="text-foreground font-medium">Processing...</span>
              </div>
            </div>

            <!-- Main Content -->
            <TasksPage
              v-if="currentView !== 'projects-management'"
              :tasks="getCurrentTasks()"
              :projects="projects"
              :loading="loading"
              :current-view="currentView"
              :selected-project="selectedProject"
              @task-created="handleTaskCreated"
              @task-created-confirmed="handleTaskCreatedConfirmed"
              @task-creation-failed="handleTaskCreationFailed"
              @task-updated="handleTaskUpdated"
              @task-updated-confirmed="handleTaskUpdatedConfirmed"
              @task-update-failed="handleTaskUpdateFailed"
              @task-deleted="handleTaskDeleted"
              @task-deleted-confirmed="handleTaskDeletedConfirmed"
              @task-deletion-failed="handleTaskDeletionFailed"
              @back-to-tasks="
                currentView = 'tasks';
                selectedProject = null;
              "
              @project-status-updated="handleProjectStatusUpdated"
            />

            <ProjectsManagement
              v-if="currentView === 'projects-management'"
              :projects="projects"
              :tasks="tasks"
              :loading="loading"
              @project-status-updated="handleProjectStatusUpdated"
              @add-project="handleAddProject"
              @view-project="openProjectTasks"
            />
          </div>
        </SidebarInset>
      </SidebarProvider>

      <!-- Add Project Modal -->
      <AddProjectModal
        :open="showAddProjectModal"
        @update:open="showAddProjectModal = $event"
        @project-created="handleProjectCreated"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue";
import api from "./services/api";
import Login from "./components/Login.vue";
import TasksPage from "./components/TasksPage.vue";
import AddProjectModal from "./components/AddProjectModal.vue";
import ProjectsManagement from "./components/ProjectsManagement.vue";
import { onAuthStateChange, logout } from "./services/firebase";

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
} from "@/components/ui/sidebar";

// Other UI components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// Breadcrumb components (we'll need to add these)
const Breadcrumb = {
  template: '<nav class="flex" v-bind="$attrs"><slot /></nav>',
};
const BreadcrumbList = {
  template:
    '<ol class="flex items-center gap-1.5" v-bind="$attrs"><slot /></ol>',
};
const BreadcrumbItem = {
  template:
    '<li class="inline-flex items-center gap-1.5" v-bind="$attrs"><slot /></li>',
};
const BreadcrumbPage = {
  template:
    '<span class="font-normal text-foreground" v-bind="$attrs"><slot /></span>',
};

// Icons
import {
  CheckSquare,
  CheckCircle,
  AlertTriangle,
  ChevronUp,
  LogOut,
  Clock,
  Plus,
  FolderOpen,
} from "lucide-vue-next";
import Label from "./components/ui/label/Label.vue";

const tasks = ref([]);
const projects = ref([]);
const user = ref(null);
const loading = ref(false);
const currentView = ref("tasks");
const showAddProjectModal = ref(false);
const selectedProject = ref(null);
const sideBarMenus = ref([
  {
    label: "Tasks",
    key: "tasks",
    icon: CheckSquare,
    total: computed(() => incompleteTasks.value.length),
  },
  {
    label: "Completed",
    key: "completed",
    icon: CheckCircle,
    total: computed(() => completedTasks.value.length),
  },
  {
    label: "Overdue",
    key: "overdue",
    icon: AlertTriangle,
    total: computed(() => overdueTasks.value.length),
    variant: "destructive",
  },
]);

// Countdown timer
const countdown = ref({
  days: 0,
  hours: 0,
  minutes: 0,
});

let countdownInterval = null;

// Helper function to check if a task belongs to an active project
const isTaskFromActiveProject = (task) => {
  // If task has no project_id, it's a general task and should be shown
  if (!task.project_id) return true;

  // Find the project and check if it's active
  const project = projects.value.find((p) => p.id === task.project_id);
  return project ? project.status === "active" : false;
};

// Computed property for active projects only
const activeProjects = computed(() => {
  return projects.value.filter((project) => project.status === "active");
});

// Computed properties for different task views
const incompleteTasks = computed(() => {
  return tasks.value.filter(
    (task) => !task.status && isTaskFromActiveProject(task)
  );
});

const completedTasks = computed(() => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  return tasks.value.filter((task) => {
    if (!task.status || !isTaskFromActiveProject(task)) return false;

    // Check if task was completed in the past 7 days
    const taskDate = new Date(task.date);
    taskDate.setHours(0, 0, 0, 0);

    return taskDate >= sevenDaysAgo;
  });
});

const overdueTasks = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of today

  return tasks.value.filter((task) => {
    if (task.status) return false; // Skip completed tasks
    if (!isTaskFromActiveProject(task)) return false; // Skip tasks from inactive projects

    const taskDate = new Date(task.date);
    taskDate.setHours(0, 0, 0, 0); // Set to start of task date

    // Task is overdue if its date is before today
    return taskDate < today;
  });
});

const projectTasks = computed(() => {
  if (!selectedProject.value) return [];
  return tasks.value.filter(
    (task) => task.project_id === selectedProject.value.id
  );
});

const getCurrentTasks = () => {
  switch (currentView.value) {
    case "completed":
      return completedTasks.value;
    case "overdue":
      return overdueTasks.value;
    case "project":
      return projectTasks.value;
    case "projects-management":
      return []; // No tasks needed for projects management view
    case "tasks":
    default:
      return incompleteTasks.value;
  }
};

const fetchTasks = async () => {
  try {
    loading.value = true;
    const res = await api.get("/tasks");
    tasks.value = res.data;
  } catch (error) {
    console.error("Error fetching tasks:", error);
  } finally {
    loading.value = false;
  }
};

const fetchProjects = async () => {
  try {
    const res = await api.get("/projects");
    projects.value = res.data;
  } catch (error) {
    console.error("Error fetching projects:", error);
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
  tasks.value = tasks.value.map((task) =>
    task.id === tempId ? realTask : task
  );
};

// Handle failed task creation
const handleTaskCreationFailed = (tempId) => {
  // Remove the optimistic task that failed
  tasks.value = tasks.value.filter((task) => task.id !== tempId);
};

// Handle optimistic task update
const handleTaskUpdated = (eventData) => {
  if (eventData && eventData.taskId && eventData.optimisticTask) {
    // Handle optimistic update
    const taskIndex = tasks.value.findIndex(
      (task) => task.id === eventData.taskId
    );
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
  const taskIndex = tasks.value.findIndex(
    (task) => task.id === eventData.taskId
  );
  if (taskIndex !== -1) {
    tasks.value[taskIndex] = eventData.realTask;
  }
};

// Handle failed task update
const handleTaskUpdateFailed = (eventData) => {
  // Revert to original task data
  const taskIndex = tasks.value.findIndex(
    (task) => task.id === eventData.taskId
  );
  if (taskIndex !== -1) {
    tasks.value[taskIndex] = eventData.originalTask;
  }
};

// Handle optimistic task deletion
const handleTaskDeleted = (eventData) => {
  // Remove the task immediately from the UI
  tasks.value = tasks.value.filter((task) => task.id !== eventData.taskId);
};

// Handle successful task deletion confirmation
const handleTaskDeletedConfirmed = (eventData) => {
  // Task is already removed from UI, no additional action needed
  console.log(`Task ${eventData.taskId} successfully deleted`);
};

// Handle failed task deletion
const handleTaskDeletionFailed = (eventData) => {
  // Restore the task that failed to delete
  tasks.value = [...tasks.value, eventData.originalTask];
};

const handleAuthentication = (authenticatedUser) => {
  user.value = authenticatedUser;
  fetchTasks();
  fetchProjects();
};

const handleLogout = async () => {
  try {
    await logout();
    user.value = null;
    tasks.value = [];
    projects.value = [];
  } catch (error) {
    console.error("Logout error:", error);
  }
};

const handleAddProject = () => {
  showAddProjectModal.value = true;
};

const handleProjectCreated = (newProject) => {
  projects.value.unshift(newProject);
  console.log("Project created:", newProject);
};

const openProjectTasks = (project) => {
  selectedProject.value = project;
  currentView.value = "project";
};

const openProjectsManagement = () => {
  currentView.value = "projects-management";
  selectedProject.value = null;
};

const handleProjectStatusUpdated = async (
  projectIdOrProject,
  newStatus = null
) => {
  try {
    let updatedProject;

    if (typeof projectIdOrProject === "object") {
      // Called from TasksPage with full project object
      updatedProject = projectIdOrProject;
    } else {
      // Called from ProjectsManagement with projectId and newStatus
      loading.value = true;
      const response = await api.put(`/projects/${projectIdOrProject}`, {
        status: newStatus,
      });
      updatedProject = response.data;
    }

    // Update the project in the projects list
    const projectIndex = projects.value.findIndex(
      (p) => p.id === updatedProject.id
    );
    if (projectIndex !== -1) {
      projects.value[projectIndex] = updatedProject;
    }

    // Update the selected project if it's the same one
    if (
      selectedProject.value &&
      selectedProject.value.id === updatedProject.id
    ) {
      selectedProject.value = updatedProject;
    }
  } catch (error) {
    console.error("Error updating project status:", error);
  } finally {
    loading.value = false;
  }
};

const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const updateCountdown = () => {
  const now = new Date();
  const nextYear = new Date(now.getFullYear() + 1, 0, 1); // January 1st of next year
  const timeDiff = nextYear - now;

  if (timeDiff > 0) {
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
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
      fetchProjects();
    } else {
      tasks.value = [];
      projects.value = [];
    }
  });
});

onUnmounted(() => {
  // Clean up countdown timer
  stopCountdown();
});
</script>
