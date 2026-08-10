import { supabase } from "./supabase";

const testSupabase = async () => {
  const { data, error } = await supabase
    .from("price_master")
    .select("*");

  console.log("Supabase Data:", data);
  console.log("Supabase Error:", error);
};

testSupabase();