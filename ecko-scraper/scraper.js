import axios from "axios";
import cheerio from "cheerio";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Basic cleaner
function cleanText($) {
  $("script, style, nav, footer, header").remove();
  const text = $("body").text();
  return text.replace(/\s+/g, " ").trim();
}

async function scrapePage(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const title = $("title").text();
    const rawText = $("body").text();
    const cleanedText = cleanText($);

    return { title, rawText, cleanedText };
  } catch (err) {
    console.error("Error scraping:", url);
    return null;
  }
}

async function storePage(retailerId, url, pageData) {
  await supabase.from("retailer_pages").insert({
    retailer_id: retailerId,
    url,
    title: pageData.title,
    raw_text: pageData.rawText,
    cleaned_text: pageData.cleanedText
  });
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

async function run() {
  const website = "https://example.com"; // toy site
  const retailerId = await createRetailer("Example Retailer", website);

  const page = await scrapePage(website);
  if (page) {
    await storePage(retailerId, website, page);
    console.log("Stored successfully");
  }
}

run();