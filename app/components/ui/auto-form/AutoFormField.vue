<script setup lang="ts" generic="U extends ZodAny">
import type { ZodAny } from 'zod'
import type { Config, ConfigItem, Shape } from './interface'
import { computed } from 'vue'
import { DEFAULT_ZOD_HANDLERS, INPUT_COMPONENTS } from './constant'
import useDependencies from './dependencies'

const props = defineProps<{
  fieldName: string
  shape: Shape
  config?: ConfigItem | Config<U>
}>()

function isValidConfig(config: any): config is ConfigItem {
  return !!config?.component
}

const delegatedProps = computed(() => {
  if (['ZodObject', 'ZodArray'].includes(props.shape?.type))
    return { schema: props.shape?.schema }
  return undefined
})

const { isDisabled, isHidden, isRequired, overrideOptions } = useDependencies(props.fieldName)

// Benzersiz id üret
const fieldId = `afield-${props.fieldName.replace(/\W/g, '_')}`
</script>

<template>
  <component
    :is="isValidConfig(config)
      ? typeof config.component === 'string'
        ? INPUT_COMPONENTS[config.component!]
        : config.component
        // @ts-ignore
      : INPUT_COMPONENTS[DEFAULT_ZOD_HANDLERS[shape.type]] "
    v-if="!isHidden"
    :field-name="fieldName"
    :label="shape.schema?.description"
    :required="isRequired || shape.required"
    :options="overrideOptions || shape.options"
    :disabled="isDisabled"
    :config="config"
    :id="fieldId"
    v-bind="delegatedProps"
  >
    <slot v-bind="{ id: fieldId, fieldName, label: shape.schema?.description, required: isRequired || shape.required, config, disabled: isDisabled }" />
  </component>
</template>
