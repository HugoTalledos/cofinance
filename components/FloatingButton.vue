<script setup lang="ts">
interface Props {
    label: string
    color?: string
    size?: 'sm' | 'md' | 'lg'
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

const props = withDefaults(defineProps<Props>(), {
    label: 'Agregar',
    color: 'blue',
    size: 'md',
    position: 'bottom-right'
})

const positionClasses = computed(() => {
    return {
        'bottom-right': 'bottom-8 right-8',
        'bottom-left': 'bottom-8 left-8',
        'top-right': 'top-8 right-8',
        'top-left': 'top-8 left-8'
    }
})

const sizeClasses = computed(() => {
    return {
        'sm': 'text-sm',
        'md': 'text-base',
        'lg': 'text-lg'
    }
})

const emit = defineEmits<{
    (e: 'click'): void
}>()

</script>
<template>
    <button
        class="fixed bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg z-50"
        :class="[positionClasses[props.position], sizeClasses[props.size]]"
        @click="emit('click')">
        <span class="text-lg">{{ props.label }}</span>
    </button>
</template>