import axios from "axios";
import cheerio from "cheerio";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

function cleanText($) {
  $("script, style, nav, footer, header").remove();
  const text = $("body").text();
  return text.replace(/\s+/g, " ").trim();
}

async function scrapePage(url) {
  try {
    const { data } = await axios.get(url, {
      timeout: 10000,
      headers: { "User-Agent": "EckoBot/1.0" }
    });

    const $ = cheerio.load(data);
    const title = $("title").text();
    const rawText = $("body").text();
    const cleanedText = cleanText($);

    return { title, rawText, cleanedText };
  } catch (err) {
    console.error("Error scraping:", url, err.message);
    return null;
  }
}

async function createRetailer(name, website) {
  const { data, error } = await supabase
    .from("retailers")
    .insert({ name, website_url: website })
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

async function storePage(retailerId, url, pageData) {
  const { error } = await supabase
    .from("retailer_pages")
    .insert({
      retailer_id: retailerId,
      url,
      title: pageData.title,
      raw_text: pageData.rawText,
      cleaned_text: pageData.cleanedText
    });

  if (error) throw error;
}

async function run() {
  const website = process.argv[2];

  if (!website) {
    console.log("Usage: node scraper.js <website_url>");
    process.exit(1);
  }

  console.log("Creating retailer...");
  const retailerId = await createRetailer("Test Retailer", website);

  console.log("Scraping homepage...");
  const page = await scrapePage(website);

  if (page) {
    console.log("Storing page...");
    await storePage(retailerId, website, page);
    console.log("Done ✅");
  } else {
    console.log("Scrape failed ❌");
  }
}

run();