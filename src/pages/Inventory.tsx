import { PackageSearch, Edit2, Trash2, Plus, Search, ArrowRight, Filter } from 'lucide-react';
import { createPortal } from 'react-dom';
import { type Product } from '../db/db';
import { useState } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAlert } from '../contexts/AlertContext';

export default function Inventory() {
    const { products, saveProduct, deleteProduct } = useDatabase();
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [viewProduct, setViewProduct] = useState<Product | null>(null);
    const { showAlert } = useAlert();

    const [formData, setFormData] = useState<Product>({
        id: '',
        name: '',
        purchasePrice: 0,
        sellPrice: 0,
        stock: 0,
    });

    const openForm = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData(product);
        } else {
            setEditingProduct(null);
            setFormData({ id: '', name: '', purchasePrice: 0, sellPrice: 0, stock: 0 });
        }
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingProduct(null);
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            saveProduct(formData).catch(console.error);
        } finally {
            setIsSaving(false);
            closeForm();
        }
    };

    const handleDelete = async (id?: string) => {
        if (!id) return;
        showAlert({
            title: 'تأكيد الحذف',
            message: 'هل أنت متأكد من حذف هذا المنتج نهائياً؟',
            type: 'confirm',
            confirmText: 'حذف',
            onConfirm: async () => {
                await deleteProduct(id);
            }
        });
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                    <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <PackageSearch size={28} color="var(--primary-color)" />
                        {editingProduct ? 'تعديل منتج' : 'إضافة منتج جديد'}
                    </h1>
                </div>

                <div className="card">
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label>اسم المنتج</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="مثال: ساعة سكيمي الذهبية"
                            />
                        </div>

                        <div className="form-grid">
                            <div>
                                <label>سعر الشراء (ج.م)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.purchasePrice || ''}
                                    onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label>سعر البيع (ج.م)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.sellPrice || ''}
                                    onChange={(e) => setFormData({ ...formData, sellPrice: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div>
                            <label>الكمية المتوفرة (المخزون)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.stock || ''}
                                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                حد إشعار المخزون
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>(اختياري — تنبيه عند الوصول لهذه الكمية)</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.stockThreshold ?? ''}
                                onChange={(e) => setFormData({ ...formData, stockThreshold: e.target.value === '' ? undefined : Number(e.target.value) })}
                                placeholder="مثال: 5"
                            />
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
                                    'حفظ المنتج'
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
                        <Plus size={18} /> إضافة منتج
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
                            placeholder="ابحث باسم المنتج..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingRight: '2.5rem' }}
                        />
                    </div>
                </div>
            )}

            <div className="card table-responsive hidden-mobile" style={{ marginBottom: '5rem' }}>
                <table style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                            <th>المنتج</th>
                            <th>سعر الشراء</th>
                            <th>سعر البيع</th>
                            <th>المتبقي</th>
                            <th>الربح</th>
                            <th style={{ textAlign: 'center' }}>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((product, index) => (
                            <tr key={product.id} onClick={(e) => {
                                if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.badge')) return;
                                setViewProduct(product);
                            }} style={{ cursor: 'pointer' }}>
                                <td style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{index + 1}</td>
                                <td style={{ fontWeight: 500 }}>{product.name}</td>
                                <td>{product.purchasePrice} ج.م</td>
                                <td>{product.sellPrice} ج.م</td>
                                <td>
                                    <span className={`badge ${product.stock <= 5 ? 'badge-danger' : 'badge-success'} `}>
                                        {product.stock}
                                    </span>
                                </td>
                                <td style={{ color: 'var(--success-color)', fontWeight: 600 }}>
                                    {product.sellPrice - product.purchasePrice} ج.م
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <div className="flex items-center gap-2" style={{ justifyContent: 'center' }}>
                                        <button
                                            className="btn-outline"
                                            style={{ padding: '0.4rem', border: 'none', color: 'var(--danger-color)' }}
                                            onClick={() => handleDelete(product.id)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    لا توجد منتجات مطابقة للبحث
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile View */}
            <div className="hidden-desktop">
                {filteredProducts.map(product => (
                    <div key={product.id} className="mobile-card" onClick={(e) => {
                        if ((e.target as HTMLElement).closest('.badge')) return;
                        setViewProduct(product);
                    }}>
                        <div className="mobile-card-header">
                            <span>{product.name}</span>
                            <span className={product.stock <= 5 ? 'badge badge-danger' : 'badge badge-success'}>
                                متبقي: {product.stock}
                            </span>
                        </div>
                        <div className="mobile-card-row">
                            <span>سعر الشراء:</span>
                            <strong>{product.purchasePrice} ج.م</strong>
                        </div>
                        <div className="mobile-card-row">
                            <span>سعر البيع:</span>
                            <strong>{product.sellPrice} ج.م</strong>
                        </div>
                    </div>
                ))}
                {filteredProducts.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        لا توجد منتجات مطابقة للبحث
                    </div>
                )}
            </div>

            {/* View Details Modal */}
            {viewProduct && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px', width: '100%', padding: '0', overflow: 'hidden' }}>
                        <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>بيانات المنتج</h2>
                            <span className={viewProduct.stock <= 5 ? 'badge badge-danger' : 'badge badge-success'} style={{ fontSize: '0.9rem' }}>
                                المتبقي: {viewProduct.stock}
                            </span>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>الاسم:</span>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{viewProduct.name}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>سعر الشراء:</span>
                                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>{viewProduct.purchasePrice} ج.م</div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>سعر البيع:</span>
                                        <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--primary-color)' }}>{viewProduct.sellPrice} ج.م</div>
                                    </div>
                                </div>
                                <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>الربح المتوقع للمنتج:</span>
                                    <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--success-color)' }}>{viewProduct.sellPrice - viewProduct.purchasePrice} ج.م</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setViewProduct(null)}>
                                    إغلاق
                                </button>
                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                                    const p = viewProduct;
                                    setViewProduct(null);
                                    openForm(p);
                                }}>
                                    <Edit2 size={18} />
                                    تعديل
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
