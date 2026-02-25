<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePush } from 'notivue'
import Icon from '~/components/common/Icon.vue'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Switch } from '~/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { useContact, useUpdateContactPreference } from '~/graphql/contacts'

const route = useRoute()
const router = useRouter()
const push = usePush()

const contactId = computed(() => route.params.contactId as string)

const { data: contactData, isLoading } = useContact(contactId)
const contact = computed(() => contactData.value)

const { mutateAsync: updatePreference } = useUpdateContactPreference()

async function togglePreference(pref: { subscriberId: string, category: string, channelType: string, enabled: boolean }) {
  try {
    await updatePreference({
      subscriberId: pref.subscriberId,
      category: pref.category,
      channelType: pref.channelType,
      enabled: !pref.enabled,
    })
    push.success({ title: 'Preference updated' })
  }
  catch (error) {
    push.error({ title: 'Failed to update preference', message: error instanceof Error ? error.message : 'Unknown error' })
  }
}

function goBack() {
  router.push(`/apps/${route.params.id}/contacts`)
}

const channelTypeColors: Record<string, string> = {
  EMAIL: 'bg-blue-100 text-blue-700',
  PUSH: 'bg-purple-100 text-purple-700',
  SMS: 'bg-green-100 text-green-700',
  IN_APP: 'bg-orange-100 text-orange-700',
  DISCORD: 'bg-indigo-100 text-indigo-700',
}
</script>

<template>
  <div v-if="contact">
    <div class="flex items-center gap-4 mb-6">
      <Button variant="ghost" size="icon" @click="goBack">
        <Icon name="lucide:arrow-left" class="size-4" />
      </Button>
      <div>
        <h2 class="text-xl font-semibold">
          {{ contact.name || contact.externalId }}
        </h2>
        <p class="text-sm text-muted-foreground font-mono">
          {{ contact.externalId }}
        </p>
      </div>
    </div>

    <!-- Contact Details -->
    <Card class="mb-6">
      <CardHeader>
        <CardTitle>Contact Details</CardTitle>
      </CardHeader>
      <CardContent>
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div v-if="contact.name">
            <dt class="text-muted-foreground">
              Name
            </dt>
            <dd class="font-medium">
              {{ contact.name }}
            </dd>
          </div>
          <div v-if="contact.email">
            <dt class="text-muted-foreground">
              Email
            </dt>
            <dd class="font-medium">
              {{ contact.email }}
            </dd>
          </div>
          <div v-if="contact.phone">
            <dt class="text-muted-foreground">
              Phone
            </dt>
            <dd class="font-medium">
              {{ contact.phone }}
            </dd>
          </div>
          <div v-if="contact.locale">
            <dt class="text-muted-foreground">
              Locale
            </dt>
            <dd class="font-medium">
              {{ contact.locale }}
            </dd>
          </div>
          <div>
            <dt class="text-muted-foreground">
              Created
            </dt>
            <dd class="font-medium">
              {{ new Date(contact.createdAt).toLocaleDateString() }}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>

    <!-- Preferences -->
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Toggle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="!contact.preferences || contact.preferences.length === 0">
              <TableCell colspan="4" class="text-center py-8 text-muted-foreground">
                No preferences configured
              </TableCell>
            </TableRow>
            <TableRow v-for="pref in contact.preferences" :key="pref.id">
              <TableCell class="font-medium">
                {{ pref.category }}
              </TableCell>
              <TableCell>
                <span
                  class="text-xs px-2 py-0.5 rounded-full font-medium"
                  :class="channelTypeColors[pref.channelType] || 'bg-gray-100 text-gray-700'"
                >
                  {{ pref.channelType }}
                </span>
              </TableCell>
              <TableCell>
                <Badge :variant="pref.enabled ? 'default' : 'secondary'">
                  {{ pref.enabled ? 'Enabled' : 'Disabled' }}
                </Badge>
              </TableCell>
              <TableCell>
                <Switch
                  :checked="pref.enabled"
                  @update:checked="togglePreference({ subscriberId: pref.subscriberId, category: pref.category, channelType: pref.channelType, enabled: pref.enabled })"
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>

  <div v-else-if="isLoading" class="flex items-center justify-center h-64">
    <Icon name="lucide:loader-2" class="h-8 w-8 animate-spin" />
  </div>

  <div v-else class="text-center py-12 text-muted-foreground">
    Contact not found
  </div>
</template>
