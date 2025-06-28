<template>
  <div v-if="isOpen" class="fixed inset-y-0 right-0 z-50 w-96 bg-background border-l shadow-lg overflow-hidden flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b bg-muted/50">
      <div class="flex items-center gap-2">
        <FolderOpen class="h-5 w-5 text-primary" />
        <div>
          <h2 class="text-lg font-semibold">{{ project?.name || 'Project' }}</h2>
          <p class="text-sm text-muted-foreground">{{ tasks.length }} task{{ tasks.length !== 1 ? 's' : '' }}</p>
        </div>
      </div>
      <Button variant="ghost" size="sm" @click="closePanel" class="h-8 w-8 p-0">
        <X class="h-4 w-4" />
      </Button>
    </div>

    <!-- Add Task Button -->
    <div class="p-4 border-b">
      <Button @click="toggleAddTaskForm" class="w-full" size="sm">
        <Plus class="mr-2 h-4 w-4" />
        Add Task to Project
      </Button>
    </div>

    <!-- Add Task Form -->
    <div v-if="showAddTaskForm" class="p-4 border-b bg-muted/30">
      <form @submit.prevent="createTask" class="space-y-3">
        <div>
          <Input
            v-model="newTask.title"
            placeholder="Enter task title..."
            required
            :disabled="loading"
            ref="newTaskTitleInput"
            class="text-sm"
          />
        </div>
        
        <div class="flex gap-2">
          <Input
            v-model="newTask.date"
            type="date"
            required
            :disabled="loading"
            class="flex-1 text-sm"
          />
          <Input
            v-model.number="newTask.priority"
            type="number"
            min="1"
            max="10"
            placeholder="Priority"
            :disabled="loading"
            class="w-20 text-sm"
          />
        </div>
        
        <div class="flex gap-2 justify-end">
          <Button type="button" variant="outline" size="sm" @click="showAddTaskForm = false">
            Cancel
          </Button>
          <Button type="submit" size="sm" :disabled="loading || !newTask.title.trim()">
            <div v-if="loading" class="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
            Add
          </Button>
        </div>
      </form>
    </div>

    <!-- Tasks List -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="loading && tasks.length === 0" class="flex items-center justify-center py-8">
        <div class="flex items-center gap-2">
          <div class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span class="text-sm text-muted-foreground">Loading tasks...</span>
        </div>
      </div>
      
      <div v-else-if="tasks.length === 0" class="text-center py-8">
        <div class="text-3xl mb-4">📝</div>
        <h3 class="text-sm font-medium mb-2">No tasks in this project</h3>
        <p class="text-xs text-muted-foreground mb-4">
          Add your first task to get started
        </p>
        <Button size="sm" @click="toggleAddTaskForm">
          <Plus class="mr-2 h-3 w-3" />
          Add Task
        </Button>
      </div>

      <div v-else class="divide-y">
        <div 
          v-for="task in tasks" 
          :key="task.id" 
          class="p-3 hover:bg-muted/50 transition-colors"
        >
          <div class="flex items-start gap-3">
            <!-- Checkbox -->
            <Checkbox
              :checked="task.status"
              @update:checked="toggleStatus(task)"
              :disabled="loading"
              class="mt-1"
            />
            
            <!-- Task Content -->
            <div class="flex-1 min-w-0">
              <!-- Task Title -->
              <div v-if="editingTask === task.id" class="flex items-center gap-2 mb-2">
                <Input
                  v-model="editForm.title"
                  class="h-7 text-xs flex-1"
                  @keyup.enter="saveEdit(task.id)"
                  @keyup.escape="cancelEdit"
                  ref="editTitleInput"
                  @blur="handleEditInputBlur"
                  @focus="handleEditInputFocus"
                  autofocus
                />
                <Button size="sm" variant="ghost" @click="saveEdit(task.id)" class="h-6 w-6 p-0">
                  <Check class="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" @click="cancelEdit" class="h-6 w-6 p-0">
                  <X class="h-3 w-3" />
                </Button>
              </div>
              <div v-else>
                <!-- Title -->
                <div class="flex items-center gap-2 mb-1">
                  <span 
                    :class="{ 'line-through text-muted-foreground': task.status }" 
                    class="text-sm font-medium cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded flex-1"
                    @click="startEdit(task)"
                    :title="task.title"
                  >
                    {{ task.title }}
                    <span v-if="task._isOptimistic" class="ml-2 text-xs text-muted-foreground">(saving...)</span>
                  </span>
                  <div class="flex items-center gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      class="h-5 w-5 p-0 hover:bg-muted/50"
                      @click="openComments(task)"
                      :title="task.comments && task.comments.length > 0 ? `${task.comments.length} comment${task.comments.length > 1 ? 's' : ''}` : 'Add comment'"
                    >
                      <MessageSquare class="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </Button>
                    <Badge 
                      v-if="task.comments && task.comments.length > 0" 
                      variant="secondary" 
                      class="h-3 text-xs px-1 min-w-[12px] flex items-center justify-center"
                    >
                      {{ task.comments.length }}
                    </Badge>
                  </div>
                </div>
                
                <!-- Date, Priority, Actions -->
                <div class="flex items-center justify-between text-xs text-muted-foreground">
                  <div class="flex items-center gap-2">
                    <div v-if="editingTask === task.id" class="flex items-center gap-1">
                      <Input
                        v-model="editForm.date"
                        type="date"
                        class="h-5 text-xs w-24"
                        @keyup.enter="saveEdit(task.id)"
                        @keyup.escape="cancelEdit"
                      />
                    </div>
                    <div v-else class="flex items-center gap-1 cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded" @click="startEdit(task)">
                      <Calendar class="h-3 w-3" />
                      <span class="text-xs">{{ formatDate(task.date) }}</span>
                    </div>
                    
                    <div v-if="editingTask === task.id" class="flex items-center gap-1">
                      <Input
                        v-model.number="editForm.priority"
                        type="number"
                        min="1"
                        max="10"
                        class="h-5 text-xs w-10"
                        @keyup.enter="saveEdit(task.id)"
                        @keyup.escape="cancelEdit"
                      />
                    </div>
                    <div v-else class="cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded" @click="startEdit(task)">
                      <Badge :variant="getPriorityVariant(task.priority)" class="text-xs h-4">
                        P{{ task.priority || 5 }}
                      </Badge>
                    </div>
                  </div>
                  
                  <!-- Actions -->
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="sm" class="h-5 w-5 p-0">
                        <MoreHorizontal class="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem @click="startEdit(task)">
                        <Edit class="mr-2 h-3 w-3" />
                        Edit Task
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem @click="openComments(task)">
                        <MessageSquare class="mr-2 h-3 w-3" />
                        Comments
                        <Badge v-if="task.comments && task.comments.length > 0" variant="secondary" class="ml-2 text-xs">
                          {{ task.comments.length }}
                        </Badge>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem @click="removeFromProject(task)">
                        <FolderMinus class="mr-2 h-3 w-3" />
                        Remove from Project
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem @click="toggleStatus(task)">
                        <Check class="mr-2 h-3 w-3" />
                        {{ task.status ? 'Mark Incomplete' : 'Mark Complete' }}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem @click="deleteTask(task)" class="text-destructive">
                        <Trash2 class="mr-2 h-3 w-3" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Comments Dialog -->
    <TaskComments 
      :task="selectedTask" 
      :open="showComments" 
      @update:open="showComments = $event"
      @comments-updated="handleCommentsUpdated"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import api from '../services/api'
import TaskComments from './TaskComments.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  X,
  Calendar, 
  MoreHorizontal, 
  Check, 
  Trash2,
  Edit,
  MessageSquare,
  FolderOpen,
  FolderMinus
} from 'lucide-vue-next'

const props = defineProps({
  project: {
    type: Object,
    default: null
  },
  open: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:open', 'task-updated', 'task-deleted', 'task-created'])

const isOpen = ref(props.open)
const tasks = ref([])
const loading = ref(false)
const showAddTaskForm = ref(false)
const editingTask = ref(null)
const editTitleInput = ref(null)
const newTaskTitleInput = ref(null)
const showComments = ref(false)
const selectedTask = ref(null)

const newTask = ref({
  title: '',
  date: new Date().toISOString().split('T')[0],
  status: false,
  priority: 5
})

const editForm = ref({
  title: '',
  date: '',
  priority: 5
})

// Watch for prop changes
watch(() => props.open, (newValue) => {
  isOpen.value = newValue
  if (newValue && props.project) {
    fetchProjectTasks()
  }
})

watch(() => props.project, (newProject) => {
  if (newProject && isOpen.value) {
    fetchProjectTasks()
  }
})

const closePanel = () => {
  isOpen.value = false
  emit('update:open', false)
}

const fetchProjectTasks = async () => {
  if (!props.project) return
  
  try {
    loading.value = true
    const response = await api.get(`/tasks?project_id=${props.project.id}`)
    tasks.value = response.data.filter(task => task.project_id === props.project.id)
  } catch (error) {
    console.error('Error fetching project tasks:', error)
  } finally {
    loading.value = false
  }
}

const toggleAddTaskForm = () => {
  showAddTaskForm.value = !showAddTaskForm.value
  if (showAddTaskForm.value) {
    newTask.value = {
      title: '',
      date: new Date().toISOString().split('T')[0],
      status: false,
      priority: 5
    }
    nextTick(() => {
      if (newTaskTitleInput.value) {
        newTaskTitleInput.value.focus()
      }
    })
  }
}

const createTask = async () => {
  if (!newTask.value.title.trim() || loading.value) return

  try {
    loading.value = true
    
    const response = await api.post('/tasks', {
      title: newTask.value.title.trim(),
      date: newTask.value.date,
      priority: newTask.value.priority,
      project_id: props.project.id
    })

    tasks.value.unshift(response.data)
    emit('task-created', response.data)
    
    // Reset form
    newTask.value = {
      title: '',
      date: new Date().toISOString().split('T')[0],
      status: false,
      priority: 5
    }
    showAddTaskForm.value = false
    
  } catch (error) {
    console.error('Error creating task:', error)
    alert('Failed to create task')
  } finally {
    loading.value = false
  }
}

const toggleStatus = async (task) => {
  if (loading.value) return

  const originalStatus = task.status
  task.status = !task.status

  try {
    const response = await api.put(`/tasks/${task.id}`, {
      status: task.status
    })
    
    Object.assign(task, response.data)
    emit('task-updated', task)
  } catch (error) {
    task.status = originalStatus
    console.error('Error updating task status:', error)
  }
}

const startEdit = (task) => {
  editingTask.value = task.id
  editForm.value = {
    title: task.title,
    date: task.date,
    priority: task.priority || 5
  }
  
  nextTick(() => {
    if (editTitleInput.value) {
      editTitleInput.value.focus()
    }
  })
}

const cancelEdit = () => {
  editingTask.value = null
  editForm.value = { title: '', date: '', priority: 5 }
}

const saveEdit = async (taskId) => {
  if (loading.value) return

  const task = tasks.value.find(t => t.id === taskId)
  if (!task) return

  const originalTask = { ...task }

  try {
    Object.assign(task, editForm.value)
    
    const response = await api.put(`/tasks/${taskId}`, editForm.value)
    Object.assign(task, response.data)
    emit('task-updated', task)
    
    editingTask.value = null
  } catch (error) {
    Object.assign(task, originalTask)
    console.error('Error updating task:', error)
  }
}

const removeFromProject = async (task) => {
  if (loading.value) return

  try {
    const response = await api.put(`/tasks/${task.id}`, {
      project_id: null
    })
    
    // Remove task from this project view
    tasks.value = tasks.value.filter(t => t.id !== task.id)
    emit('task-updated', response.data)
    
  } catch (error) {
    console.error('Error removing task from project:', error)
  }
}

const deleteTask = async (task) => {
  if (!confirm('Are you sure you want to delete this task?')) return
  if (loading.value) return

  try {
    await api.delete(`/tasks/${task.id}`)
    tasks.value = tasks.value.filter(t => t.id !== task.id)
    emit('task-deleted', task)
  } catch (error) {
    console.error('Error deleting task:', error)
  }
}

const openComments = (task) => {
  selectedTask.value = task
  showComments.value = true
}

const handleCommentsUpdated = (updatedTask) => {
  const taskIndex = tasks.value.findIndex(t => t.id === updatedTask.id)
  if (taskIndex !== -1) {
    tasks.value[taskIndex] = updatedTask
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })
}

const getPriorityVariant = (priority) => {
  if (priority >= 8) return 'destructive'
  if (priority >= 6) return 'default'
  return 'secondary'
}

const handleEditInputBlur = () => {
  // Handle blur if needed
}

const handleEditInputFocus = () => {
  // Handle focus if needed
}
</script> 