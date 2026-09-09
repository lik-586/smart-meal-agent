<template>
    <footer class="bg-white border-2 border-[#0A0910] max-w-7xl mx-auto px-2 rounded-lg p-4 text-center mt-8">
        <div class="space-y-3">
            <p class="text-sm text-gray-600">© {{ year }} 智能美食搭配助手 · 工程实训大作业</p>
            <p class="text-xs text-gray-500">🍳 灶间有 AI，顿顿好搭配</p>
        </div>
    </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<style scoped>
a {
    transition: all 0.2s ease-in-out;
}
a:hover {
    transform: translateY(-1px);
}
@media (max-width: 640px) {
    .space-y-3 > * + * {
        margin-top: 0.5rem;
    }
}
</style>
