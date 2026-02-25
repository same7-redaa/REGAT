import { useState } from 'react';
import { createPortal } from 'react-dom';
import { type Shipper } from '../db/db';
import { Edit2, Trash2, Plus, PlusCircle, MinusCircle, Search, ArrowRight, Filter } from 'lucide-react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAlert } from '../contexts/AlertContext';

export default function Shippers() {
    const { shippers, saveShipper, deleteShipper } = useDatabase();
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [editingShipper, setEditingShipper] = useState<Shipper | null>(null);
    const [viewShipper, setViewShipper] = useState<Shipper | null>(null);
    const { showAlert } = useAlert();

    const [formData, setFormData] = useState<Shipper>({
        id: '',
        name: '',
        rates: [{ governorate: 'القاهرة والجيزة', price: 0 }]
    });

    const openForm = (shipper?: Shipper) => {
        if (shipper) {
            setEditingShipper(shipper);
            setFormData(shipper);
        } else {
            setEditingShipper(null);
            setFormData({
                id: '',
                name: '',
                rates: [{ governorate: '', price: 0 }]
            });
        }
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingShipper(null);
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            saveShipper(formData).catch(console.error);
        } finally {
            setIsSaving(false);
            closeForm();
        }
    };

    const handleDelete = async (id?: string) => {
        if (!id) return;
        showAlert({
            title: 'تأكيد الحذف',
            message: 'هل أنت متأكد من حذف شركة الشحن نهائياً؟',
            type: 'confirm',
            confirmText: 'حذف',
            onConfirm: async () => {
                await deleteShipper(id);
            }
        });
    };

    const addRateRow = () => {
        setFormData({ ...formData, rates: [...formData.rates, { governorate: '', price: 0 }] });
    };

    const removeRateRow = (index: number) => {
        const newRates = [...formData.rates];
        newRates.splice(index, 1);
        setFormData({ ...formData, rates: newRates });
    };

    const updateRate = (index: number, field: 'governorate' | 'price' | 'discount', value: string | number) => {
        const newRates = [...formData.rates];
        newRates[index] = { ...newRates[index], [field]: value };
        setFormData({ ...formData, rates: newRates });
    };

    const filteredShippers = shippers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isFormOpen) {
        return (
            <div>
                {/* Header Back Button Portal for Mobile */}
                {document.getElementById('header-back-button') && createPortal(
                    <button onClick={closeForm} style={{ color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <ArrowRight size={24} />
                    </button>,
                    document.getElementById('header-back-button')!
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h1 style={{ margin: 0 }}>{editingShipper ? `تعديل شركة ${editingShipper.name}` : 'إضافة شركة شحن جديدة'}</h1>
                </div>

                <div className="card">
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="form-grid">
                            <div>
                                <label>اسم شركة الشحن</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <label style={{ margin: 0 }}>أسعار الشحن والمحافظات المدعومة</label>
                                <button
                                    type="button"
                                    className="btn-outline"
                                    onClick={addRateRow}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                                >
                                    <PlusCircle size={16} /> إضافة محافظة
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                {formData.rates.map((rate, index) => (
                                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'flex-end' }}>
                                        <div>
                                            {index === 0 && <label>المحافظة / المنطقة</label>}
                                            <input
                                                type="text"
                                                required
                                                placeholder="مثال: القاهرة"
                                                value={rate.governorate}
                                                onChange={(e) => updateRate(index, 'governorate', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            {index === 0 && <label>سعر الشحن الفعلي (ج.م)</label>}
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                placeholder="75"
                                                value={rate.price === 0 ? '' : rate.price}
                                                onChange={(e) => updateRate(index, 'price', Number(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            {index === 0 && (
                                                <label title="الفرق بين ما تدفعه للشركة وما يدفعه العميل">
                                                    خصم الشحن (ج.م) 💡
                                                </label>
                                            )}
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                value={rate.discount === undefined || rate.discount === 0 ? '' : rate.discount}
                                                onChange={(e) => updateRate(index, 'discount', Number(e.target.value))}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="btn-outline"
                                            onClick={() => removeRateRow(index)}
                                            disabled={formData.rates.length === 1}
                                            style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)', padding: '0.75rem', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: index === 0 ? '1.5rem' : 0 }}
                                        >
                                            <MinusCircle size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button type="button" className="btn btn-outline" onClick={closeForm}>
                                إلغاء
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ padding: '0.6rem 2rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {isSaving ? (
                                    <>
                                        <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                                        جاري الحفظ...
                                    </>
                                ) : (
                                    'حفظ بيانات شركة الشحن'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-outline" style={{ color: 'var(--text-secondary)' }} onClick={() => setIsFilterOpen(!isFilterOpen)}>
                        <Filter size={18} /> {isFilterOpen ? 'إخفاء البحث' : 'بحث'}
                    </button>
                    <button className="btn btn-primary" onClick={() => openForm()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> إضافة شركة
                    </button>
                </div>
            </div>

            {isFilterOpen && (
                <div className="card" style={{ marginBottom: '1.5rem', animation: 'fadeIn 0.2s ease-out' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            className="input"
                            placeholder="ابحث باسم شركة الشحن..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingRight: '2.5rem' }}
                        />
                    </div>
                </div>
            )}
            <div className="card table-responsive hidden-mobile">
                <table style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>الشركة</th>
                            <th>أسعار المحافظات</th>
                            <th style={{ textAlign: 'center' }}>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredShippers.map((shipper) => (
                            <tr key={shipper.id} onClick={(e) => {
                                if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.badge')) return;
                                setViewShipper(shipper);
                            }} style={{ cursor: 'pointer' }}>
                                <td style={{ fontWeight: 600 }}>{shipper.name}</td>
                                <td>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                                        {(() => {
                                            const prices = shipper.rates.map(r => r.price);
                                            const minPrice = Math.min(...prices);
                                            const maxPrice = Math.max(...prices);

                                            return (
                                                <span className="badge badge-info" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                                                    {minPrice === maxPrice ? `${minPrice} ج.م` : `${minPrice} - ${maxPrice} ج.م`}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <div className="flex items-center gap-2" style={{ justifyContent: 'center' }}>
                                        <button
                                            className="btn-outline"
                                            style={{ padding: '0.4rem', border: 'none', color: 'var(--danger-color)' }}
                                            onClick={() => handleDelete(shipper.id)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredShippers.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    لا توجد شركات شحن مطابقة للبحث
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile View */}
            <div className="hidden-desktop">
                {
                    filteredShippers.map((shipper) => {
                        const prices = shipper.rates.map(r => r.price);
                        const minPrice = Math.min(...prices);
                        const maxPrice = Math.max(...prices);
                        const priceText = minPrice === maxPrice ? `${minPrice} ج.م` : `${minPrice} - ${maxPrice} ج.م`;

                        return (
                            <div key={shipper.id} className="mobile-card" onClick={(e) => {
                                if ((e.target as HTMLElement).closest('.badge')) return;
                                setViewShipper(shipper);
                            }}>
                                <div className="mobile-card-header">
                                    <span>{shipper.name}</span>
                                    <span className="badge badge-info">{shipper.rates.length} مناطق</span>
                                </div>
                                <div className="mobile-card-row">
                                    <span>نطاق الأسعار:</span>
                                    <strong style={{ color: 'var(--primary-color)' }}>{priceText}</strong>
                                </div>
                            </div>
                        );
                    })
                }
                {
                    filteredShippers.length === 0 && (
                        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            لا توجد شركات شحن مطابقة للبحث
                        </div>
                    )
                }
            </div>

            {/* View Details Modal */}
            {
                viewShipper && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '500px', width: '100%', padding: '0', overflow: 'hidden' }}>
                            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>تفاصيل شركة الشحن</h2>
                                <span className="badge badge-info" style={{ fontSize: '0.9rem' }}>
                                    التغطية: {viewShipper.rates.length} مناطق
                                </span>
                            </div>
                            <div style={{ padding: '1.5rem' }}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>اسم الشركة:</span>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{viewShipper.name}</div>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>تسعيرة الشحن (مجمعة حسب السعر):</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                        {Object.entries(
                                            viewShipper.rates.reduce((acc, rate) => {
                                                if (!acc[rate.price]) acc[rate.price] = [];
                                                acc[rate.price].push(rate.governorate);
                                                return acc;
                                            }, {} as Record<number, string[]>)
                                        )
                                            .sort((a, b) => Number(a[0]) - Number(b[0]))
                                            .map(([price, govs]) => (
                                                <div key={price} style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px dashed var(--border-color)' }}>
                                                        <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>المحافظات والمناطق ({govs.length})</div>
                                                        <div style={{ color: 'var(--danger-color)', fontWeight: 800, fontSize: '1.25rem' }}>{price} ج.م</div>
                                                    </div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                        {govs.map(g => (
                                                            <span key={g} className="badge" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 500, padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                                                {g}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setViewShipper(null)}>
                                        إغلاق
                                    </button>
                                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                                        const s = viewShipper;
                                        setViewShipper(null);
                                        openForm(s);
                                    }}>
                                        <Edit2 size={18} />
                                        تعديل البيانات
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
