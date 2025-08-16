<template>
  <Card>
    <CardHeader>
      <CardTitle>App Information</CardTitle>
      <CardDescription>Provide basic information about your application</CardDescription>
    </CardHeader>
    <CardContent>
      <form @submit="onSubmit" class="space-y-6">
        <!-- App Name -->
        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel class="required">App Name</FormLabel>
            <FormControl>
              <Input 
                v-bind="componentField" 
                placeholder="My Awesome App"
                :disabled="isSubmitting || loading"
              />
            </FormControl>
            <FormDescription>
              The display name for your application
            </FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>
        
        <!-- App Slug -->
        <FormField v-slot="{ componentField }" name="slug">
          <FormItem>
            <FormLabel class="required">Slug</FormLabel>
            <FormControl>
              <Input 
                v-bind="componentField" 
                placeholder="my-awesome-app"
                :disabled="isSubmitting || loading"
              />
            </FormControl>
            <FormDescription>
              Used in API URLs and as bundle identifier. Only lowercase letters, numbers, and hyphens allowed.
            </FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>
        
        <!-- Description -->
        <FormField v-slot="{ componentField }" name="description">
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea 
                v-bind="componentField" 
                placeholder="A brief description of your app..."
                rows="3"
                :disabled="isSubmitting || loading"
              />
            </FormControl>
            <FormDescription>
              Optional description to help you identify this app
            </FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- Submit Buttons -->
        <div class="flex space-x-3 pt-4">
          <Button 
            type="submit" 
            :disabled="isSubmitting || loading"
            class="flex-1"
          >
            <Loader2 v-if="isSubmitting || loading" class="w-4 h-4 mr-2 animate-spin" />
            <Plus class="w-4 h-4 mr-2" />
            Create App
          </Button>
          <Button type="button" variant="outline" @click="$emit('cancel')">
            Cancel
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Plus, Loader2 } from 'lucide-vue-next'

// Props
interface Props {
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Events
const emit = defineEmits<{
  submit: [data: { name: string; slug: string; description?: string }]
  cancel: []
}>()

// Form validation schema
const formSchema = toTypedSchema(z.object({
  name: z.string().min(1, 'App name is required'),
  slug: z.string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .regex(/^[a-z0-9]/, 'Slug must start with a letter or number')
    .regex(/[a-z0-9]$/, 'Slug must end with a letter or number'),
  description: z.string().optional()
}))

// Form setup
const { handleSubmit, isSubmitting, values, setFieldValue } = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: '',
    slug: '',
    description: ''
  }
})

// Form submission
const onSubmit = handleSubmit(async (formValues) => {
  const formData = {
    name: formValues.name.trim(),
    slug: formValues.slug.trim(),
    description: formValues.description?.trim() || undefined
  }
  
  emit('submit', formData)
})

// Auto-generate slug from name
watch(() => values.name, (newName) => {
  if (newName && !values.slug) {
    const slug = newName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    
    setFieldValue('slug', slug)
  }
})
</script>

<style scoped>
.required::after {
  content: "*";
  color: rgb(239 68 68);
  margin-left: 0.25rem;
}
</style>