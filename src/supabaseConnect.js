import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dglguefhzheajmqahmqx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbGd1ZWZoemhlYWptcWFobXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjAzOTIsImV4cCI6MjA4ODYzNjM5Mn0.aq_LkeMjx9uiF4L-5N4OA6lXzWJ4FPTdxjBw7YrnH-Q'

export const supabase = createClient(supabaseUrl, supabaseKey)