export interface ConnectorGroup {
  step: 'point' | 'reason' | 'example' | 'point2';
  stepName: string;
  stepZh: string;
  description: string;
  color: string;
  borderColor: string;
  bgLight: string;
  starters: Array<{
    phrase: string;
    style: 'formal' | 'natural' | 'direct';
    chinese: string;
    example: string;
  }>;
}

export const PREP_CONNECTORS: ConnectorGroup[] = [
  {
    step: 'point',
    stepName: 'Point (P)',
    stepZh: '明确观点 / 结论先行',
    description: '开门见山，第一句话给出核心结论或立场，切忌绕弯子。',
    color: 'text-indigo-600',
    borderColor: 'border-indigo-500',
    bgLight: 'bg-indigo-50/60',
    starters: [
      {
        phrase: 'I firmly believe that...',
        style: 'direct',
        chinese: '我坚信...',
        example: 'I firmly believe that regular code reviews enhance software stability.',
      },
      {
        phrase: 'From my perspective, ...',
        style: 'natural',
        chinese: '在我看来...',
        example: 'From my perspective, asynchronous communication boosts deep work productivity.',
      },
      {
        phrase: 'The bottom line is that...',
        style: 'formal',
        chinese: '核心结论在于...',
        example: 'The bottom line is that we must prioritize user privacy above quick growth metrics.',
      },
      {
        phrase: 'In short, my stance is that...',
        style: 'direct',
        chinese: '简而言之，我的立场是...',
        example: 'In short, my stance is that investing in employee onboarding reduces annual turnover.',
      },
    ],
  },
  {
    step: 'reason',
    stepName: 'Reason (R)',
    stepZh: '解释原因 / 逻辑支撑',
    description: '说明“为什么”，给出因果逻辑链条，避免仅仅换个说法重复观点。',
    color: 'text-emerald-600',
    borderColor: 'border-emerald-500',
    bgLight: 'bg-emerald-50/60',
    starters: [
      {
        phrase: 'This is primarily because...',
        style: 'direct',
        chinese: '这主要是因为...',
        example: 'This is primarily because proactive automated tests catch regressions before production.',
      },
      {
        phrase: 'The fundamental reason is that...',
        style: 'formal',
        chinese: '根本原因在于...',
        example: 'The fundamental reason is that context-switching severely diminishes cognitive bandwidth.',
      },
      {
        phrase: 'This can be attributed to...',
        style: 'formal',
        chinese: '这可归因于...',
        example: 'This can be attributed to higher customer engagement driven by personalized onboarding.',
      },
      {
        phrase: 'Not only does it..., but it also...',
        style: 'natural',
        chinese: '不仅能...，而且还能...',
        example: 'Not only does it accelerate release cycles, but it also elevates team morale.',
      },
    ],
  },
  {
    step: 'example',
    stepName: 'Example (E)',
    stepZh: '佐证事实 / 具体案例',
    description: '给出具体事实、数据、故事或亲身经历，让抽象的观点具有画面感与说服力。',
    color: 'text-amber-600',
    borderColor: 'border-amber-500',
    bgLight: 'bg-amber-50/60',
    starters: [
      {
        phrase: 'For instance, ...',
        style: 'direct',
        chinese: '例如...',
        example: 'For instance, when our engineering team adopted automated linting, bug reports dropped by 30%.',
      },
      {
        phrase: 'A prime example of this is...',
        style: 'formal',
        chinese: '一个绝佳的例证是...',
        example: 'A prime example of this is how Shopify streamlined their internal meetings to protect maker time.',
      },
      {
        phrase: 'In my personal experience, ...',
        style: 'natural',
        chinese: '以我个人的经历来看...',
        example: 'In my personal experience, dedicating the first hour of every morning to writing yielded substantial breakthroughs.',
      },
      {
        phrase: 'To illustrate, consider the case of...',
        style: 'formal',
        chinese: '为了说明这一点，不妨看看...的例子',
        example: 'To illustrate, consider the case of remote-first companies expanding their global talent pool.',
      },
    ],
  },
  {
    step: 'point2',
    stepName: 'Point (P2)',
    stepZh: '重申升华 / 行动呼吁',
    description: '前后呼应，用不同句式升华观点，或提出具体行动倡议（Call to Action）。',
    color: 'text-blue-600',
    borderColor: 'border-blue-500',
    bgLight: 'bg-blue-50/60',
    starters: [
      {
        phrase: 'Therefore, it is evident that...',
        style: 'formal',
        chinese: '因此，显而易见的是...',
        example: 'Therefore, it is evident that continuous learning is the most resilient career safeguard.',
      },
      {
        phrase: 'That is why I strongly recommend...',
        style: 'direct',
        chinese: '这就是为什么我强烈建议...',
        example: 'That is why I strongly recommend standardizing weekly asynchronous project updates.',
      },
      {
        phrase: 'Ultimately, ...',
        style: 'formal',
        chinese: '归根结底...',
        example: 'Ultimately, clear communication creates alignment far more effectively than micromanagement.',
      },
      {
        phrase: 'In conclusion, by doing so, we can...',
        style: 'natural',
        chinese: '总而言之，通过这样做，我们能够...',
        example: 'In conclusion, by doing so, we can ensure both product quality and sustainable team velocity.',
      },
    ],
  },
];
