<script setup lang="ts">
const { user, authLoading } = useAuth()
</script>

<template>
  <div v-if="authLoading" class="min-h-screen flex items-center justify-center bg-background">
    <span class="font-body-md text-body-md text-on-surface-variant">Cargando…</span>
  </div>
  <LoginScreen v-else-if="!user" />
  <NuxtPage v-else />
</template>
