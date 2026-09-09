/** 视觉识别服务：从照片中识别食材 */
const { visionRecognize } = require('../ai/client')

const SYSTEM_PROMPT = `你是一个专业的冰箱食材识别系统。请严格遵循以下规则处理图片：

识别规则：
1. 仅识别明确可见、可辨认的食材
2. 名称使用常见中文名称（如：西兰花，非"青花菜"）

输出规范：
- 格式：纯文本，食材名称用逗号分隔
- 数量：最多20种，按视觉显著度排序
- 空结果：若无食材则返回空字符串
- 无任何前缀/后缀说明

特殊处理：
- 部分可见食材：标注为"未知蔬菜/肉类"等
- 包装食品：识别可见部分`
const USER_PROMPT = '请识别图片中的所有食材，只返回食材名称，用逗号分隔'

async function recognizeIngredients({ base64, mime, config }) {
    const content = await visionRecognize({ base64, mime, prompt: `${SYSTEM_PROMPT}\n\n${USER_PROMPT}`, config })
    return String(content)
        .split(/[,，、\n]/)
        .map(item => item.trim())
        .filter(item => item.length > 0 && item.length < 10)
        .slice(0, 10)
}

module.exports = { recognizeIngredients }
