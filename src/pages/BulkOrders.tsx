import { useState, useCallback } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { type Order, type OrderItem } from '../db/db';
import { Save, Plus, Trash2, ArrowRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BulkRow {
    id: string;
    customerName: string;
    phone: string;
    altPhone: string;
    shipperName: string;   // raw text → matched to shipper
    governorate: string;   // raw text → matched to shipper rates
    address: string;
    product1: string;      // raw text → matched to product
    quantity1: string;
    product2: string;
    quantity2: string;
    product3: string;
    quantity3: string;
    deliveryDays: string;
    notes: string;
}

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMN_DEFS: { key: keyof BulkRow; label: string; width: number; hint?: string }[] = [
    { key: 'customerName', label: 'اسم العميل', width: 160 },
    { key: 'phone', label: 'الهاتف', width: 130 },
    { key: 'altPhone', label: 'رقم إضافي', width: 120 },
    { key: 'shipperName', label: 'شركة الشحن', width: 150, hint: 'اكتب اسم شركة الشحن' },
    { key: 'governorate', label: 'المحافظة', width: 130, hint: 'اكتب اسم المحافظة' },
    { key: 'address', label: 'العنوان', width: 210 },
    { key: 'product1', label: 'منتج 1', width: 170, hint: 'اكتب اسم المنتج' },
    { key: 'quantity1', label: 'ك1', width: 60 },
    { key: 'product2', label: 'منتج 2', width: 170, hint: 'اكتب اسم المنتج' },
    { key: 'quantity2', label: 'ك2', width: 60 },
    { key: 'product3', label: 'منتج 3', width: 170, hint: 'اكتب اسم المنتج' },
    { key: 'quantity3', label: 'ك3', width: 60 },
    { key: 'deliveryDays', label: 'تنبيه (يوم)', width: 90 },
    { key: 'notes', label: 'ملاحظات', width: 180 },
];

const createEmptyRow = (): BulkRow => ({
    id: crypto.randomUUID(),
    customerName: '', phone: '', altPhone: '',
    shipperName: '', governorate: '', address: '',
    product1: '', quantity1: '',
    product2: '', quantity2: '',
    product3: '', quantity3: '',
    deliveryDays: '', notes: '',
});

const INITIAL_COUNT = 25;

// ─── Fuzzy match helpers ──────────────────────────────────────────────────────

function fuzzyFind<T extends { name: string }>(list: T[], text: string): T | undefined {
    if (!text?.trim()) return undefined;
    const t = text.trim().toLowerCase();
    return (
        list.find(i => i.name.toLowerCase() === t) ||
        list.find(i => i.name.toLowerCase().includes(t)) ||
        list.find(i => t.includes(i.name.toLowerCase()))
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BulkOrders() {
    const { products, shippers, saveOrder } = useDatabase();
    const navigate = useNavigate();

    const [rows, setRows] = useState<BulkRow[]>(() =>
        Array.from({ length: INITIAL_COUNT }, createEmptyRow)
    );
    const [isSaving, setIsSaving] = useState(false);

    // ── Matching status for a row (for visual feedback) ────────────────────────

    type MatchStatus = 'ok' | 'warn' | '';

    const getMatchStatus = (text: string, list: { name: string }[]): MatchStatus => {
        if (!text) return '';
        return fuzzyFind(list, text) ? 'ok' : 'warn';
    };

    // ── Cell update ────────────────────────────────────────────────────────────

    const updateCell = useCallback((rowIdx: number, key: keyof BulkRow, value: string) => {
        setRows(prev => {
            const next = [...prev];
            next[rowIdx] = { ...next[rowIdx], [key]: value };
            if (key === 'shipperName') next[rowIdx].governorate = ''; // reset gov on shipper change
            return next;
        });
    }, []);

    // ── Paste handler: works for single-column OR full-table paste ─────────────

    const handlePaste = useCallback(
        (e: React.ClipboardEvent<HTMLInputElement>, startRow: number, colIdx: number) => {
            const text = e.clipboardData.getData('text/plain').trim();
            if (!text) return;

            const lines = text.split(/\r?\n/);
            const isMultiColumn = lines.some(l => l.includes('\t'));

            if (isMultiColumn) {
                // Full table paste (tab-separated) → fills multiple columns
                e.preventDefault();
                const parsed = lines.map(l => l.split('\t').map(v => v.trim()));
                setRows(prev => {
                    const next = [...prev];
                    parsed.forEach((pastedRow, ri) => {
                        const targetRow = startRow + ri;
                        while (next.length <= targetRow) next.push(createEmptyRow());
                        pastedRow.forEach((value, ci) => {
                            const colDef = COLUMN_DEFS[colIdx + ci];
                            if (!colDef) return;
                            next[targetRow] = { ...next[targetRow], [colDef.key]: value };
                        });
                    });
                    return next;
                });
            } else {
                // Single-column paste → fill this column vertically
                if (lines.length <= 1) return; // single value: browser handles it
                e.preventDefault();
                const colDef = COLUMN_DEFS[colIdx];
                setRows(prev => {
                    const next = [...prev];
                    lines.forEach((value, i) => {
                        const targetRow = startRow + i;
                        while (next.length <= targetRow) next.push(createEmptyRow());
                        next[targetRow] = { ...next[targetRow], [colDef.key]: value.trim() };
                    });
                    return next;
                });
            }
        },
        []
    );

    // ── Row helpers ────────────────────────────────────────────────────────────

    const isRowEmpty = (row: BulkRow) =>
        !row.customerName && !row.phone && !row.product1 && !row.product2;

    const isRowValid = (row: BulkRow) =>
        !!(row.customerName && row.phone && row.address &&
            (row.product1 || row.product2 || row.product3));

    const removeRow = (rowIdx: number) =>
        setRows(prev => prev.filter((_, i) => i !== rowIdx));

    const addRows = () =>
        setRows(prev => [...prev, ...Array.from({ length: 10 }, createEmptyRow)]);

    // ── Live total preview ─────────────────────────────────────────────────────

    const calcPreview = (row: BulkRow): string => {
        const shipper = fuzzyFind(shippers.map(s => ({ ...s, name: s.name })), row.shipperName);
        const rate = shipper?.rates.find(r =>
            r.governorate.toLowerCase() === row.governorate.toLowerCase() ||
            r.governorate.includes(row.governorate) ||
            row.governorate.includes(r.governorate)
        );
        const shippingCost = rate?.price || 0;
        const productEntries = [
            { name: row.product1, qty: Number(row.quantity1) || 0 },
            { name: row.product2, qty: Number(row.quantity2) || 0 },
            { name: row.product3, qty: Number(row.quantity3) || 0 },
        ];
        const productTotal = productEntries.reduce((sum, { name, qty }) => {
            const p = fuzzyFind(products.map(p => ({ ...p, name: p.name })), name);
            return sum + (p?.sellPrice || 0) * qty;
        }, 0);
        const total = productTotal + shippingCost;
        return total > 0 ? `${total} ج` : '';
    };

    // ── Save all ───────────────────────────────────────────────────────────────

    const handleSaveAll = async () => {
        const filledRows = rows.filter(r => !isRowEmpty(r));
        const invalid = filledRows.filter(r => !isRowValid(r));
        if (invalid.length > 0) {
            alert(`${invalid.length} صف ناقص بيانات أساسية (اسم / هاتف / عنوان / منتج واحد على الأقل).`);
            return;
        }
        setIsSaving(true);
        try {
            let saved = 0;
            for (const row of filledRows) {
                // Match shipper
                const shipper = fuzzyFind(shippers.map(s => ({ ...s, name: s.name })), row.shipperName);
                const rate = shipper?.rates.find(r =>
                    r.governorate.toLowerCase().includes(row.governorate.toLowerCase()) ||
                    row.governorate.toLowerCase().includes(r.governorate.toLowerCase())
                );
                const shippingCost = rate?.price || 0;

                // Match products
                const buildItem = (nameText: string, qty: string): OrderItem | null => {
                    if (!nameText || !qty) return null;
                    const p = fuzzyFind(products.map(p => ({ ...p, name: p.name })), nameText);
                    if (!p) return null;
                    return { productId: p.id!, quantity: Number(qty) };
                };

                const items: OrderItem[] = [
                    buildItem(row.product1, row.quantity1),
                    buildItem(row.product2, row.quantity2),
                    buildItem(row.product3, row.quantity3),
                ].filter(Boolean) as OrderItem[];

                const totalPrice = items.reduce((sum, item) => {
                    const p = products.find(p => p.id === item.productId);
                    return sum + (p?.sellPrice || 0) * item.quantity;
                }, 0) + shippingCost;

                const order: Order = {
                    id: crypto.randomUUID(),
                    customerName: row.customerName,
                    phone: row.phone,
                    altPhone: row.altPhone || undefined,
                    governorate: row.governorate,
                    address: row.address,
                    shipperId: shipper?.id || '',
                    shippingCost,
                    discount: 0,
                    totalPrice,
                    status: 'تحت المراجعة',
                    date: new Date().toISOString(),
                    items: items.length > 0 ? items : undefined,
                    deliveryDays: row.deliveryDays ? Number(row.deliveryDays) : undefined,
                    notes: row.notes || undefined,
                    updated_at: Date.now(),
                };
                await saveOrder(order);
                saved++;
            }
            alert(`✅ تم حفظ ${saved} طلب بنجاح!`);
            navigate('/orders');
        } finally {
            setIsSaving(false);
        }
    };

    // ── UI ─────────────────────────────────────────────────────────────────────

    const filledRows = rows.filter(r => !isRowEmpty(r));
    const invalidRows = filledRows.filter(r => !isRowValid(r));

    const cellStyle: React.CSSProperties = {
        width: '100%', border: 'none', padding: '5px 7px',
        fontSize: '0.8rem', backgroundColor: 'transparent',
        outline: 'none', fontFamily: 'inherit', direction: 'rtl',
    };

    const dotStyle = (status: MatchStatus): React.CSSProperties => ({
        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
        backgroundColor: status === 'ok' ? '#10b981' : status === 'warn' ? '#f59e0b' : 'transparent',
        marginLeft: 4,
    });

    const isMatchedCol = (key: keyof BulkRow) =>
        ['shipperName', 'governorate', 'product1', 'product2', 'product3'].includes(key);

    const getMatchList = (key: keyof BulkRow, row: BulkRow) => {
        if (key === 'shipperName') return shippers.map(s => ({ name: s.name }));
        if (key === 'product1' || key === 'product2' || key === 'product3')
            return products.map(p => ({ name: p.name }));
        if (key === 'governorate') {
            // Match against selected shipper's govs, or all govs
            const shipper = fuzzyFind(shippers.map(s => ({ ...s, name: s.name })), row.shipperName);
            const govs = shipper
                ? shipper.rates.map(r => ({ name: r.governorate }))
                : shippers.flatMap(s => s.rates.map(r => ({ name: r.governorate })));
            return govs;
        }
        return [];
    };

    return (
        <div style={{ paddingBottom: '6rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button onClick={() => navigate('/orders')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
                        <ArrowRight size={22} />
                    </button>
                    <h1 style={{ margin: 0 }}>أوردرات مجمعة</h1>
                    {filledRows.length > 0 && (
                        <span style={{ backgroundColor: 'var(--primary-color)', color: '#fff', borderRadius: '999px', padding: '2px 12px', fontSize: '0.8rem', fontWeight: 700 }}>
                            {filledRows.length} طلب
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-outline" onClick={addRows} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={16} /> إضافة 10 صفوف
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSaveAll}
                        disabled={isSaving || filledRows.length === 0}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Save size={16} />
                        {isSaving ? 'جارٍ الحفظ...' : `حفظ الكل (${filledRows.length})`}
                    </button>
                </div>
            </div>

            {/* Tips */}
            <div style={{ fontSize: '0.82rem', color: '#075985', marginBottom: '0.75rem', padding: '0.6rem 1rem', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', lineHeight: 1.8 }}>
                💡 <strong>الطريقة:</strong> انسخ عمود كامل من إكسيل ← Ctrl+C ← اضغط على أول خلية من العمود هنا ← Ctrl+V. كل الصفوف تتملأ تلقائياً ⬇️<br />
                🟢 نقطة خضراء = تم التطابق مع بيانات النظام &nbsp;|&nbsp; 🟡 نقطة صفراء = لم يتم التطابق
            </div>

            {/* Validation warning */}
            {invalidRows.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', marginBottom: '0.75rem', fontSize: '0.85rem', color: '#991b1b' }}>
                    <AlertCircle size={16} />
                    {invalidRows.length} صف باللون الأحمر ناقص بيانات أساسية
                </div>
            )}

            {/* Spreadsheet */}
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                <table style={{ borderCollapse: 'collapse', minWidth: '100%', tableLayout: 'fixed' }}>
                    <thead>
                        <tr>
                            <th style={{ width: 50, padding: '7px 4px', backgroundColor: '#f1f5f9', borderBottom: '2px solid var(--border-color)', fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center' }}>#</th>
                            {COLUMN_DEFS.map(col => (
                                <th key={col.key} style={{
                                    width: col.width, padding: '7px 8px',
                                    backgroundColor: '#f1f5f9',
                                    borderBottom: '2px solid var(--border-color)',
                                    borderLeft: '1px solid #e2e8f0',
                                    fontSize: '0.78rem', fontWeight: 700,
                                    textAlign: 'center', whiteSpace: 'nowrap',
                                    color: 'var(--text-primary)',
                                }}>
                                    {col.label}
                                </th>
                            ))}
                            <th style={{ width: 36, backgroundColor: '#f1f5f9', borderBottom: '2px solid var(--border-color)', borderLeft: '1px solid #e2e8f0' }} />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIdx) => {
                            const empty = isRowEmpty(row);
                            const valid = isRowValid(row);
                            const hasError = !empty && !valid;
                            const preview = !empty ? calcPreview(row) : '';

                            return (
                                <tr key={row.id} style={{
                                    backgroundColor: hasError ? '#fef2f2' : rowIdx % 2 === 0 ? '#fff' : '#fafafa',
                                }}>
                                    <td style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-secondary)', borderBottom: '1px solid #f1f5f9', padding: '2px 4px', verticalAlign: 'middle' }}>
                                        <div>{rowIdx + 1}</div>
                                        {preview && (
                                            <div style={{ color: 'var(--primary-color)', fontWeight: 700, fontSize: '0.65rem', whiteSpace: 'nowrap' }}>{preview}</div>
                                        )}
                                    </td>
                                    {COLUMN_DEFS.map((col, colIdx) => {
                                        const value = row[col.key];
                                        const matched = isMatchedCol(col.key);
                                        const list = matched ? getMatchList(col.key, row) : [];
                                        const status: MatchStatus = matched ? getMatchStatus(value, list) : '';

                                        return (
                                            <td key={col.key} style={{
                                                borderBottom: '1px solid #f1f5f9',
                                                borderLeft: '1px solid #e2e8f0',
                                                padding: 0, verticalAlign: 'middle',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', paddingLeft: matched ? 2 : 0 }}>
                                                    {matched && <span style={dotStyle(status)} />}
                                                    <input
                                                        type={col.key === 'quantity1' || col.key === 'quantity2' || col.key === 'quantity3' || col.key === 'deliveryDays' ? 'number' : 'text'}
                                                        value={value}
                                                        min={1}
                                                        onChange={e => updateCell(rowIdx, col.key, e.target.value)}
                                                        onPaste={e => handlePaste(e, rowIdx, colIdx)}
                                                        placeholder={col.hint || ''}
                                                        style={{ ...cellStyle, color: status === 'warn' ? '#b45309' : 'inherit' }}
                                                    />
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td style={{ borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #e2e8f0', textAlign: 'center', padding: '0 4px' }}>
                                        {!empty && (
                                            <button onClick={() => removeRow(rowIdx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)', padding: '4px' }}>
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center' }}>
                <button className="btn btn-outline" onClick={addRows} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <Plus size={14} /> إضافة 10 صفوف أخرى
                </button>
            </div>
        </div>
    );
}
