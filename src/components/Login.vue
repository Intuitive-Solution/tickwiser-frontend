<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <Card class="w-full max-w-md">
      <CardHeader class="space-y-1">
        <div class="flex justify-center mb-4">
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <span class="text-xl font-bold text-primary">MyTodos</span>
          </div>
        </div>
        <CardTitle class="text-2xl font-bold text-center">
          {{ isSignUp ? 'Create an account' : 'Sign in to your account' }}
        </CardTitle>
        <CardDescription class="text-center">
          {{ isSignUp ? 'Enter your details to create your account' : 'Enter your email and password to sign in' }}
        </CardDescription>
      </CardHeader>
      
      <CardContent class="space-y-4">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input 
              id="email"
              v-model="email" 
              type="email" 
              placeholder="Enter your email" 
              required 
              :disabled="loading"
            />
          </div>
          
          <div class="space-y-2">
            <Label for="password">Password</Label>
            <Input 
              id="password"
              v-model="password" 
              type="password" 
              placeholder="Enter your password" 
              required 
              :disabled="loading"
            />
          </div>
          
          <Button 
            type="submit" 
            class="w-full" 
            :disabled="loading"
          >
            <div v-if="loading" class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
            {{ loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In') }}
          </Button>
        </form>
        
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <Separator class="w-full" />
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          class="w-full" 
          @click="handleGoogleSignIn"
          :disabled="loading"
        >
          <div v-if="loading" class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
          <svg v-else class="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {{ loading ? 'Signing in...' : 'Google' }}
        </Button>
        
        <Alert v-if="error" variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertDescription>
            {{ error }}
          </AlertDescription>
        </Alert>
      </CardContent>
      
      <CardFooter>
        <div class="text-center text-sm text-muted-foreground w-full">
          {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
          <Button 
            variant="link" 
            class="p-0 h-auto font-normal text-primary underline-offset-4 hover:underline"
            @click="toggleMode"
          >
            {{ isSignUp ? 'Sign in' : 'Sign up' }}
          </Button>
        </div>
      </CardFooter>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { signIn, signUp, signInWithGoogle } from '../services/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-vue-next';

const emit = defineEmits(['authenticated']);

const email = ref('');
const password = ref('');
const isSignUp = ref(false);
const loading = ref(false);
const error = ref('');

const handleSubmit = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    let user;
    if (isSignUp.value) {
      user = await signUp(email.value, password.value);
    } else {
      user = await signIn(email.value, password.value);
    }
    
    emit('authenticated', user);
  } catch (err) {
    error.value = getErrorMessage(err.code);
  } finally {
    loading.value = false;
  }
};

const handleGoogleSignIn = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const user = await signInWithGoogle();
    emit('authenticated', user);
  } catch (err) {
    error.value = getErrorMessage(err.code);
  } finally {
    loading.value = false;
  }
};

const toggleMode = () => {
  isSignUp.value = !isSignUp.value;
  error.value = '';
  email.value = '';
  password.value = '';
};

const getErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No user found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'Email address is already in use.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed.';
    default:
      return 'An error occurred. Please try again.';
  }
};
</script>

 