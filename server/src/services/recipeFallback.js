/**
 * 菜谱本地兜底库（与营养分析/饮品搭配的兜底机制同思路）
 * 大模型多次重试仍失败时，按「菜系 + 用户食材」从经典家常菜库中匹配一道相关性最高的菜，
 * 保证主页与美食盲盒永远能出菜谱，而不是"大师表示很为难"。
 */
const { uid } = require('../utils')

/** 菜系 id → 经典菜品列表；need 为食材关键词（命中越多越优先），空数组表示招牌保底菜 */
const FALLBACK_DISHES = {
    su: [
        { name: '松鼠鳜鱼（简化家常版）', need: ['鱼'], cuisine: '苏菜' },
        { name: '响油鳝糊', need: ['鳝', '黄鳝'], cuisine: '苏菜' },
        { name: '樱桃肉', need: ['猪肉', '五花肉'], cuisine: '苏菜' },
        { name: '清炒鸡头米虾仁', need: ['虾仁', '虾仁'], cuisine: '苏菜' },
        { name: '母油船鸭', need: ['鸭'], cuisine: '苏菜' },
        { name: '苏式番茄炒蛋', need: [], cuisine: '苏菜' }
    ],
    lu: [
        { name: '糖醋鲤鱼', need: ['鱼'], cuisine: '鲁菜' },
        { name: '葱烧海参', need: ['海参'], cuisine: '鲁菜' },
        { name: '九转大肠', need: ['肥肠', '大肠'], cuisine: '鲁菜' },
        { name: '油爆双脆', need: ['鸡胗', '肚'], cuisine: '鲁菜' },
        { name: '锅塌豆腐', need: ['豆腐', '鸡蛋'], cuisine: '鲁菜' },
        { name: '葱爆羊肉', need: ['羊肉', '葱'], cuisine: '鲁菜' },
        { name: '经典葱烧鸡蛋豆腐', need: [], cuisine: '鲁菜' }
    ],
    chuan: [
        { name: '麻婆豆腐', need: ['豆腐', '肉末', '猪肉'], cuisine: '川菜' },
        { name: '宫保鸡丁', need: ['鸡胸', '鸡肉', '花生'], cuisine: '川菜' },
        { name: '鱼香肉丝', need: ['猪肉', '木耳', '胡萝卜'], cuisine: '川菜' },
        { name: '回锅肉', need: ['五花肉', '蒜苗', '青椒'], cuisine: '川菜' },
        { name: '水煮肉片', need: ['里脊', '猪肉', '豆芽'], cuisine: '川菜' },
        { name: '干煸四季豆', need: ['四季豆', '豆角'], cuisine: '川菜' },
        { name: '家常麻辣香锅（时蔬版）', need: [], cuisine: '川菜' }
    ],
    yue: [
        { name: '白切鸡', need: ['鸡', '鸡腿'], cuisine: '粤菜' },
        { name: '清蒸鲈鱼', need: ['鱼', '鲈鱼'], cuisine: '粤菜' },
        { name: '蒜蓉炒时蔬', need: ['青菜', '菜心', '生菜', '西兰花'], cuisine: '粤菜' },
        { name: '豉汁蒸排骨', need: ['排骨', '豆豉'], cuisine: '粤菜' },
        { name: '滑蛋虾仁', need: ['虾仁', '鸡蛋'], cuisine: '粤菜' },
        { name: '蜜汁叉烧鸡腿', need: [], cuisine: '粤菜' }
    ],
    zhe: [
        { name: '西湖醋鱼', need: ['鱼', '草鱼'], cuisine: '浙菜' },
        { name: '龙井虾仁', need: ['虾仁', '茶叶'], cuisine: '浙菜' },
        { name: '东坡肉', need: ['五花肉'], cuisine: '浙菜' },
        { name: '宋嫂鱼羹', need: ['鱼', '豆腐'], cuisine: '浙菜' },
        { name: '干炸响铃', need: ['豆皮'], cuisine: '浙菜' },
        { name: '家常片儿川', need: [], cuisine: '浙菜' }
    ],
    xiang: [
        { name: '剁椒鱼头', need: ['鱼头', '鱼'], cuisine: '湘菜' },
        { name: '辣椒炒肉', need: ['猪肉', '青椒', '辣椒'], cuisine: '湘菜' },
        { name: '小炒黄牛肉', need: ['牛肉'], cuisine: '湘菜' },
        { name: '农家一碗香', need: ['鸡蛋', '辣椒', '五花肉'], cuisine: '湘菜' },
        { name: '擂辣椒茄子', need: ['茄子', '辣椒'], cuisine: '湘菜' },
        { name: '蒜苗香干回锅肉末', need: [], cuisine: '湘菜' }
    ],
    min: [
        { name: '荔枝肉', need: ['猪肉'], cuisine: '闽菜' },
        { name: '海蛎煎', need: ['海蛎', '牡蛎', '鸡蛋'], cuisine: '闽菜' },
        { name: '沙茶面', need: ['虾', '面条', '花生酱'], cuisine: '闽菜' },
        { name: '佛跳墙（家常炖罐版）', need: ['香菇', '鸡肉', '排骨'], cuisine: '闽菜' },
        { name: '淡糟香螺片', need: ['螺'], cuisine: '闽菜' },
        { name: '闽南咸饭', need: [], cuisine: '闽菜' }
    ],
    hui: [
        { name: '臭鳜鱼', need: ['鱼'], cuisine: '徽菜' },
        { name: '毛豆腐', need: ['豆腐'], cuisine: '徽菜' },
        { name: '胡氏一品锅', need: ['猪肉', '蛋饺', '豆腐'], cuisine: '徽菜' },
        { name: '问政山笋', need: ['笋'], cuisine: '徽菜' },
        { name: '徽州刀板香', need: ['五花肉', '腌肉'], cuisine: '徽菜' },
        { name: '荠菜豆腐羹', need: [], cuisine: '徽菜' }
    ],
    japanese: [
        { name: '亲子丼（鸡肉鸡蛋盖饭）', need: ['鸡肉', '鸡蛋', '洋葱'], cuisine: '日式料理' },
        { name: '玉子烧', need: ['鸡蛋'], cuisine: '日式料理' },
        { name: '味噌汤', need: ['豆腐', '味噌', '海带'], cuisine: '日式料理' },
        { name: '照烧鸡腿饭', need: ['鸡腿', '鸡肉'], cuisine: '日式料理' },
        { name: '日式咖喱土豆鸡肉', need: ['土豆', '咖喱', '鸡肉'], cuisine: '日式料理' },
        { name: '海苔茶泡饭', need: [], cuisine: '日式料理' }
    ],
    korean: [
        { name: '韩式拌饭', need: ['米饭', '鸡蛋', '胡萝卜', '菠菜'], cuisine: '韩式料理' },
        { name: '泡菜豆腐汤', need: ['泡菜', '豆腐'], cuisine: '韩式料理' },
        { name: '韩式辣炒年糕', need: ['年糕', '辣酱'], cuisine: '韩式料理' },
        { name: '韩式烤五花', need: ['五花肉'], cuisine: '韩式料理' },
        { name: '大酱汤', need: ['豆腐', '西葫芦'], cuisine: '韩式料理' },
        { name: '紫菜包饭', need: [], cuisine: '韩式料理' }
    ],
    italian: [
        { name: '番茄肉酱意面', need: ['面条', '意面', '番茄', '猪肉'], cuisine: '意大利料理' },
        { name: '玛格丽特披萨', need: ['面粉', '番茄', '芝士'], cuisine: '意大利料理' },
        { name: '奶油蘑菇培根意面', need: ['蘑菇', '培根', '意面', '奶油'], cuisine: '意大利料理' },
        { name: '意式烤面包 Caprese', need: ['番茄', '芝士', '面包'], cuisine: '意大利料理' },
        { name: '米兰炖饭', need: ['米饭', '藏红花', '洋葱'], cuisine: '意大利料理' },
        { name: '蒜香橄榄油意面', need: [], cuisine: '意大利料理' }
    ],
    french: [
        { name: '法式煎蛋卷', need: ['鸡蛋', '黄油'], cuisine: '法国料理' },
        { name: '红酒炖鸡', need: ['鸡肉', '红酒', '蘑菇'], cuisine: '法国料理' },
        { name: '法式洋葱汤', need: ['洋葱'], cuisine: '法国料理' },
        { name: '普罗旺斯炖菜', need: ['茄子', '番茄', '西葫芦'], cuisine: '法国料理' },
        { name: '黄油煎鳕鱼', need: ['鱼', '鳕鱼', '黄油'], cuisine: '法国料理' },
        { name: '尼斯沙拉', need: [], cuisine: '法国料理' }
    ],
    indian: [
        { name: '黄油鸡（Butter Chicken）', need: ['鸡肉', '黄油', '番茄'], cuisine: '印度料理' },
        { name: '咖喱土豆炖菜', need: ['土豆', '咖喱'], cuisine: '印度料理' },
        { name: '印度香饭 Biryani', need: ['米饭', '鸡肉', '洋葱'], cuisine: '印度料理' },
        { name: '达尔扁豆汤', need: ['扁豆', '红豆', '绿豆'], cuisine: '印度料理' },
        { name: '帕拉克奶酪', need: ['菠菜', '奶酪'], cuisine: '印度料理' },
        { name: '马萨拉煎蛋', need: [], cuisine: '印度料理' }
    ],
    thai: [
        { name: '泰式冬阴功汤', need: ['虾', '柠檬', '辣椒', '蘑菇'], cuisine: '泰式料理' },
        { name: '泰式打抛猪肉饭', need: ['猪肉', '罗勒', '米饭'], cuisine: '泰式料理' },
        { name: '泰式青木瓜沙拉', need: ['木瓜', '青柠', '花生'], cuisine: '泰式料理' },
        { name: '泰式咖喱鸡', need: ['鸡肉', '咖喱', '椰奶'], cuisine: '泰式料理' },
        { name: '泰式罗勒炒海鲜', need: ['虾', '蛤蜊', '罗勒'], cuisine: '泰式料理' },
        { name: '泰式柠檬蒸蛋', need: [], cuisine: '泰式料理' }
    ],
    mexican: [
        { name: '墨西哥鸡肉卷饼', need: ['鸡肉', '面粉', '生菜'], cuisine: '墨西哥料理' },
        { name: '牛肉法希塔', need: ['牛肉', '洋葱', '青椒'], cuisine: '墨西哥料理' },
        { name: '墨西哥黑豆汤', need: ['黑豆', '番茄'], cuisine: '墨西哥料理' },
        { name: '芝士玉米片 Nachos', need: ['玉米', '芝士'], cuisine: '墨西哥料理' },
        { name: '墨西哥辣肉酱', need: ['猪肉', '牛肉', '番茄', '辣椒'], cuisine: '墨西哥料理' },
        { name: '牛油果莎莎脆饼', need: [], cuisine: '墨西哥料理' }
    ],
    custom: [{ name: '番茄炒蛋', need: ['番茄', '鸡蛋'], cuisine: '家常菜' }]
}

/** 通用简化步骤模板（按菜名生成可操作的家常做法） */
function genericSteps(dish, ingredients) {
    const main = (ingredients || []).slice(0, 4).join('、') || '冰箱现有食材'
    return [
        { step: 1, description: `准备食材：${main}。肉类切块/切片后用少许盐、料酒、淀粉抓匀腌制10分钟；蔬菜洗净切配备用。`, time: 12, temperature: '常温' },
        { step: 2, description: `热锅凉油，下葱姜蒜爆香，主料${dish.need.length ? '（' + dish.need.slice(0, 2).join('、') + '）' : ''}转大火快速翻炒至变色断生，约2-3分钟。`, time: 3, temperature: '大火' },
        { step: 3, description: '调味：加入生抽、少许盐和糖提鲜，沿锅边淋入少许热水，盖盖中小火焖2-3分钟使食材入味。', time: 3, temperature: '中小火' },
        { step: 4, description: `大火收汁，出锅前淋少许香油，撒葱花或香菜点缀。${dish.cuisine}风味的关键在于最后翻拌均匀、热气腾腾时立即装盘。`, time: 1, temperature: '大火' }
    ]
}

/** 从用户食材串中提取关键词（去掉"300g""2勺"等数量尾巴） */
function normalizeIngredients(ingredients) {
    return (ingredients || []).map(s => String(s).replace(/\s*\d+\s*(g|kg|克|千克|斤|两|勺|茶匙|汤匙|个|只|根|片|颗|段|份|ml|毫升).*$/, '').trim()).filter(Boolean)
}

/**
 * 本地兜底菜谱：按菜系与食材相关性匹配一道常见菜
 * @param {string[]} ingredients 用户提供的食材
 * @param {object} cuisine 菜系对象 { id, name }
 * @param {string} [overrideName] 指定菜名（如按菜名查询失败时，直接用用户要的菜名）
 */
function fallbackRecipe(ingredients, cuisine, overrideName) {
    const list = FALLBACK_DISHES[cuisine?.id] || FALLBACK_DISHES.custom
    const userItems = normalizeIngredients(ingredients)
    const scored = list.map(dish => ({
        dish,
        score: dish.need.filter(k => userItems.some(u => u.includes(k) || k.includes(u))).length
    }))
    // 相关性优先；同分时选门槛更低的招牌菜（need 越少越普适）
    scored.sort((a, b) => b.score - a.score || a.dish.need.length - b.dish.need.length)
    const dish = { ...scored[0].dish }
    if (overrideName) dish.name = overrideName
    return {
        id: uid('recipe-fallback'),
        name: dish.name,
        cuisine: cuisine?.name || dish.cuisine || '家常菜',
        ingredients: userItems.length
            ? [...new Set([...dish.need.flatMap(k => userItems.filter(u => u.includes(k) || k.includes(u))), ...userItems.slice(0, 5)])].slice(0, 8)
            : ['鸡蛋 2个', '番茄 2个', '葱花 适量', '盐 适量', '食用油 2勺'],
        steps: genericSteps(dish, userItems),
        cookingTime: 20,
        difficulty: 'easy',
        fallback: true,
        fallbackMessage: `AI 大师这次没能写出完整菜谱${reason ? `（${reason}）` : ''}，先为你奉上这道与你的食材、菜系相关的经典菜。可稍后重新生成，或在右上角「设置」中更换更稳定的模型服务。`,
        tips: [
            '本菜谱由本地经典菜库智能匹配（AI 服务暂时繁忙时的保底方案），食材相关性已按你的输入筛选',
            '火候与调味可按个人口味微调，新手建议全程中火避免炒糊',
            '想获得更地道的做法，稍后可重试让 AI 大师重新生成'
        ]
    }
}

module.exports = { fallbackRecipe, FALLBACK_DISHES }
