<script setup lang="ts" generic="T extends z.ZodAny">
import type { Config, ConfigItem } from './interface'
import { Button } from '@/components/ui/button'
import { FormItem, FormMessage } from '@/components/ui/form'
import { PlusIcon, TrashIcon } from 'lucide-vue-next'
import { FieldArray, FieldContextKey, useField } from 'vee-validate'
import { computed, provide } from 'vue'
import * as z from 'zod'
import AutoFormField from './AutoFormField.vue'
import AutoFormLabel from './AutoFormLabel.vue'
import { beautifyObjectName, getBaseType } from './utils'

const props = defineProps<{
  fieldName: string
  required?: boolean
  config?: Config<T>
  schema?: z.ZodArray<T>
  disabled?: boolean
}>()

function isZodArray(
  item: z.ZodArray<any> | z.ZodDefault<any>,
): item is z.ZodArray<any> {
  return item instanceof z.ZodArray
}

function isZodDefault(
  item: z.ZodArray<any> | z.ZodDefault<any>,
): item is z.ZodDefault<any> {
  return item instanceof z.ZodDefault
}

const itemShape = computed(() => {
  if (!props.schema)
    return

  const schema: z.ZodAny = isZodArray(props.schema)
    ? props.schema._def.type
    : isZodDefault(props.schema)
    // @ts-expect-error missing schema
      ? props.schema._def.innerType._def.type
      : null

  return {
    type: getBaseType(schema),
    schema,
  }
})

const fieldContext = useField(props.fieldName)
// @ts-expect-error ignore missing `id`
provide(FieldContextKey, fieldContext)

// Dinamik boş değer üretici
function getEmptyValueForZodType(schema: z.ZodTypeAny | undefined): any {
  if (!schema) return undefined
  const def = schema._def
  // @ts-ignore
  switch (def.typeName) {
    case 'ZodString':
      return ''
    case 'ZodNumber':
      return 0
    case 'ZodBoolean':
      return false
    case 'ZodObject': {
      const shape = (schema as z.ZodObject<any>).shape
      const obj: any = {}
      for (const key in shape) {
        obj[key] = getEmptyValueForZodType(shape[key])
      }
      return obj
    }
    case 'ZodArray':
      return []
    case 'ZodEnum':
      // @ts-ignore
      return def.values?.[0] ?? ''
    case 'ZodDate':
      return ''
    case 'ZodNullable':
      return null
    case 'ZodOptional':
      return undefined
    default:
      return undefined
  }
}
</script>

<template>
  <FieldArray v-slot="{ fields, remove, push }" as="section" :name="fieldName">
    <slot v-bind="props">
      <FormItem class="space-y-4">
        <!-- Başlık ve açıklama -->
        <div class="space-y-2">
          <AutoFormLabel class="text-base" :required="required">
            {{ schema?.description || beautifyObjectName(fieldName) }}
          </AutoFormLabel>
          <p v-if="schema?.description" class="text-sm text-muted-foreground">
            {{ schema.description }}
          </p>
        </div>

        <!-- Array items - Her zaman görünür -->
        <div class="space-y-4 border rounded-lg p-4">
          <template v-for="(field, index) of fields" :key="`${fieldName}-${field.key}`">
            <div class="relative space-y-3 p-3 border rounded-md bg-card">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-muted-foreground">
                  {{ beautifyObjectName(fieldName) }} #{{ index + 1 }}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  class="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  @click="remove(index)"
                >
                  <TrashIcon :size="14" />
                </Button>
              </div>
              
              <AutoFormField
                :field-name="`${fieldName}[${index}]`"
                :label="fieldName"
                :shape="itemShape!"
                :config="config as ConfigItem"
              />
            </div>
          </template>

          <!-- Add button -->
          <Button
            type="button"
            variant="outline"
            class="w-full flex items-center justify-center gap-2"
            :disabled="disabled"
            @click="push(getEmptyValueForZodType(itemShape?.schema))"
          >
            <PlusIcon :size="16" />
            {{ `Add ${beautifyObjectName(fieldName.replace(/s$/, ''))}` }}
          </Button>
        </div>

        <FormMessage />
      </FormItem>
    </slot>
  </FieldArray>
</template>
