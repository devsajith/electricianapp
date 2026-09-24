import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing Supabase URL or Key");
  process.exit(1);
}

const supabase = createClient(url, key);

async function testLabourTables() {
  const tableCandidates = ["labours", "labour", "labourers", "workers", "crew"];
  for (const tableName of tableCandidates) {
    const { data, error } = await supabase.from(tableName).select("*").limit(1);
    if (error) {
      console.log(`Table '${tableName}': ERROR ->`, error.code, error.message);
    } else {
      console.log(`Table '${tableName}': SUCCESS ->`, data);
    }
  }
}

testLabourTables();
