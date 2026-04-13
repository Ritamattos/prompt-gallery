import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || 'https://ltvtxyawxzppoyljehri.supabase.co'
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0dnR4eWF3eHpwcG95bGplaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMzk2NzgsImV4cCI6MjA5MTYxNTY3OH0.afssfVJ7eykdR1_kYJH9afNLbDtWH-fHkfIHAsH6di4'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
