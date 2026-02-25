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

        // Skip stockThreshold temporarily if the database doesn't have it, or map it properly.
        // We will map it to stock_threshold so it is standard.
        let supaKey = PASSTHROUGH_KEYS.has(key) ? key : key.toLowerCase();

        // Manual override for specific camelCase properties to snake_case in Supabase
        if (key === 'stockThreshold') supaKey = 'stock_threshold';

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
    stock_threshold: 'stockThreshold',
    deliverydays: 'deliveryDays',
    printcount: 'printCount',
    deliveredquantity: 'deliveredQuantity',
    returnedquantity: 'returnedQuantity',
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
