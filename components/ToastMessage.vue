<script setup lang="ts">
defineProps<{ message?: string }>()
</script>

<template>
  <div :class="['toast-message', { show: message }]" role="status" aria-live="polite">
    {{ message }}
  </div>
</template>