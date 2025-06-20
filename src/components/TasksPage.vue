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
        <Button @click="toggleAddTaskForm" class="shrink-0">
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
              ref="newTaskTitleInput"
              id="new-task-title-input"
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
          <div class="w-24">
            <Input
              v-model.number="newTask.priority"
              type="number"
              min="1"
              max="10"
              placeholder="Priority"
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
     
      <CardContent>
        <!-- Time-based Tabs -->
        <Tabs v-model="activeTab" class="mb-6">
          <TabsList class="grid w-full grid-cols-5">
            <TabsTrigger value="today">
              Today
              <Badge v-if="getFilteredTaskCountByTab('today') > 0" variant="secondary" class="ml-2">
                {{ getFilteredTaskCountByTab('today') }}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="tomorrow">
              Tomorrow
              <Badge v-if="getFilteredTaskCountByTab('tomorrow') > 0" variant="secondary" class="ml-2">
                {{ getFilteredTaskCountByTab('tomorrow') }}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="week">
              Next Week
              <Badge v-if="getFilteredTaskCountByTab('week') > 0" variant="secondary" class="ml-2">
                {{ getFilteredTaskCountByTab('week') }}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="month">
              Next Month
              <Badge v-if="getFilteredTaskCountByTab('month') > 0" variant="secondary" class="ml-2">
                {{ getFilteredTaskCountByTab('month') }}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="year">
              Future
              <Badge v-if="getFilteredTaskCountByTab('year') > 0" variant="secondary" class="ml-2">
                {{ getFilteredTaskCountByTab('year') }}
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
          <Button v-if="!searchQuery" @click="toggleAddTaskForm">
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
              <TableHead class="w-24"></TableHead>
              <TableHead class="w-20">Priority</TableHead>
              <TableHead class="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="task in filteredAndTabTasks" :key="task.id" :class="{ 'opacity-50': task.status, 'opacity-75 animate-pulse': task._isOptimistic }">
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
                      :id="`edit-task-title-${task.id}`"
                      @blur="handleEditInputBlur"
                      @focus="handleEditInputFocus"
                      autofocus
                    />
                    <Button size="sm" variant="ghost" @click="saveEdit(task.id)">
                      <Check class="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" @click="cancelEdit">
                      <X class="h-3 w-3" />
                    </Button>
                  </div>
                  <div v-else class="flex items-center gap-2">
                    <span 
                      :class="{ 'line-through text-muted-foreground': task.status }" 
                      class="font-medium cursor-pointer hover:bg-muted/50 px-2 py-1 rounded flex-1"
                      @click="startEdit(task)"
                    >
                      {{ task.title }}
                      <span v-if="task._isOptimistic" class="ml-2 text-xs text-muted-foreground">(saving...)</span>
                    </span>
                    <div class="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        class="h-6 w-6 p-0 hover:bg-muted/50"
                        @click="openComments(task)"
                        :title="task.comments && task.comments.length > 0 ? `${task.comments.length} comment${task.comments.length > 1 ? 's' : ''}` : 'Add comment'"
                      >
                        <MessageSquare class="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Badge 
                        v-if="task.comments && task.comments.length > 0" 
                        variant="secondary" 
                        class="h-4 text-xs px-1 min-w-[16px] flex items-center justify-center"
                      >
                        {{ task.comments.length }}
                      </Badge>
                    </div>
                  </div>
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
                <div v-if="editingTask === task.id" class="flex items-center gap-2">
                  <Input
                    v-model.number="editForm.priority"
                    type="number"
                    min="1"
                    max="10"
                    class="h-8 text-sm w-16"
                    @keyup.enter="saveEdit(task.id)"
                    @keyup.escape="cancelEdit"
                  />
                </div>
                <div v-else class="flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded" @click="startEdit(task)">
                  <Badge :variant="getPriorityVariant(task.priority)">
                    {{ task.priority || 5 }}
                  </Badge>
                </div>
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
                      <DropdownMenuItem @click="openComments(task)">
                        <MessageSquare class="mr-2 h-4 w-4" />
                        Comments
                        <Badge v-if="task.comments && task.comments.length > 0" variant="secondary" class="ml-2">
                          {{ task.comments.length }}
                        </Badge>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem v-if="activeTab !== 'today'" @click="pushToToday(task)">
                        <ArrowLeft class="mr-2 h-4 w-4" />
                        Push to Today
                      </DropdownMenuItem>
                      <DropdownMenuSeparator v-if="activeTab !== 'today'" />
                      <DropdownMenuItem v-if="activeTab !== 'tomorrow'" @click="pushToTomorrow(task)">
                        <ArrowRight class="mr-2 h-4 w-4" />
                        Push to Tomorrow
                      </DropdownMenuItem>
                      <DropdownMenuSeparator v-if="activeTab !== 'tomorrow'" />
                      <DropdownMenuItem v-if="activeTab !== 'week'" @click="pushNextWeek(task)">
                        <CalendarDays class="mr-2 h-4 w-4" />
                        Push to Next Week
                      </DropdownMenuItem>
                      <DropdownMenuSeparator v-if="activeTab !== 'week'" />
                      <DropdownMenuItem v-if="activeTab !== 'month'" @click="pushNextMonth(task)">
                        <CalendarRange class="mr-2 h-4 w-4" />
                        Push to Next Month
                      </DropdownMenuItem>
                      <DropdownMenuSeparator v-if="activeTab !== 'month'" />
                      <DropdownMenuItem v-if="activeTab !== 'year'" @click="pushToFuture(task)">
                        <CalendarClock class="mr-2 h-4 w-4" />
                        Push to Future
                      </DropdownMenuItem>
                      <DropdownMenuSeparator v-if="activeTab !== 'year'" />
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
import { ref, computed, onMounted, nextTick } from 'vue'
import api from '../services/api'
import TaskComments from './TaskComments.vue'
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
  CalendarDays,
  CalendarRange,
  CalendarClock,
  MoreHorizontal, 
  Check, 
  Trash2,
  Edit,
  X,
  ArrowRight,
  ArrowLeft,
  MessageSquare
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

const emit = defineEmits(['refresh-tasks', 'task-created', 'task-created-confirmed', 'task-creation-failed', 'task-updated', 'task-deleted'])

const searchQuery = ref('')
const showAddTaskForm = ref(false)
const editingTask = ref(null)
const editTitleInput = ref(null)
const newTaskTitleInput = ref(null)
const activeTab = ref('today')
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
const showComments = ref(false)
const selectedTask = ref(null)

const filteredTasks = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset time to start of day for accurate comparison
  
  let tasks = props.tasks.filter(task => {
    // Filter out completed tasks that are older than today
    if (task.status) {
      const taskDate = new Date(task.date)
      taskDate.setHours(0, 0, 0, 0)
      if (taskDate < today) {
        return false // Hide completed tasks older than today
      }
    }
    return true
  })
  
  if (!searchQuery.value) return tasks
  
  return tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const filteredAndTabTasks = computed(() => {
  const searchFiltered = filteredTasks.value
  return getTasksByTab(activeTab.value, searchFiltered)
})

const getFilteredTaskCountByTab = (tab) => {
  return getTasksByTab(tab, filteredTasks.value).length
}

const createTask = async () => {
  const taskData = { ...newTask.value }
  
  // Generate a temporary ID for optimistic update
  const tempId = Date.now()
  const optimisticTask = {
    id: tempId,
    ...taskData,
    comments: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    _isOptimistic: true // Flag to indicate this is an optimistic update
  }
  
  // Immediately update the UI (optimistic update)
  const currentTasks = [...props.tasks, optimisticTask]
  emit('task-created', optimisticTask)
  
  // Reset form and hide it
  newTask.value = {
    title: '',
    date: new Date().toISOString().split('T')[0],
    status: false,
    priority: 5
  }
  showAddTaskForm.value = false
  playSuccessSound()
  
  // Make async API call in background
  try {
    const response = await api.post('/tasks', taskData)
    // Replace the optimistic task with the real one from server
    emit('task-created-confirmed', { tempId, realTask: response.data })
  } catch (error) {
    console.error('Error creating task:', error)
    // Revert the optimistic update on error
    emit('task-creation-failed', tempId)
    
    // Show error to user
    alert('Failed to create task. Please try again.')
  }
}

const toggleStatus = async (task) => {
  const newStatus = !task.status
  
  // Store original task data for potential rollback
  const originalTask = { ...task }
  
  // Create optimistic update
  const optimisticTask = {
    ...task,
    status: newStatus,
    _isOptimistic: true,
    updated_at: new Date().toISOString()
  }
  
  // Immediately update the UI (optimistic update)
  emit('task-updated', { taskId: task.id, optimisticTask, originalTask })
  
  // Play success sound immediately for better UX
  if (newStatus) {
    playSuccessSound()
  }
  
  // Make async API call in background
  try {
    const response = await api.put(`/tasks/${task.id}`, {
      status: newStatus
    })
    // Confirm the update with real server data
    emit('task-updated-confirmed', { taskId: task.id, realTask: response.data })
  } catch (error) {
    console.error('Error updating task status:', error)
    // Revert the optimistic update on error
    emit('task-update-failed', { taskId: task.id, originalTask })
    
    // Show error to user
    alert('Failed to update task status. Please try again.')
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
    date: task.date,
    priority: task.priority || 5
  }
  
  // Focus the title input after the DOM updates with multiple attempts
  const focusInput = () => {
    const inputById = document.getElementById(`edit-task-title-${task.id}`)
    if (inputById) {
      inputById.focus()
      inputById.select() // Also select all text for better UX
      return true
    }
    return false
  }
  
  // Try focusing immediately after DOM update
  nextTick(() => {
    setTimeout(() => {
      if (!focusInput()) {
        // If first attempt fails, try again after a longer delay
        setTimeout(() => {
          focusInput()
        }, 200)
      }
    }, 50)
  })
}

const saveEdit = async (taskId) => {
  const updateData = {
    title: editForm.value.title,
    date: editForm.value.date,
    priority: editForm.value.priority
  }
  
  // Store original task data for potential rollback
  const originalTask = props.tasks.find(task => task.id === taskId)
  if (!originalTask) return
  
  const optimisticTask = {
    ...originalTask,
    ...updateData,
    _isOptimistic: true,
    updated_at: new Date().toISOString()
  }
  
  // Immediately update the UI (optimistic update)
  emit('task-updated', { taskId, optimisticTask, originalTask })
  
  // Reset edit state
  editingTask.value = null
  editForm.value = { title: '', date: '', priority: 5 }
  
  // Make async API call in background
  try {
    const response = await api.put(`/tasks/${taskId}`, updateData)
    // Confirm the update with real server data
    emit('task-updated-confirmed', { taskId, realTask: response.data })
  } catch (error) {
    console.error('Error updating task:', error)
    // Revert the optimistic update on error
    emit('task-update-failed', { taskId, originalTask })
    
    // Show error to user
    alert('Failed to update task. Please try again.')
  }
}

const cancelEdit = () => {
  editingTask.value = null
  editForm.value = { title: '', date: '', priority: 5 }
}

const handleEditInputFocus = () => {
  // Input successfully focused
}

const handleEditInputBlur = (event) => {
  // Only try to maintain focus if we're still in edit mode and focus didn't go to our buttons
  if (editingTask.value && event.relatedTarget) {
    const isOurButton = event.relatedTarget.closest('button') && 
                       event.relatedTarget.closest('.flex.items-center.gap-2')
    if (!isOurButton) {
      // Focus was lost to something else, try to get it back
      setTimeout(() => {
        const input = document.getElementById(`edit-task-title-${editingTask.value}`)
        if (input && document.activeElement !== input) {
          input.focus()
        }
      }, 50)
    }
  }
}

const pushToToday = async (task) => {
  try {
    const today = new Date()
    const todayDate = today.toISOString().split('T')[0]
    
    await api.put(`/tasks/${task.id}`, {
      date: todayDate
    })
    
    emit('task-updated')
  } catch (error) {
    console.error('Error pushing task to today:', error)
  }
}

const pushToTomorrow = async (task) => {
  console.log('date', new Date())
  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    console.log('tomorrow', tomorrow)
    const tomorrowDate = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().split('T')[0]
    console.log('tomorrowDate', tomorrowDate)
    
    await api.put(`/tasks/${task.id}`, {
      date: tomorrowDate
    })
    
    emit('task-updated')
  } catch (error) {
    console.error('Error pushing task to tomorrow:', error)
  }
}

const pushNextWeek = async (task) => {
  try {
    const today = new Date()
    const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate days until next Monday
    const daysUntilNextMonday = currentDay === 0 ? 1 : (8 - currentDay) // Next Monday
    
    const nextMonday = new Date()
    nextMonday.setDate(today.getDate() + daysUntilNextMonday)
    const nextMondayDate = new Date(nextMonday.getTime() - nextMonday.getTimezoneOffset() * 60000).toISOString().split('T')[0]
    
    await api.put(`/tasks/${task.id}`, {
      date: nextMondayDate
    })
    
    emit('task-updated')
  } catch (error) {
    console.error('Error pushing task to next week:', error)
  }
}

const pushNextMonth = async (task) => {
  try {
    const today = new Date()
    // Get the first day of next month
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    const nextMonthDate = new Date(nextMonth.getTime() - nextMonth.getTimezoneOffset() * 60000).toISOString().split('T')[0]
    
    await api.put(`/tasks/${task.id}`, {
      date: nextMonthDate
    })
    
    emit('task-updated')
  } catch (error) {
    console.error('Error pushing task to next month:', error)
  }
}

const pushToFuture = async (task) => {
  try {
    const today = new Date()
    // Get the last day of next month
    const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0)
    
    // Set to the first day after next month ends (which is the first day of the month after next)
    const futureDate = new Date(today.getFullYear(), today.getMonth() + 2, 1)
    const futureDateString = new Date(futureDate.getTime() - futureDate.getTimezoneOffset() * 60000).toISOString().split('T')[0]
    
    await api.put(`/tasks/${task.id}`, {
      date: futureDateString
    })
    
    emit('task-updated')
  } catch (error) {
    console.error('Error pushing task to future:', error)
  }
}

const openComments = (task) => {
  selectedTask.value = task
  showComments.value = true
}

const handleCommentsUpdated = () => {
  // Refresh tasks to get updated comment counts
  emit('task-updated')
}

const getTasksByTab = (tab, taskList = props.tasks) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset time to start of day for accurate comparison
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  // Calculate next week (Monday to Sunday)
  const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
  const daysUntilNextMonday = currentDay === 0 ? 1 : (8 - currentDay)
  
  const nextWeekStart = new Date(today) // Next Monday
  nextWeekStart.setDate(today.getDate() + daysUntilNextMonday)
  
  const nextWeekEnd = new Date(nextWeekStart) // Next Sunday
  nextWeekEnd.setDate(nextWeekStart.getDate() + 6)
  
  // Calculate next month (1st to end of next month)
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1) // First day of next month
  const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0) // Last day of next month
  
  // Calculate future (everything after next month)
  const futureStart = new Date(today.getFullYear(), today.getMonth() + 2, 1) // First day after next month
  
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
        // Show tasks due next week (Monday to Sunday)
        return taskDate >= nextWeekStart && taskDate <= nextWeekEnd
      case 'month':
        // Show tasks due next month (1st to end of next month)
        return taskDate >= nextMonthStart && taskDate <= nextMonthEnd
      case 'year':
        // Show tasks due in the future (beyond next month)
        return taskDate >= futureStart
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
    week: 'next week',
    month: 'next month',
    year: 'future tasks'
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

const getPriorityVariant = (priority) => {
  const p = priority || 5
  if (p <= 2) return 'destructive' // High priority (1-2)
  if (p <= 4) return 'default' // Medium-high priority (3-4)
  if (p <= 6) return 'secondary' // Medium priority (5-6)
  if (p <= 8) return 'outline' // Low-medium priority (7-8)
  return 'outline' // Low priority (9-10)
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

const toggleAddTaskForm = () => {
  const wasOpen = showAddTaskForm.value
  showAddTaskForm.value = !showAddTaskForm.value
  
  // Focus the title input when form is opened (not when closing)
  if (!wasOpen && showAddTaskForm.value) {
    // Use both nextTick and a small timeout to ensure DOM is ready
    nextTick(() => {
            setTimeout(() => {
        // Try multiple approaches to focus the input
        let focused = false
        
        // Method 1: Direct ref focus
        if (newTaskTitleInput.value && !focused) {
          try {
            newTaskTitleInput.value.focus()
            focused = true
          } catch (error) {
            // Continue to next method
          }
        }
        
        // Method 2: Focus by ID
        if (!focused) {
          const inputById = document.getElementById('new-task-title-input')
          if (inputById) {
            inputById.focus()
            focused = true
          }
        }
        
        // Method 3: Focus by data attribute or placeholder
        if (!focused) {
          const inputElement = document.querySelector('input[placeholder="Enter task title..."]')
          if (inputElement) {
            inputElement.focus()
            focused = true
          }
        }
      }, 50) // 50ms delay to ensure DOM is fully rendered
    })
  }
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