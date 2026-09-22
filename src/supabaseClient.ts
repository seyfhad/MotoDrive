import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'رابط_المشروع_هنا';
const supabaseKey = 'المفتاح_العام_هنا';

export const supabase = createClient(supabaseUrl, supabaseKey);
