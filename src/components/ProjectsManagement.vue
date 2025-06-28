<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Projects Management</h2>
        <p class="text-muted-foreground">Manage all your projects and their status</p>
      </div>
      <Button @click="$emit('add-project')" class="gap-2">
        <Plus class="h-4 w-4" />
        Add Project
      </Button>
    </div>

    <!-- Projects List -->
    <div class="space-y-4">
      <div v-if="projects.length === 0" class="text-center py-12">
        <FolderOpen class="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 class="mt-4 text-lg font-medium">No projects yet</h3>
        <p class="mt-2 text-muted-foreground">Get started by creating your first project</p>
        <Button @click="$emit('add-project')" class="mt-4 gap-2">
          <Plus class="h-4 w-4" />
          Add Project
        </Button>
      </div>

      <div v-else class="grid gap-4">
        <Card v-for="project in projects" :key="project.id" class="p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-muted">
                <FolderOpen class="h-5 w-5" />
              </div>
              <div>
                <h3 class="font-semibold">{{ project.name }}</h3>
                <p class="text-sm text-muted-foreground">
                  Created {{ formatDate(project.created_at) }}
                </p>
              </div>
            </div>
            
            <div class="flex items-center gap-4">
              <!-- Status Badge -->
              <Badge 
                :variant="project.status === 'active' ? 'default' : 'secondary'"
                :class="project.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'"
              >
                {{ project.status === 'active' ? 'Active' : 'Inactive' }}
              </Badge>
              
              <!-- Status Toggle Switch -->
              <div class="flex items-center gap-2">
                <label class="text-sm text-muted-foreground">
                  {{ project.status === 'active' ? 'Active' : 'Inactive' }}
                </label>
                <Switch 
                  :checked="project.status === 'active'"
                  @update:checked="(checked) => toggleProjectStatus(project, checked)"
                  :disabled="loading"
                />
              </div>
              
              <!-- View Project Button -->
              <Button 
                variant="outline" 
                size="sm"
                @click="$emit('view-project', project)"
                class="gap-2"
              >
                <Eye class="h-4 w-4" />
                View Tasks
              </Button>
            </div>
          </div>
          
          <!-- Task Count -->
          <div class="mt-4 pt-4 border-t">
            <div class="flex items-center gap-4 text-sm text-muted-foreground">
              <span class="flex items-center gap-1">
                <CheckSquare class="h-4 w-4" />
                {{ getTaskCount(project.id) }} tasks
              </span>
              <span class="flex items-center gap-1">
                <Clock class="h-4 w-4" />
                Last updated {{ formatDate(project.updated_at) }}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  FolderOpen, 
  Plus, 
  Eye, 
  CheckSquare, 
  Clock 
} from 'lucide-vue-next';

const props = defineProps({
  projects: {
    type: Array,
    required: true
  },
  tasks: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['project-status-updated', 'add-project', 'view-project']);

const toggleProjectStatus = async (project, isActive) => {
  const newStatus = isActive ? 'active' : 'inactive';
  emit('project-status-updated', project.id, newStatus);
};

const getTaskCount = (projectId) => {
  return props.tasks.filter(task => task.project_id === projectId).length;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
  return `${Math.ceil(diffDays / 365)} years ago`;
};
</script> 