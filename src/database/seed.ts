import pool from '../config/db';

console.log('🚀 Script started');

async function insertRawFeed(source: string, rawText: string) {
  console.log(`📝 Attempting insert: ${source}`); // <-- LOG
  const query = `
    INSERT INTO raw_feeds (source, raw_text, captured_at)
    VALUES ($1, $2, NOW())
    RETURNING id;
  `;
  const values = [source, rawText];
  try {
    const result = await pool.query(query, values);
    console.log(`✅ Inserted feed id ${result.rows[0].id}`);
    return result.rows[0].id;
  } catch (err) {
    console.error('❌ Insert error:', err);
    throw err;
  }
}

async function seedRawFeeds() {
  console.log('🌱 Seeding raw_feeds with messy marketplace data...');
  
  const messyPosts = [
    {
      source: 'telegram',
      text: `📱 ልዩ ቅናሽ! አዲስ ሳምሰንግ ጋላክሲ S23 ኡልትራ 512GB - ዋጋ 85,000 ብር ብቻ! ድርድር አለ። ይደውሉልኝ 09XX-XXX-XXX ወይም ቴሌግራም @fastdealer123 #ሳምሰንግ #ኢትዮጵያ`,
    },
    {
      source: 'telegram',
      text: `For sale: iPhone 14 Pro Max 256GB gold, used 3 months, scratch on back glass. Price 120k birr negotiable. DM me @tech_reseller. Also have AirPods Pro 20k.`,
    },
    {
      source: 'tiktok_bio',
      text: `🚗💨 Toyota Corolla 2019 model, low km, price betam konjo! le broker 1.4M birr. Tilik adres: Bole behind Dembel. Call 0911XXXXXX`,
    },
    {
      source: 'telegram',
      text: `ሹርባ ቲሸርት ለወንድ - አዲስ ነው 350 ብር ብቻ። ቀለም ጥቁር / ነጭ / ሰማያዊ። በርካታ መጠኖች አሉ። ፎቶ ለማየት @habesha_fashion_bot`,
    },
    {
      source: 'telegram',
      text: `ከባድ ዋጋ ጨምሯል። የነበረው 15k አሁን 23k። ማን ገዛ? አሁንም ርካሽ ነው! አንድ ሳምንት ቀርቶ 30k ይሆናል። አይታመኑም? ይጠይቁኝ @inflationsurfer`,
    },
    {
      source: 'tiktok_bio',
      text: `✨ brand new MacBook Air M2 16GB/512GB – sealed, original warranty. Selling because leaving country. 220k birr. Serious buyers only, no lowball. TG: @mac_ethio`,
    },
    {
      source: 'telegram',
      text: `betam erash sale! laptop lenova thinkpad i7 generation 10, ram 16gb ssd512, 45k birr. yemewsed ale. pics in channel t.me/tech_deals_eth`,
    },
    {
      source: 'telegram',
      text: `ውድ የሆነ የሴቶች ሻንጣ (handbag) ኦሪጅናል ነው። ዋጋ 8,500 ብር (ድርድር የለም)። ማንነቱ የሚታወቅ ሻጭ ነኝ። የምትፈልጉ @quality_bags`,
    },
    {
      source: 'telegram',
      text: `🔥 URGENT: Samsung A54 5G 128GB, used 1 week, original box & charger. Price 32,000 birr. Reason: need cash for medical. Location: Adama, can send via Shemu.`,
    },
    {
      source: 'tiktok_bio',
      text: `ሽያጭ ላይ ናቸው ልብሶች - ልጆች እና አዋቂዎች። ከ 200 ብር ጀምሮ። ጥራት ዋስትና አለው። ቴሌግራም ቻናል @cheap_clothes_eth`,
    },
  ];

  for (const post of messyPosts) {
    await insertRawFeed(post.source, post.text);
  }

  console.log('🎉 Seeding finished!');
  process.exit(0);
}

// Run with detailed error logging
seedRawFeeds().catch((err) => {
  console.error('💥 Fatal error during seeding:', err);
  process.exit(1);
});