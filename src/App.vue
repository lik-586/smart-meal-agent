<template>
    <div id="app" class="min-h-screen">
        <router-view v-slot="{ Component }">
            <transition name="page-fade" mode="out-in">
                <component :is="Component" />
            </transition>
        </router-view>
        <GlobalNoticeModal />
    </div>
</template>

<script setup>
// 根组件
import GlobalNoticeModal from './components/GlobalNoticeModal.vue'
</script>
