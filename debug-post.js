// Simple debug script to test post fetching
const { fetchPostData } = require('./lib/server-actions.ts');

async function testUrls() {
  const urls = [
    'https://floss.social/@cjpaloma@mas.to/114897897577249443', // Working URL
    'https://mastodon.art/@hbtyson/114894668769042423',        // Not working URL  
    'https://floss.social/@hbtyson@mastodon.art/114894668953797190' // Not working URL
  ];

  for (const url of urls) {
    console.log(`\n=== Testing: ${url} ===`);
    try {
      const result = await fetchPostData(url);
      if (result) {
        console.log(`✅ Success: Found post by ${result.author.name}`);
      } else {
        console.log(`❌ Failed: No data returned`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

testUrls().catch(console.error);
