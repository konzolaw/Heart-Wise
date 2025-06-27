import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const topics = [
  'love', 'relationships', 'marriage', 'faith', 'trust', 'patience', 
  'forgiveness', 'wisdom', 'guidance', 'hope', 'commitment', 'purity',
  'communication', 'understanding', 'respect', 'honor', 'devotion', 'unity'
];

const biblicalVerses = [
  { verse: "Above all else, guard your heart, for everything you do flows from it.", reference: "Proverbs 4:23", topic: "love" },
  { verse: "Two are better than one, because they have a good return for their labor.", reference: "Ecclesiastes 4:9", topic: "relationships" },
  { verse: "Therefore what God has joined together, let no one separate.", reference: "Mark 10:9", topic: "marriage" },
  { verse: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.", reference: "1 Corinthians 13:4", topic: "love" },
  { verse: "Trust in the Lord with all your heart and lean not on your own understanding.", reference: "Proverbs 3:5", topic: "trust" },
  { verse: "Be completely humble and gentle; be patient, bearing with one another in love.", reference: "Ephesians 4:2", topic: "patience" },
  { verse: "If we confess our sins, he is faithful and just and will forgive us our sins.", reference: "1 John 1:9", topic: "forgiveness" },
  { verse: "If any of you lacks wisdom, you should ask God, who gives generously to all.", reference: "James 1:5", topic: "wisdom" },
  { verse: "For I know the plans I have for you, declares the Lord, plans to prosper you.", reference: "Jeremiah 29:11", topic: "guidance" },
  { verse: "And we know that in all things God works for the good of those who love him.", reference: "Romans 8:28", topic: "hope" },
  { verse: "Husbands, love your wives, just as Christ loved the church.", reference: "Ephesians 5:25", topic: "marriage" },
  { verse: "A friend loves at all times, and a brother is born for a time of adversity.", reference: "Proverbs 17:17", topic: "relationships" },
  { verse: "Let all that you do be done in love.", reference: "1 Corinthians 16:14", topic: "love" },
  { verse: "Be kind to one another, tenderhearted, forgiving one another.", reference: "Ephesians 4:32", topic: "forgiveness" },
  { verse: "The heart of man plans his way, but the Lord establishes his steps.", reference: "Proverbs 16:9", topic: "guidance" }
];

async function generateAIVerse(topic?: string) {
  const selectedTopic = topic || topics[Math.floor(Math.random() * topics.length)];
  
  // Find verses related to the topic
  const relevantVerses = biblicalVerses.filter(v => v.topic === selectedTopic);
  const selectedVerse = relevantVerses.length > 0 
    ? relevantVerses[Math.floor(Math.random() * relevantVerses.length)]
    : biblicalVerses[Math.floor(Math.random() * biblicalVerses.length)];

  // Generate enhanced AI reflection based on topic and verse
  const reflections = [
    `In the context of ${selectedTopic}, this verse reminds us that God's design for relationships requires us to center our hearts on Him first. When we guard our hearts according to Scripture, we create space for healthy, God-honoring connections.`,
    `As we navigate dating and relationships, ${selectedTopic} becomes our compass. This scripture encourages us to approach every interaction with intentionality, seeking God's wisdom in all we do.`,
    `Biblical dating means allowing ${selectedTopic} to shape our choices. This verse calls us to higher standards - not just finding someone who makes us happy, but someone who helps us grow closer to Christ.`,
    `God's word teaches that ${selectedTopic} is foundational to lasting love. In our journey toward marriage, let this verse guide how we treat others and ourselves with dignity and respect.`,
    `True ${selectedTopic} in relationships reflects God's character. This scripture reminds us that our dating lives should be testimonies of Christ's love - patient, kind, and selfless.`,
    `When we practice ${selectedTopic} in our relationships, we honor the One who designed love itself. May this verse inspire you to seek relationships that glorify God and build His kingdom.`,
    `Dating with ${selectedTopic} means trusting God's timing and plan. This verse encourages us to wait well, grow in faith, and prepare our hearts for the spouse God may have for us.`,
    `In a culture that often misunderstands love, ${selectedTopic} anchored in Scripture sets us apart. Let this verse be a beacon as you pursue relationships that reflect Christ's love for the church.`
  ];

  const selectedReflection = reflections[Math.floor(Math.random() * reflections.length)];

  return {
    verse: selectedVerse.verse,
    reference: selectedVerse.reference,
    reflection: selectedReflection,
    topic: selectedTopic,
    isAIGenerated: true
  };
}

export const getAIGeneratedVerse = query({
  args: { refreshKey: v.optional(v.number()) },
  handler: async (ctx, _args) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMinute = Math.floor(Date.now() / (1000 * 60)); // Changes every minute
    const minuteKey = `${today}-${currentMinute}`;
    
    // First, check if we have a verse for this specific minute
    let verse = await ctx.db
      .query("dailyVerses")
      .withIndex("by_minute_key", (q) => q.eq("minuteKey", minuteKey))
      .first();

    // If no verse for this minute, get the most recent verse for today
    if (!verse) {
      verse = await ctx.db
        .query("dailyVerses")
        .withIndex("by_date", (q) => q.eq("date", today))
        .order("desc")
        .first();
    }

    return verse;
  },
});

export const generateVerseForCurrentMinute = mutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0];
    const currentMinute = Math.floor(Date.now() / (1000 * 60));
    const minuteKey = `${today}-${currentMinute}`;
    
    // Check if verse already exists for this minute
    const existingVerse = await ctx.db
      .query("dailyVerses")
      .withIndex("by_minute_key", (q) => q.eq("minuteKey", minuteKey))
      .first();
    
    if (existingVerse) {
      return existingVerse;
    }
    
    const aiVerse = await generateAIVerse();
    const verseId = await ctx.db.insert("dailyVerses", {
      verse: aiVerse.verse,
      reference: aiVerse.reference,
      reflection: aiVerse.reflection,
      date: today,
      isAIGenerated: true,
      topic: aiVerse.topic,
      minuteKey: minuteKey,
      lastUpdated: Date.now()
    });
    
    return await ctx.db.get(verseId);
  },
});

export const generateNewVerse = mutation({
  args: { topic: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    const currentMinute = Math.floor(Date.now() / (1000 * 60));
    const minuteKey = `${today}-${currentMinute}-manual`;
    const topic = args.topic || topics[Math.floor(Math.random() * topics.length)];
    
    const aiVerse = await generateAIVerse(topic);
    
    const verseId = await ctx.db.insert("dailyVerses", {
      verse: aiVerse.verse,
      reference: aiVerse.reference,
      reflection: aiVerse.reflection,
      date: today,
      isAIGenerated: true,
      topic: topic,
      minuteKey: minuteKey,
      lastUpdated: Date.now()
    });

    return await ctx.db.get(verseId);
  },
});

export const getTodaysVerse = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0];
    
    const verse = await ctx.db
      .query("dailyVerses")
      .withIndex("by_date", (q) => q.eq("date", today))
      .order("desc")
      .first();

    return verse;
  },
});
