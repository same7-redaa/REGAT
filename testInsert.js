const supabaseUrl = 'https://rwazejunftbzgkutioxw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3YXplanVuZnRiemdrdXRpb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTg4MTksImV4cCI6MjA4NzM3NDgxOX0.XcyF47nGz1vAIeu0vAccFp_4BEuZfakDs4kaUaOVae0';

async function testInsert() {
    const url = `${supabaseUrl}/rest/v1/products`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            id: 'e6a8276f-1234-4299-add3-8de798dc85b1',
            name: "Test Fix 3",
            purchaseprice: 10,
            sellprice: 20,
            stock: 5,
            is_deleted: false,
            updated_at: Date.now()
        })
    });
    const data = await response.json();
    console.log(response.status, JSON.stringify(data, null, 2));
}

testInsert();
