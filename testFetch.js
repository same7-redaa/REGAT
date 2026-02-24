const supabaseUrl = 'https://rwazejunftbzgkutioxw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3YXplanVuZnRiemdrdXRpb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTg4MTksImV4cCI6MjA4NzM3NDgxOX0.XcyF47nGz1vAIeu0vAccFp_4BEuZfakDs4kaUaOVae0';

async function fetchProducts() {
    const url = `${supabaseUrl}/rest/v1/products?select=*&order=updated_at.desc&limit=5`;
    const response = await fetch(url, {
        headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`
        }
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}

fetchProducts();
