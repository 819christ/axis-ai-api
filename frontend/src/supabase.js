import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oahduqmmqiwdldsqmzhv.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haGR1cW1tcWl3ZGxkc3Ftemh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMDg0OTcsImV4cCI6MjEwNjY4NDQ5N30.iWXknFIutPZiJX0O5zH4qWIqD20vnB_j9-Mb6TTy9D8';

export const supabase = createClient(supabaseUrl, supabaseKey);
