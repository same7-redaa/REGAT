/**
 * Fields passed through unchanged to/from Supabase
 */
const PASSTHROUGH_KEYS = new Set(['id', 'is_deleted', 'updated_at']);

/**
 * Convert object keys to all-lowercase (matching Supabase auto-lowercase schema)
 * Array values (like 'rates', 'statusHistory') are serialized to JSON strings.
 */
export function mapToSupabase(obj: any): any {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;

    const newObj: any = {};
    for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

        const supaKey = PASSTHROUGH_KEYS.has(key) ? key : key.toLowerCase();
        const val = obj[key];
        // Serialize nested arrays/objects (like rates, statusHistory) as JSON strings
        newObj[supaKey] = (val !== null && val !== undefined && typeof val === 'object')
            ? JSON.stringify(val)
            : val;
    }
    return newObj;
}

/**
 * Convert Supabase all-lowercase keys back to camelCase local schema.
 */
const SUPABASE_TO_LOCAL: Record<string, string> = {
    purchaseprice: 'purchasePrice',
    sellprice: 'sellPrice',
    customername: 'customerName',
    altphone: 'altPhone',
    productid: 'productId',
    totalprice: 'totalPrice',
    shipperid: 'shipperId',
    shippingcost: 'shippingCost',
    shipdate: 'shipDate',
    statushistory: 'statusHistory',
    returncost: 'returnCost',
    store_name: 'storeName',
    notification_rules: 'notificationRules',
};

export function mapFromSupabase(obj: any): any {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;

    const newObj: any = {};
    for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

        const localKey = SUPABASE_TO_LOCAL[key] ?? key;
        const val = obj[key];
        // Deserialize JSON strings back to objects/arrays
        if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
            try { newObj[localKey] = JSON.parse(val); } catch { newObj[localKey] = val; }
        } else {
            newObj[localKey] = val;
        }
    }
    return newObj;
}
