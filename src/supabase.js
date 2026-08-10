import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dbdveedxfmyxmdbamyxn.supabase.co";

const supabaseAnonKey = "sb_publishable_DS7ARxxun2ZvteNVa4mI9Q_caQBmFGZ";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);