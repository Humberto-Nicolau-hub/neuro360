import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qodzwxgabuadsnplcscl.supabase.co";
const supabaseKey = "sb_publishable_JGrrfcfRg8fko94mFIGpyQ_mDmSxo5K";

export const supabase = createClient(supabaseUrl, supabaseKey);
