<template>
    <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="handleClose(false)">
        <div class="bg-white rounded-lg border-2 border-[#0A0910] max-w-md w-full animate-fade-in">
            <div class="border-b-2 border-black p-4 bg-gradient-to-r from-orange-50 to-yellow-50">
                <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span class="text-2xl">📢</span>
                    使用提示
                </h3>
            </div>
            <div class="p-6">
                <div class="space-y-3 text-gray-700 mb-6">
                    <p class="font-medium text-base">欢迎使用「智能美食搭配助手」🤖</p>
                    <p class="leading-relaxed">本系统支持浏览器内调用任意 <span class="font-semibold text-purple-600">OpenAI 兼容</span> 接口的文本/图片/视觉模型，并在后端持久化收藏与图库。</p>
                    <p class="leading-relaxed">
                        💡 <span class="font-semibold">推荐先配置 API Key：</span><br />
                        点击导航栏的 <span class="font-semibold text-orange-600">⚙️ 设置</span> 填写 BaseUrl / API Key / 模型名，
                        或在 <code class="text-xs bg-gray-100 px-1 rounded">server/.env</code> 中配置后端默认模型。
                    </p>
                    <p class="text-sm leading-relaxed pt-2 border-t border-gray-200 text-gray-600">
                        本项目为工程实训大作业，演示智能体（Agent）的自主思考与工具调用能力；所有数据均存于本地后端 <code class="text-xs bg-gray-100 px-1 rounded">server/data/db.json</code>，不上传第三方。
                    </p>
                </div>
                <div class="flex gap-3">
                    <button
                        @click="handleClose(false)"
                        class="flex-1 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium border-2 border-[#0A0910] transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                        知道了
                    </button>
                    <button
                        @click="handleClose(true)"
                        class="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-lg font-medium border-2 border-[#0A0910] transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                        不再提醒
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const show = ref(false)
const NOTICE_KEY = 'meal-agent-notice-dismissed'

onMounted(() => {
    const dismissed = localStorage.getItem(NOTICE_KEY)
    if (dismissed !== 'permanent') {
        setTimeout(() => {
            show.value = true
        }, 500)
    }
})

const handleClose = (permanent: boolean) => {
    show.value = false
    if (permanent) {
        localStorage.setItem(NOTICE_KEY, 'permanent')
    }
}
</script>

<style scoped>
@keyframes fade-in {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

.animate-fade-in {
    animation: fade-in 0.3s ease-out;
}
</style>
