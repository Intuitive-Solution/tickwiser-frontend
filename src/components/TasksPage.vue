<template>
  <div class="space-y-6">
    <!-- Header with Add Task and Search -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Tasks</h1>
        <p class="text-muted-foreground">Manage your todo items</p>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div class="relative flex-1 md:w-64">
          <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="Search tasks..."
            class="pl-8"
          />
        </div>
        <Button @click="showAddTaskForm = !showAddTaskForm" class="shrink-0">
          <Plus class="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>
    </div>

    <!-- Add Task Form -->
    <Card v-if="showAddTaskForm" class="border-dashed">
      <CardHeader>
        <CardTitle class="text-lg">Add New Task</CardTitle>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="createTask" class="flex gap-4">
          <div class="flex-1">
            <Input
              v-model="newTask.title"
              placeholder="Enter task title..."
              required
              :disabled="loading"
            />
          </div>
          <div class="w-40">
            <Input
              v-model="newTask.date"
              type="date"
              required
              :disabled="loading"
            />
          </div>
          <Button type="submit" :disabled="loading || !newTask.title.trim()">
            <div v-if="loading" class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
            Add
          </Button>
          <Button type="button" variant="outline" @click="showAddTaskForm = false">
            Cancel
          </Button>
        </form>
      </CardContent>
    </Card>

    <!-- Tasks Table with Tabs -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle>Your Tasks</CardTitle>
          <Badge variant="secondary">{{ filteredAndTabTasks.length }} tasks</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <!-- Time-based Tabs -->
        <Tabs v-model="activeTab" class="mb-6">
          <TabsList class="grid w-full grid-cols-5">
            <TabsTrigger value="today">
              Today
              <Badge v-if="getTasksByTab('today').length > 0" variant="secondary" class="ml-2">
                {{ getTasksByTab('today').length }}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="tomorrow">
              Tomorrow
              <Badge v-if="getTasksByTab('tomorrow').length > 0" variant="secondary" class="ml-2">
                {{ getTasksByTab('tomorrow').length }}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="week">
              This Week
              <Badge v-if="getTasksByTab('week').length > 0" variant="secondary" class="ml-2">
                {{ getTasksByTab('week').length }}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="month">
              This Month
              <Badge v-if="getTasksByTab('month').length > 0" variant="secondary" class="ml-2">
                {{ getTasksByTab('month').length }}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="year">
              This Year
              <Badge v-if="getTasksByTab('year').length > 0" variant="secondary" class="ml-2">
                {{ getTasksByTab('year').length }}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div v-if="loading && tasks.length === 0" class="flex items-center justify-center py-8">
          <div class="flex items-center gap-2">
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <span class="text-muted-foreground">Loading tasks...</span>
          </div>
        </div>
        
        <div v-else-if="filteredAndTabTasks.length === 0" class="text-center py-8">
          <div class="text-4xl mb-4">📝</div>
          <h3 class="text-lg font-medium mb-2">No tasks found</h3>
          <p class="text-muted-foreground mb-4">
            {{ searchQuery ? 'No tasks match your search.' : `No tasks for ${getTabLabel(activeTab)}.` }}
          </p>
          <Button v-if="!searchQuery" @click="showAddTaskForm = true">
            <Plus class="mr-2 h-4 w-4" />
            Add Your First Task
          </Button>
        </div>

        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead class="w-12">Status</TableHead>
              <TableHead>Task</TableHead>
              <TableHead class="w-32">Due Date</TableHead>
              <TableHead class="w-24">Priority</TableHead>
              <TableHead class="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="task in filteredAndTabTasks" :key="task.id" :class="{ 'opacity-50': task.status }">
              <TableCell>
                <Checkbox
                  :checked="task.status"
                  @update:checked="toggleStatus(task)"
                  :disabled="loading"
                />
              </TableCell>
              <TableCell>
                <div class="flex flex-col">
                  <div v-if="editingTask === task.id" class="flex items-center gap-2">
                    <Input
                      v-model="editForm.title"
                      class="h-8 text-sm"
                      @keyup.enter="saveEdit(task.id)"
                      @keyup.escape="cancelEdit"
                      ref="editTitleInput"
                    />
                    <Button size="sm" variant="ghost" @click="saveEdit(task.id)">
                      <Check class="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" @click="cancelEdit">
                      <X class="h-3 w-3" />
                    </Button>
                  </div>
                  <span 
                    v-else
                    :class="{ 'line-through text-muted-foreground': task.status }" 
                    class="font-medium cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
                    @click="startEdit(task)"
                  >
                    {{ task.title }}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div v-if="editingTask === task.id" class="flex items-center gap-2">
                  <Input
                    v-model="editForm.date"
                    type="date"
                    class="h-8 text-sm w-36"
                    @keyup.enter="saveEdit(task.id)"
                    @keyup.escape="cancelEdit"
                  />
                </div>
                <div v-else class="flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded" @click="startEdit(task)">
                  <Calendar class="h-4 w-4 text-muted-foreground" />
                  <span class="text-sm">{{ formatDate(task.date) }}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge :variant="getPriorityVariant(task.date)">
                  {{ getPriorityLabel(task.date) }}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                                          <DropdownMenuItem @click="startEdit(task)">
                        <Edit class="mr-2 h-4 w-4" />
                        Edit Task
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem @click="pushToTomorrow(task)">
                        <ArrowRight class="mr-2 h-4 w-4" />
                        Push to Tomorrow
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem @click="toggleStatus(task)">
                      <Check class="mr-2 h-4 w-4" />
                      {{ task.status ? 'Mark Incomplete' : 'Mark Complete' }}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="deleteTask(task.id)" class="text-destructive">
                      <Trash2 class="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import api from '../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  Search, 
  Calendar, 
  MoreHorizontal, 
  Check, 
  Trash2,
  Edit,
  X,
  ArrowRight
} from 'lucide-vue-next'

const props = defineProps({
  tasks: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['refresh-tasks', 'task-created', 'task-updated', 'task-deleted'])

const searchQuery = ref('')
const showAddTaskForm = ref(false)
const editingTask = ref(null)
const editTitleInput = ref(null)
const activeTab = ref('today')
const newTask = ref({
  title: '',
  date: new Date().toISOString().split('T')[0],
  status: false
})
const editForm = ref({
  title: '',
  date: ''
})

const filteredTasks = computed(() => {
  if (!searchQuery.value) return props.tasks
  
  return props.tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const filteredAndTabTasks = computed(() => {
  const searchFiltered = filteredTasks.value
  return getTasksByTab(activeTab.value, searchFiltered)
})

const createTask = async () => {
  try {
    await api.post('/tasks', newTask.value)
    newTask.value = {
      title: '',
      date: new Date().toISOString().split('T')[0],
      status: false
    }
    showAddTaskForm.value = false
    emit('task-created')
    playSuccessSound()
  } catch (error) {
    console.error('Error creating task:', error)
  }
}

const toggleStatus = async (task) => {
  try {
    const newStatus = !task.status
    await api.put(`/tasks/${task.id}`, {
      status: newStatus
    })
    
    if (newStatus) {
      playSuccessSound()
    }
    emit('task-updated')
  } catch (error) {
    console.error('Error updating task:', error)
  }
}

const deleteTask = async (id) => {
  try {
    await api.delete(`/tasks/${id}`)
    emit('task-deleted')
  } catch (error) {
    console.error('Error deleting task:', error)
  }
}

const startEdit = (task) => {
  editingTask.value = task.id
  editForm.value = {
    title: task.title,
    date: task.date
  }
  // Focus the title input after the DOM updates
  nextTick(() => {
    if (editTitleInput.value) {
      editTitleInput.value.focus()
    }
  })
}

const saveEdit = async (taskId) => {
  try {
    await api.put(`/tasks/${taskId}`, {
      title: editForm.value.title,
      date: editForm.value.date
    })
    editingTask.value = null
    editForm.value = { title: '', date: '' }
    emit('task-updated')
  } catch (error) {
    console.error('Error updating task:', error)
  }
}

const cancelEdit = () => {
  editingTask.value = null
  editForm.value = { title: '', date: '' }
}

const pushToTomorrow = async (task) => {
  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDate = tomorrow.toISOString().split('T')[0]
    
    await api.put(`/tasks/${task.id}`, {
      date: tomorrowDate
    })
    
    emit('task-updated')
  } catch (error) {
    console.error('Error pushing task to tomorrow:', error)
  }
}

const getTasksByTab = (tab, taskList = props.tasks) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset time to start of day for accurate comparison
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  
  const startOfYear = new Date(today.getFullYear(), 0, 1)
  const endOfYear = new Date(today.getFullYear(), 11, 31)
  
  return taskList.filter(task => {
    const taskDate = new Date(task.date)
    taskDate.setHours(0, 0, 0, 0) // Reset time to start of day for accurate comparison
    
    switch (tab) {
      case 'today':
        // Show tasks due today OR overdue (past due dates)
        return taskDate <= today
      case 'tomorrow':
        return isSameDay(taskDate, tomorrow)
      case 'week':
        // Show tasks due this week but exclude today/overdue and tomorrow
        return taskDate >= startOfWeek && taskDate <= endOfWeek && taskDate > today && !isSameDay(taskDate, tomorrow)
      case 'month':
        // Show tasks due this month but exclude today/overdue, tomorrow, and later this week
        return taskDate >= startOfMonth && taskDate <= endOfMonth && taskDate > today && !isSameDay(taskDate, tomorrow) && !(taskDate >= startOfWeek && taskDate <= endOfWeek)
      case 'year':
        // Show tasks due this year but exclude today/overdue, tomorrow, later this week, and this month
        return taskDate >= startOfYear && taskDate <= endOfYear && taskDate > today && !isSameDay(taskDate, tomorrow) && !(taskDate >= startOfWeek && taskDate <= endOfWeek) && !(taskDate >= startOfMonth && taskDate <= endOfMonth)
      default:
        return true
    }
  })
}

const isSameDay = (date1, date2) => {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear()
}

const getTabLabel = (tab) => {
  const labels = {
    today: 'today and overdue tasks',
    tomorrow: 'tomorrow',
    week: 'later this week',
    month: 'this month',
    year: 'this year'
  }
  return labels[tab] || tab
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const getPriorityVariant = (dateString) => {
  const today = new Date()
  const taskDate = new Date(dateString)
  const diffTime = taskDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'destructive' // Overdue
  if (diffDays === 0) return 'default' // Due today
  if (diffDays <= 3) return 'secondary' // Due soon
  return 'outline' // Future
}

const getPriorityLabel = (dateString) => {
  const today = new Date()
  const taskDate = new Date(dateString)
  const diffTime = taskDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'Overdue'
  if (diffDays === 0) return 'Due Today'
  if (diffDays <= 3) return 'Due Soon'
  return 'Future'
}

const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1)
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  } catch (error) {
    // Ignore audio errors
  }
}
</script> 