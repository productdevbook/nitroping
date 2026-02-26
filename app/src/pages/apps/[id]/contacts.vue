<script setup lang="ts">
import { usePush } from 'notivue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { useContacts, useCreateContact, useDeleteContact } from '~/graphql/contacts'

const route = useRoute()
const appId = computed(() => route.params.id as string)
const push = usePush()

const { data: contactsData, isLoading } = useContacts(appId)
const contactList = computed(() => contactsData.value || [])

const { mutateAsync: createContact, isLoading: isCreating } = useCreateContact()
const { mutateAsync: deleteContact } = useDeleteContact()

const showCreate = ref(false)
const form = ref({ externalId: '', name: '', email: '', phone: '', locale: '' })

async function handleCreate() {
  try {
    await createContact({
      appId: appId.value,
      externalId: form.value.externalId,
      name: form.value.name || undefined,
      email: form.value.email || undefined,
      phone: form.value.phone || undefined,
      locale: form.value.locale || undefined,
    })
    showCreate.value = false
    form.value = { externalId: '', name: '', email: '', phone: '', locale: '' }
    push.success({ title: 'Contact created successfully' })
  }
  catch (error) {
    push.error({ title: 'Failed to create contact', message: error instanceof Error ? error.message : 'Unknown error' })
  }
}

async function handleDelete(id: string) {
  try {
    await deleteContact({ id, appId: appId.value })
    push.success({ title: 'Contact deleted' })
  }
  catch (error) {
    push.error({ title: 'Failed to delete contact', message: error instanceof Error ? error.message : 'Unknown error' })
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-semibold">
          Contacts
        </h2>
        <p class="text-sm text-muted-foreground">
          Manage notification contacts for this app
        </p>
      </div>
      <Button @click="showCreate = true">
        Add Contact
      </Button>
    </div>

    <Card>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>External ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Locale</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="isLoading">
              <TableCell colspan="7" class="text-center py-8 text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
            <TableRow v-else-if="contactList.length === 0">
              <TableCell colspan="7" class="text-center py-8 text-muted-foreground">
                No contacts yet
              </TableCell>
            </TableRow>
            <TableRow v-for="contact in contactList" :key="contact.id">
              <TableCell class="font-mono text-sm">
                {{ contact.externalId }}
              </TableCell>
              <TableCell>{{ contact.name || '—' }}</TableCell>
              <TableCell>{{ contact.email || '—' }}</TableCell>
              <TableCell>{{ contact.phone || '—' }}</TableCell>
              <TableCell>{{ contact.locale || '—' }}</TableCell>
              <TableCell class="text-sm text-muted-foreground">
                {{ new Date(contact.createdAt).toLocaleDateString() }}
              </TableCell>
              <TableCell>
                <Button variant="destructive" size="sm" @click="handleDelete(contact.id)">
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Dialog v-model:open="showCreate">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <Label>External ID *</Label>
            <Input v-model="form.externalId" placeholder="user-123" />
          </div>
          <div>
            <Label>Name</Label>
            <Input v-model="form.name" placeholder="John Doe" />
          </div>
          <div>
            <Label>Email</Label>
            <Input v-model="form.email" type="email" placeholder="user@example.com" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input v-model="form.phone" placeholder="+1234567890" />
          </div>
          <div>
            <Label>Locale</Label>
            <Input v-model="form.locale" placeholder="en-US" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showCreate = false">
            Cancel
          </Button>
          <Button :disabled="!form.externalId || isCreating" @click="handleCreate">
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
