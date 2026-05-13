<script setup lang="ts">
defineProps<{
  copy: {
    eyebrow: string
    title: string
    body: string
    exportLabel: string
    importLabel: string
    resetLabel: string
  }
}>()

defineEmits<{
  export: []
  reset: []
  importFile: [event: Event]
}>()
</script>

<template>
  <section class="panel backup-panel">
    <p class="eyebrow">{{ copy.eyebrow }}</p>
    <h2>{{ copy.title }}</h2>
    <p>{{ copy.body }}</p>
    <div class="backup-actions">
      <Button :label="copy.exportLabel" icon="pi pi-download" severity="contrast" @click="$emit('export')" />
      <label class="file-button">
        <input type="file" accept="application/json" @change="$emit('importFile', $event)">
        {{ copy.importLabel }}
      </label>
      <Button :label="copy.resetLabel" icon="pi pi-refresh" severity="danger" outlined @click="$emit('reset')" />
    </div>
  </section>
</template>