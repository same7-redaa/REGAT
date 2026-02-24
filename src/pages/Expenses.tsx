import { useState } from 'react';
import { createPortal } from 'react-dom';
import { type Expense } from '../db/db';
import { Edit2, Trash2, Plus, Search, ArrowRight, Filter, Tag, Calendar, FileText } from 'lucide-react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAlert } from '../contexts/AlertContext';
import { format } from 'date-fns';

export default function Expenses() {
    const { expenses, saveExpense, deleteExpense } = useDatabase();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('الكل');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [viewExpense, setViewExpense] = useState<Expense | null>(null);
    const { showAlert } = useAlert();

    const [formData, setFormData] = useState<Expense>({
        id: '',
        category: 'إعلانات',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        note: ''
    });

    const openForm = (expense?: Expense) => {
        if (expense) {
            setEditingExpense(expense);
            setFormData({ ...expense, date: expense.date.split('T')[0] });
        } else {
            setEditingExpense(null);
            setFormData({
                id: '',
                category: 'إعلانات',
                amount: 0,
                date: new Date().toISOString().split('T')[0],
                note: ''
            });
        }
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const dataToSave = {
            ...formData,
            date: new Date(formData.date).toISOString()
        };

        try {
            saveExpense(dataToSave as Expense).catch(console.error);
        } finally {
            setIsSaving(false);
            closeForm();
        }
    };

    const handleDelete = async (id?: string) => {
        if (!id) return;
        showAlert({
            title: 'تأكيد الحذف',
            message: 'هل أنت متأكد من حذف هذا المصروف نهائياً؟',
            type: 'confirm',
            confirmText: 'حذف',
            onConfirm: async () => {
                await deleteExpense(id);
            }
        });
    };

    const filteredExpenses = expenses.filter(e => {
        // Exclude return expenses
        if (e.category.includes('مرتجع شحن للطلب')) return false;

        const matchesSearch = e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.note && e.note.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = categoryFilter === 'الكل' || e.category === categoryFilter;

        let matchesDate = true;
        if (dateFrom && dateTo) {
            const expenseDate = new Date(e.date).setHours(0, 0, 0, 0);
            const from = new Date(dateFrom).setHours(0, 0, 0, 0);
            const to = new Date(dateTo).setHours(23, 59, 59, 999);
            matchesDate = expenseDate >= from && expenseDate <= to;
        } else if (dateFrom) {
            const expenseDate = new Date(e.date).setHours(0, 0, 0, 0);
            const from = new Date(dateFrom).setHours(0, 0, 0, 0);
            matchesDate = expenseDate >= from;
        } else if (dateTo) {
            const expenseDate = new Date(e.date).setHours(0, 0, 0, 0);
            const to = new Date(dateTo).setHours(23, 59, 59, 999);
            matchesDate = expenseDate <= to;
        }

        return matchesSearch && matchesCategory && matchesDate;
    });

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
                    <h1 style={{ margin: 0 }}>{editingExpense ? 'تعديل المصروف' : 'إضافة مصروف جديد'}</h1>
                </div>

                <div className="card">
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-grid">
                            <div>
                                <label>تصنيف المصروف (اكتب الفئة)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="مثال: إعلانات ممولة"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                />
                            </div>
                            <div>
                                <label>المبلغ (ج.م)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.amount || ''}
                                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div>
                            <label>تاريخ الدفع (مع الوقت)</label>
                            <input
                                type="datetime-local"
                                required
                                value={formData.date ? format(new Date(formData.date), "yyyy-MM-dd'T'HH:mm") : ''}
                                onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value).toISOString() })}
                            />
                        </div>

                        <div>
                            <label>ملاحظات إضافية والتفاصيل</label>
                            <textarea
                                rows={2}
                                value={formData.note || ''}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                placeholder="تفاصيل المصروف..."
                            ></textarea>
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
                                    'حفظ المصروف'
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
                        <Filter size={18} /> {isFilterOpen ? 'إخفاء الفلاتر' : 'تصفية وبحث'}
                    </button>
                    <button className="btn btn-primary" onClick={() => openForm()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> إضافة مصروف
                    </button>
                </div>
            </div>

            {/* Filters Section */}
            {isFilterOpen && (
                <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.2s ease-out' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: '1 1 250px' }}>
                            <Search size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                className="input"
                                placeholder="ابحث بتصنيف المصروف أو الملاحظات..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingRight: '2.5rem' }}
                            />
                        </div>

                        <div style={{ flex: '1 1 150px' }}>
                            <input
                                type="text"
                                className="input"
                                placeholder="فلتر بالتصنيف..."
                                value={categoryFilter === 'الكل' ? '' : categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value === '' ? 'الكل' : e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', minWidth: '60px' }}>من تاريخ:</label>
                        <input
                            type="date"
                            className="input"
                            style={{ flex: '1 1 150px' }}
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />

                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', minWidth: '60px' }}>إلى تاريخ:</label>
                        <input
                            type="date"
                            className="input"
                            style={{ flex: '1 1 150px' }}
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />

                        {(searchTerm !== '' || categoryFilter !== 'الكل' || dateFrom !== '' || dateTo !== '') && (
                            <button
                                className="btn btn-outline"
                                onClick={() => {
                                    setSearchTerm('');
                                    setCategoryFilter('الكل');
                                    setDateFrom('');
                                    setDateTo('');
                                }}
                                style={{ padding: '0.5rem 1rem', color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
                            >
                                مسح الفلاتر
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="card table-responsive hidden-mobile">
                <table style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>التاريخ والوقت</th>
                            <th>التصنيف</th>
                            <th>المبلغ</th>
                            <th>الملاحظات</th>
                            <th style={{ textAlign: 'center' }}>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((expense) => (
                            <tr key={expense.id} onClick={(e) => {
                                if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.badge')) return;
                                setViewExpense(expense);
                            }} style={{ cursor: 'pointer' }}>
                                <td style={{ direction: 'ltr', textAlign: 'right' }}>
                                    {format(new Date(expense.date), 'dd/MM/yyyy')}
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {format(new Date(expense.date), 'hh:mm a')}
                                    </div>
                                </td>
                                <td>
                                    <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                                        {expense.category}
                                    </span>
                                </td>
                                <td style={{ color: 'var(--danger-color)', fontWeight: 600 }}>{expense.amount} ج.م</td>
                                <td>{expense.note}</td>
                                <td style={{ textAlign: 'center' }}>
                                    <div className="flex items-center gap-2" style={{ justifyContent: 'center' }}>
                                        <button className="btn-outline" style={{ padding: '0.4rem', border: 'none', color: 'var(--danger-color)' }} onClick={() => handleDelete(expense.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredExpenses.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    لا توجد مصروفات مطابقة للبحث
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile View */}
            <div className="hidden-desktop">
                {filteredExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
                    <div key={expense.id} className="mobile-card" onClick={(e) => {
                        if ((e.target as HTMLElement).closest('.badge')) return;
                        setViewExpense(expense);
                    }}>
                        <div className="mobile-card-header">
                            <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                                {expense.category}
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                {format(new Date(expense.date), 'dd/MM/yyyy')}
                            </span>
                        </div>
                        <div className="mobile-card-row">
                            <span>المبلغ:</span>
                            <strong style={{ color: 'var(--danger-color)', fontSize: '1.05rem' }}>{expense.amount} ج.م</strong>
                        </div>
                    </div>
                ))}
                {filteredExpenses.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        لا توجد مصروفات مطابقة للبحث
                    </div>
                )}
            </div>

            {/* View Details Modal */}
            {viewExpense && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px', width: '100%', padding: '0', overflow: 'hidden' }}>
                        <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>تفاصيل المصروف</h2>
                            <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '1rem', padding: '0.5rem 1rem' }}>
                                {viewExpense.category}
                            </span>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ gap: '1.5rem', display: 'flex', flexDirection: 'column' }}>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Tag size={20} color="var(--primary-color)" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>المبلغ</div>
                                        <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--danger-color)' }}>{viewExpense.amount} ج.م</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Calendar size={20} color="var(--primary-color)" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>تاريخ الحركة</div>
                                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>{format(new Date(viewExpense.date), 'dd/MM/yyyy - hh:mm a')}</div>
                                    </div>
                                </div>

                                {viewExpense.note && (
                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <FileText size={20} color="var(--primary-color)" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>ملاحظات</div>
                                            <div style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{viewExpense.note}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setViewExpense(null)}>
                                    إغلاق
                                </button>
                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                                    const ex = viewExpense;
                                    setViewExpense(null);
                                    openForm(ex);
                                }}>
                                    <Edit2 size={18} />
                                    تعديل المصروف
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
