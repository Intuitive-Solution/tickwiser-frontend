<template>
  <Dialog :open="isOpen" @update:open="(value) => updateOpen(value)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <FolderPlus class="h-5 w-5" />
          Add New Project
        </DialogTitle>
        <DialogDescription>
          Create a new project to organize your tasks
        </DialogDescription>
      </DialogHeader>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <Label for="project-name">Project Name</Label>
          <Input
            id="project-name"
            v-model="projectName"
            placeholder="Enter project name..."
            required
            :disabled="loading"
            ref="projectNameInput"
            maxlength="255"
          />
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            @click="handleCancel"
            :disabled="loading"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            :disabled="loading || !projectName.trim()"
          >
            <div v-if="loading" class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
            <FolderPlus v-else class="mr-2 h-4 w-4" />
            {{ loading ? 'Creating...' : 'Create Project' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import api from '../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FolderPlus } from 'lucide-vue-next'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:open', 'project-created'])

const isOpen = ref(props.open)
const projectName = ref('')
const loading = ref(false)
const projectNameInput = ref(null)

// Watch for prop changes
watch(() => props.open, (newValue) => {
  isOpen.value = newValue
  if (newValue) {
    // Reset form when modal opens
    projectName.value = ''
    // Focus the input after the modal is rendered
    nextTick(() => {
      const inputElement = projectNameInput.value
      if (inputElement) {
        // Try different ways to focus based on how the ref is structured
        if (typeof inputElement.focus === 'function') {
          inputElement.focus()
        } else if (inputElement.$el && typeof inputElement.$el.focus === 'function') {
          inputElement.$el.focus()
        } else if (inputElement.querySelector) {
          const input = inputElement.querySelector('input')
          if (input && typeof input.focus === 'function') {
            input.focus()
          }
        }
      }
    })
  }
})

const updateOpen = (value) => {
  isOpen.value = value
  emit('update:open', value)
}

const handleCancel = () => {
  if (!loading.value) {
    projectName.value = ''
    updateOpen(false)
  }
}

const handleSubmit = async () => {
  if (!projectName.value.trim() || loading.value) {
    return
  }

  try {
    loading.value = true
    
    const response = await api.post('/projects', {
      name: projectName.value.trim()
    })

    // Emit the created project
    emit('project-created', response.data)
    
    // Reset form and close modal
    projectName.value = ''
    updateOpen(false)
    
  } catch (error) {
    console.error('Error creating project:', error)
    
    // Show error message
    let errorMessage = 'Failed to create project'
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.response?.data?.errors) {
      // Handle validation errors
      const errors = Object.values(error.response.data.errors).flat()
      errorMessage = errors.join(', ')
    }
    
    alert(errorMessage) // You can replace this with a toast notification later
  } finally {
    loading.value = false
  }
}
</script> 