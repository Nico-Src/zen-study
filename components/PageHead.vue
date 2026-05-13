<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title?: string
  copy?: string
  actionLabel?: string
  actionIcon?: string
}>()

defineEmits<{ action: [] }>()
</script>

<template>
  <div class="page-head">
    <div>
      <p class="eyebrow">{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
      <p>{{ copy }}</p>
    </div>
    <Button v-if="actionLabel" :label="actionLabel" :icon="actionIcon" severity="contrast" @click="$emit('action')" />
  </div>
</template>