const fallbackCopies: Record<string, Record<string, string[]>> = {
  wedding: {
    "zh-CN": [
      "我们诚挚邀请您参加我们的婚礼,共同见证我们的幸福时刻。",
      "爱情长跑多年,今日终于修成正果。诚邀您莅临,分享我们的喜悦!",
      "执子之手,与子偕老。我们将在{date}举行婚礼,期待您的到来。",
    ],
    en: [
      "We joyfully invite you to celebrate our wedding and share in our happiness.",
      "After years of love, we are finally tying the knot. Please join us on our special day!",
      "Together with our families, we invite you to our wedding celebration.",
    ],
  },
  birthday: {
    "zh-CN": [
      "诚邀您来参加生日派对,一起吃蛋糕、聊天,把快乐留在今晚。",
      "又长大一岁,也多了一份值得庆祝的幸福。期待和你一起吹蜡烛!",
      "准备好笑声和好心情,我们在{date}等你来一起庆祝。",
    ],
    en: [
      "Join us for cake, good company, and a birthday worth remembering.",
      "Another year, another reason to celebrate. We would love to have you with us!",
      "Bring your best stories and brightest spirit. We will celebrate together on {date}.",
    ],
  },
  business: {
    "zh-CN": [
      "诚邀您参加本次活动,与行业伙伴交流想法,共同探索下一步可能。",
      "让我们在{date}相聚,分享经验,建立连接,为新的合作打开空间。",
      "期待与您面对面交流趋势、实践与未来,现场见。",
    ],
    en: [
      "Join us for an evening of thoughtful conversation, useful connections, and new ideas.",
      "On {date}, we will gather to share practical insight and make room for what comes next.",
      "Meet peers, exchange perspective, and leave with a clearer view of the future.",
    ],
  },
  baby: {
    "zh-CN": [
      "带着满心欢喜,我们邀请您一起迎接这个可爱的新生命。",
      "小小的手,大大的幸福。期待与您分享我们的喜悦与祝福。",
      "请在{date}来和我们一起庆祝这份珍贵的相遇。",
    ],
    en: [
      "With full hearts, we invite you to celebrate the arrival of our newest little love.",
      "Tiny hands, enormous joy. Please join us as we share this beautiful beginning.",
      "Come celebrate this precious new chapter with us on {date}.",
    ],
  },
  other: {
    "zh-CN": [
      "诚邀您来参加这场特别的聚会,和我们一起把这一刻过得热热闹闹。",
      "有你在,平凡的日子也值得庆祝。期待与您相聚,分享好时光。",
      "我们将在{date}相见,带上你的故事和笑容,其余交给这场相聚。",
    ],
    en: [
      "Please join us for a gathering made special by the people around the table.",
      "Some moments deserve a celebration. We would love to share this one with you.",
      "Bring a story and a smile. We will take care of the rest when we meet on {date}.",
    ],
  },
};

export function getFallbackCopy(scene: string, locale: string, date?: string) {
  const localized = fallbackCopies[scene]?.[locale] ?? fallbackCopies[scene]?.en ?? fallbackCopies.other.en;
  return localized.map((copy) => copy.replaceAll("{date}", date || "the day"));
}
