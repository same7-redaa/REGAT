import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rwazejunftbzgkutioxw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3YXplanVuZnRiemdrdXRpb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTg4MTksImV4cCI6MjA4NzM3NDgxOX0.XcyF47nGz1vAIeu0vAccFp_4BEuZfakDs4kaUaOVae0';

export const supabase = createClient(supabaseUrl, supabaseKey);
