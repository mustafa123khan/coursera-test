const SUPABASE_URL = "https://brnquiknufjdosadrskr.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_IA5Pr6v8cHdmKORMvL7IGQ_n1P8mWbY";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);