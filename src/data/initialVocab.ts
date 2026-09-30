import { VocabWord } from '../types/prep';

export const INITIAL_VOCAB: VocabWord[] = [
  {
    id: 'vocab-unwind',
    word: 'unwind',
    phonetic: '/ʌnˈwaɪnd/',
    partOfSpeech: 'verb',
    meaningZh: '放松身心，解压舒缓；解开',
    definitions: [
      { pos: 'v.', meaning: '在工作或紧张活动之后放松身心、卸下紧绷' }
    ],
    usageNotes: '常用于描述“下班后卸下一天疲惫”的日常治愈语境，比单纯的 relax 更有卸下包袱、舒展身心的画面感。',
    collocations: [
      'unwind after a long day (在漫长的一天后放松)',
      'a ritual to unwind (解压的专属仪式)',
      'help somebody unwind (帮助某人舒缓压力)'
    ],
    examples: [
      {
        en: 'Cooking a quick, hot meal serves as a calming ritual to unwind after work.',
        zh: '下班后做一顿热腾腾的快手餐，是我用来舒缓身心的放松仪式。'
      }
    ],
    prepTip: '在 PREP 的 Reason 或 Example 环节表达个人情感状态转变时极其地道。',
    addedAt: Date.now() - 3600000 * 24,
    starred: true,
    mastered: false,
    contextSentence: 'cooking serves as a mindful transition that helps me unwind'
  },
  {
    id: 'vocab-mindful',
    word: 'mindful',
    phonetic: '/ˈmaɪnd.fəl/',
    partOfSpeech: 'adjective',
    meaningZh: '留神的，正念专注的；留心体会的',
    definitions: [
      { pos: 'adj.', meaning: '对当下体验保持专注觉察的；注意留心的' }
    ],
    usageNotes: '在当代生活习惯探讨中极高频，常与 eating, living, transition 搭配，指不被手机弹窗分心、专注当下的状态。',
    collocations: [
      'mindful transition (专注平缓的心理过渡)',
      'be mindful of (留心/注意某事)',
      'mindful living (正念慢生活)'
    ],
    examples: [
      {
        en: 'Spending 15 mindful minutes in the kitchen helps me disconnect from screen fatigue.',
        zh: '在厨房度过 15 分钟专注而宁静的烹饪时光，能帮我彻底摆脱屏幕疲劳。'
      }
    ],
    prepTip: '适合用于 Reason 解释为什么某个生活习惯能够提升幸福感。',
    addedAt: Date.now() - 3600000 * 12,
    starred: false,
    mastered: true,
    contextSentence: 'cooking serves as a mindful transition'
  },
  {
    id: 'vocab-tactile',
    word: 'tactile',
    phonetic: '/ˈtæk.taɪl/',
    partOfSpeech: 'adjective',
    meaningZh: '触觉的，有真实触感的',
    definitions: [
      { pos: 'adj.', meaning: '关于触觉感受的，摸得着有质感的' }
    ],
    usageNotes: '在讨论纸质书 vs Kindle、胶片相机 vs 手机摄影时常用于强调实体质感。',
    collocations: [
      'tactile experience (触觉体验/摸得到的质感)',
      'tactile feedback (触觉反馈)',
      'tactile pleasure (触摸实物带来的愉悦感)'
    ],
    examples: [
      {
        en: 'The tactile sensation of flipping crisp book pages cannot be replicated by any digital screen.',
        zh: '翻动清脆书页所带来的真实触感，是任何电子屏幕都无法复刻的。'
      }
    ],
    prepTip: '常用于 Example 环节作为生动细节描摹，增强说服力。',
    addedAt: Date.now() - 3600000 * 6,
    starred: true,
    mastered: false,
    contextSentence: 'The primary reason is the tactile experience of flipping real paper'
  }
];
