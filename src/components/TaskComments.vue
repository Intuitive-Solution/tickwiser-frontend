<template>
  <Dialog :open="isOpen" @update:open="(value) => isOpen = value">
    <DialogContent class="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <MessageSquare class="h-5 w-5" />
          Comments for "{{ task?.title }}"
        </DialogTitle>
        <DialogDescription>
          Add notes and comments to track your progress
        </DialogDescription>
      </DialogHeader>
      
      <div class="flex-1 overflow-y-auto space-y-4 py-4">
        <!-- Add Comment Form -->
        <Card>
          <CardContent class="pt-6">
            <form @submit.prevent="addComment" class="space-y-4">
              <Textarea
                v-model="newComment"
                placeholder="Add a comment..."
                rows="3"
                :disabled="loading"
              />
              <div class="flex justify-end">
                <Button type="submit" :disabled="loading || !newComment.trim()">
                  <div v-if="loading" class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  <Plus class="mr-2 h-4 w-4" />
                  Add Comment
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <!-- Comments List -->
        <div v-if="comments.length === 0" class="text-center py-8">
          <MessageSquare class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 class="text-lg font-medium mb-2">No comments yet</h3>
          <p class="text-muted-foreground">Add your first comment to track progress on this task.</p>
        </div>

        <div v-else class="space-y-3">
          <Card v-for="comment in comments" :key="comment.id" class="relative">
            <CardContent class="pt-4">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div v-if="editingComment === comment.id" class="space-y-3">
                    <Textarea
                      v-model="editForm.comment"
                      rows="3"
                      :disabled="loading"
                      ref="editCommentInput"
                    />
                    <div class="flex gap-2">
                      <Button size="sm" @click="saveEdit(comment.id)" :disabled="loading">
                        <Check class="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" @click="cancelEdit">
                        <X class="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                  <div v-else>
                    <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-2">
                      {{ comment.comment }}
                    </p>
                    <div class="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock class="h-3 w-3" />
                      {{ formatDateTime(comment.created_at) }}
                      <span v-if="comment.updated_at !== comment.created_at">
                        (edited {{ formatDateTime(comment.updated_at) }})
                      </span>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
                      <MoreHorizontal class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="startEdit(comment)">
                      <Edit class="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="deleteComment(comment.id)" class="text-destructive">
                      <Trash2 class="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="closeDialog">
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import api from '../services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MessageSquare,
  Plus,
  Clock,
  MoreHorizontal,
  Edit,
  Trash2,
  Check,
  X
} from 'lucide-vue-next'

const props = defineProps({
  task: {
    type: Object,
    default: null
  },
  open: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:open', 'comments-updated'])

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const comments = ref([])
const newComment = ref('')
const loading = ref(false)
const editingComment = ref(null)
const editCommentInput = ref(null)
const editForm = ref({ comment: '' })

// Watch for task changes to load comments
watch(() => props.task, (newTask) => {
  if (newTask && props.open) {
    loadComments()
  }
}, { immediate: true })

// Watch for dialog open state
watch(() => props.open, (isOpen) => {
  if (isOpen && props.task) {
    loadComments()
  }
})

const loadComments = async () => {
  if (!props.task) return
  
  try {
    loading.value = true
    const response = await api.get(`/tasks/${props.task.id}/comments`)
    comments.value = response.data
  } catch (error) {
    console.error('Error loading comments:', error)
  } finally {
    loading.value = false
  }
}

const addComment = async () => {
  if (!newComment.value.trim() || !props.task) return
  
  try {
    loading.value = true
    const response = await api.post(`/tasks/${props.task.id}/comments`, {
      comment: newComment.value.trim()
    })
    
    comments.value.unshift(response.data)
    newComment.value = ''
    emit('comments-updated')
  } catch (error) {
    console.error('Error adding comment:', error)
  } finally {
    loading.value = false
  }
}

const startEdit = (comment) => {
  editingComment.value = comment.id
  editForm.value.comment = comment.comment
  
  nextTick(() => {
    if (editCommentInput.value) {
      editCommentInput.value.focus()
    }
  })
}

const saveEdit = async (commentId) => {
  if (!editForm.value.comment.trim()) return
  
  try {
    loading.value = true
    const response = await api.put(`/tasks/${props.task.id}/comments/${commentId}`, {
      comment: editForm.value.comment.trim()
    })
    
    const index = comments.value.findIndex(c => c.id === commentId)
    if (index !== -1) {
      comments.value[index] = response.data
    }
    
    editingComment.value = null
    editForm.value.comment = ''
    emit('comments-updated')
  } catch (error) {
    console.error('Error updating comment:', error)
  } finally {
    loading.value = false
  }
}

const cancelEdit = () => {
  editingComment.value = null
  editForm.value.comment = ''
}

const deleteComment = async (commentId) => {
  if (!confirm('Are you sure you want to delete this comment?')) return
  
  try {
    loading.value = true
    await api.delete(`/tasks/${props.task.id}/comments/${commentId}`)
    
    comments.value = comments.value.filter(c => c.id !== commentId)
    emit('comments-updated')
  } catch (error) {
    console.error('Error deleting comment:', error)
  } finally {
    loading.value = false
  }
}

const closeDialog = () => {
  isOpen.value = false
  editingComment.value = null
  editForm.value.comment = ''
}

const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script> 