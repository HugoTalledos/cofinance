<script setup lang="ts">
import { useAuth } from '~/composables/useLogin'

const { authLoading } = useAuth()
</script>

<template>
  <div>
    <app-loading-screen v-if="authLoading" />
    <NuxtPage v-else />
  </div>
</template>
