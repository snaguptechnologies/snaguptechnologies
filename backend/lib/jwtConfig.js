const { createClient } = require('@supabase/supabase-js');

function getJwtSecret() {
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length > 0) {
        return process.env.JWT_SECRET.trim();
    }

    if (process.env.NODE_ENV === 'production') {
        const errorMsg = "FATAL SECURITY ERROR: JWT_SECRET environment variable is missing in production environment!";
        console.error(`❌ ${errorMsg}`);
        throw new Error(errorMsg);
    }

    if (!global.__jwt_warned) {
        console.warn("⚠️ [DEV WARNING] JWT_SECRET not found in environment. Using local development secret key.");
        global.__jwt_warned = true;
    }

    return 'snagup_dev_secret_key_only_for_local_use';
}

function getSupabaseClient() {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://tukiwgxhbbaexsifscia.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey || serviceRoleKey.trim().length === 0) {
        if (!global.__supabase_warned) {
            console.warn("⚠️ [SUPABASE WARNING] SUPABASE_SERVICE_ROLE_KEY is not set. Supabase storage actions will be uninitialized.");
            global.__supabase_warned = true;
        }
        return null;
    }

    return createClient(supabaseUrl, serviceRoleKey.trim(), {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    });
}

module.exports = { getJwtSecret, getSupabaseClient };

