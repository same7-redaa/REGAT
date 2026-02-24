import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type Order, type OrderStatus } from '../db/db';
import { Edit2, Trash2, Plus, Download, Upload, Search, ChevronDown, ArrowRight, Filter, Printer } from 'lucide-react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAlert } from '../contexts/AlertContext';
import { format } from 'date-fns';
import * as xlsx from 'xlsx';

const STATUSES: OrderStatus[] = ['تحت المراجعة', 'تم الشحن', 'تم التوصيل', 'لاغي', 'مرفوض'];

function StatusDropdown({
    order,
    getStatusColor,
    handleStatusChange
}: {
    order: Order,
    getStatusColor: (status: OrderStatus) => string,
    handleStatusChange: (order: Order, status: OrderStatus) => void
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                menuRef.current && !menuRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX + (rect.width / 2),
                width: rect.width
            });
        }
        setIsOpen(!isOpen);
    };

    return (
        <div ref={dropdownRef} style={{ display: 'inline-block' }}>
            <div
                className={`badge ${getStatusColor(order.status)}`}
                style={{
                    cursor: 'pointer',
                    padding: '0.35rem 0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    borderRadius: '6px',
                    minWidth: '100px',
                    userSelect: 'none',
                    fontWeight: 700,
                    fontSize: '0.75rem'
                }}
                onClick={toggleDropdown}
            >
                {order.status}
                <ChevronDown size={14} style={{ opacity: 0.7 }} />
            </div>

            {isOpen && createPortal(
                <div ref={menuRef} style={{
                    position: 'absolute',
                    top: `${coords.top + 6}px`,
                    left: `${coords.left}px`,
                    transform: 'translateX(-50%)',
                    backgroundColor: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    zIndex: 99999,
                    minWidth: '130px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {STATUSES.map(s => (
                        <div
                            key={s}
                            style={{
                                padding: '0.6rem 1rem',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                textAlign: 'center',
                                backgroundColor: order.status === s ? 'var(--bg-color)' : 'transparent',
                                color: order.status === s ? 'var(--primary-color)' : 'var(--text-primary)',
                                transition: 'all 0.2s ease',
                                borderBottom: s !== STATUSES[STATUSES.length - 1] ? '1px solid var(--border-color)' : 'none'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
                            onMouseLeave={(e) => {
                                if (order.status !== s) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(order, s);
                                setIsOpen(false);
                            }}
                        >
                            {s}
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
}

function SearchableSelect({
    options,
    value,
    onChange,
    placeholder,
    disabled = false
}: {
    options: { value: string, label: string }[];
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    disabled?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(o => o.value === value);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{
                    backgroundColor: disabled ? 'var(--bg-color)' : 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.625rem 0.75rem',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    minHeight: '42px',
                    opacity: disabled ? 0.7 : 1
                }}
            >
                <span style={{ color: selectedOption ? 'var(--text-primary)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={18} style={{ color: 'var(--text-secondary)' }} />
            </div>

            {isOpen && !disabled && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '0.25rem',
                    backgroundColor: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-md)',
                    zIndex: 100,
                    maxHeight: '250px',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                autoFocus
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="ابحث هنا..."
                                style={{
                                    width: '100%',
                                    padding: '0.4rem 2rem 0.4rem 0.5rem',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    outline: 'none',
                                    fontSize: '0.875rem'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    style={{
                                        padding: '0.5rem 0.75rem',
                                        cursor: 'pointer',
                                        backgroundColor: value === option.value ? 'var(--bg-color)' : 'transparent',
                                        color: value === option.value ? 'var(--primary-color)' : 'var(--text-primary)',
                                        borderBottom: '1px solid var(--border-color)'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
                                    onMouseLeave={(e) => {
                                        if (value !== option.value) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }
                                    }}
                                >
                                    {option.label}
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                لا توجد نتائج
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Orders() {
    const { orders, products, shippers, saveOrder, deleteOrder, saveProduct, saveExpense } = useDatabase();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'الكل'>('الكل');
    const [shipperFilter, setShipperFilter] = useState<string | 'الكل'>('الكل');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [viewOrder, setViewOrder] = useState<Order | null>(null);
    const { showAlert } = useAlert();

    // State for Dynamic Return Cost Prompt
    const [returnCostPrompt, setReturnCostPrompt] = useState<{ isOpen: boolean, order: Order | null, newStatus: OrderStatus, cost: number }>({
        isOpen: false,
        order: null,
        newStatus: 'لاغي',
        cost: 0
    });

    // Printing state
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
    const [isPrinting, setIsPrinting] = useState(false);
    const storeName = localStorage.getItem('storeName') || 'Store Name';

    // Highlight from notification navigation
    const [highlightOrderId, setHighlightOrderId] = useState<string | null>(() => {
        const id = sessionStorage.getItem('highlightOrderId');
        if (id) sessionStorage.removeItem('highlightOrderId');
        return id;
    });
    useEffect(() => {
        if (highlightOrderId) {
            const timer = setTimeout(() => setHighlightOrderId(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [highlightOrderId]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const getEmptyForm = (): Order => ({
        id: crypto.randomUUID(),
        customerName: '',
        phone: '',
        altPhone: '',
        governorate: '',
        address: '',
        productId: products.length > 0 ? products[0].id! : '',
        quantity: 1,
        totalPrice: 0,
        discount: 0,
        shipperId: shippers.length > 0 ? shippers[0].id! : '',
        shippingCost: 0,
        status: 'تحت المراجعة',
        date: new Date().toISOString(),
        notes: ''
    });

    const [formData, setFormData] = useState<Order>(getEmptyForm());

    const openForm = (order?: Order) => {
        if (order) {
            setEditingOrder(order);
            setFormData(order);
        } else {
            setEditingOrder(null);
            setFormData(getEmptyForm());
        }
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingOrder(null);
    };

    const calculateTotals = (data: Order) => {
        const product = products.find(p => p.id === data.productId);
        const shipper = shippers.find(s => s.id === data.shipperId);

        let shippingCost = 0;
        if (shipper && data.governorate) {
            const rate = shipper.rates.find(r => r.governorate === data.governorate);
            if (rate) shippingCost = rate.price;
        }

        let productTotal = 0;
        if (product) {
            productTotal = product.sellPrice * data.quantity;
        }

        const totalPrice = productTotal + shippingCost - (data.discount || 0);

        setFormData({ ...data, shippingCost, totalPrice });
    };

    const handleFormChange = (field: keyof Order, value: any) => {
        const newData = { ...formData, [field]: value };
        calculateTotals(newData);
    };

    const handleStatusChange = async (order: Order, newStatus: OrderStatus, returnCostFromPrompt?: number) => {
        const oldStatus = order.status;
        if (oldStatus === newStatus) return;

        const isOldReturn = oldStatus === 'لاغي' || oldStatus === 'مرفوض';
        const isNewReturn = newStatus === 'لاغي' || newStatus === 'مرفوض';

        // ===== CASE 1: Switching BETWEEN two return statuses (e.g. مرفوض → لاغي or vice versa) =====
        // No stock change, no new expense - just update the status label
        if (isOldReturn && isNewReturn) {
            await saveOrder({ ...order, status: newStatus, updated_at: Date.now() });
            return;
        }

        // ===== CASE 2: Transitioning FOR THE FIRST TIME from active → return =====
        // Show the cost prompt only once (when returnCostFromPrompt is undefined)
        if (isNewReturn && !isOldReturn && returnCostFromPrompt === undefined) {
            setReturnCostPrompt({
                isOpen: true,
                order,
                newStatus,
                cost: 0
            });
            return;
        }

        // ===== Stock management =====
        const product = products.find(p => p.id === order.productId);
        if (product && product.id) {
            try {
                // Coming back from a return status to an active status → deduct stock again
                if (isOldReturn && !isNewReturn) {
                    await saveProduct({ ...product, stock: Number(product.stock) - Number(order.quantity) });
                }
                // First time going to a return status from an active status → refund stock + log expense
                else if (!isOldReturn && isNewReturn) {
                    await saveProduct({ ...product, stock: Number(product.stock) + Number(order.quantity) });

                    const actualReturnCost = returnCostFromPrompt || 0;
                    if (actualReturnCost > 0) {
                        const shipper = shippers.find(s => s.id === order.shipperId);
                        await saveExpense({
                            id: crypto.randomUUID(),
                            category: `مرتجع شحن للطلب #${order.id ? order.id.slice(0, 8) : 'unknown'}`,
                            amount: actualReturnCost,
                            date: new Date().toISOString(),
                            note: `تكلفة إرجاع - حالة: ${newStatus} (${shipper ? shipper.name : 'بدون شركة'})`,
                            updated_at: Date.now()
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to update stock:", err);
                alert("حدث خطأ أثناء تحديث المخزون");
                return;
            }
        }

        const shipDate = newStatus === 'تم الشحن' ? new Date().toISOString() : order.shipDate;

        await saveOrder({
            ...order,
            status: newStatus,
            shipDate: shipDate
        });
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            if (editingOrder && editingOrder.id) {
                // Logic for calculating stock changes if quantity or product changed
                if (editingOrder.productId !== formData.productId || editingOrder.quantity !== formData.quantity) {
                    // Refund old product stock
                    const oldProduct = products.find(p => p.id === editingOrder.productId);
                    if (oldProduct && oldProduct.id && editingOrder.status !== 'لاغي' && editingOrder.status !== 'مرفوض') {
                        saveProduct({ ...oldProduct, stock: Number(oldProduct.stock) + Number(editingOrder.quantity) }).catch(console.error);
                    }

                    // Deduct new product stock
                    const newProduct = products.find(p => p.id === formData.productId);
                    if (newProduct && newProduct.id && formData.status !== 'لاغي' && formData.status !== 'مرفوض') {
                        saveProduct({ ...newProduct, stock: Number(newProduct.stock) - Number(formData.quantity) }).catch(console.error);
                    }
                }

                if (editingOrder.status !== formData.status) {
                    const tempOrder = { ...formData, status: editingOrder.status };
                    saveOrder(tempOrder).catch(console.error);
                    handleStatusChange(tempOrder, formData.status).catch(console.error);
                } else {
                    saveOrder(formData).catch(console.error);
                }
            } else {
                // New order: generate UUID if missing, then deduct stock
                const orderToSave = { ...formData, id: formData.id || crypto.randomUUID(), updated_at: Date.now() };
                if (orderToSave.status !== 'لاغي' && orderToSave.status !== 'مرفوض') {
                    const product = products.find(p => p.id === orderToSave.productId);
                    if (product && product.id) {
                        saveProduct({ ...product, stock: Number(product.stock) - Number(orderToSave.quantity) }).catch(console.error);
                    }
                }
                saveOrder(orderToSave).catch(console.error);
            }
        } finally {
            setIsSaving(false);
            closeForm();
        }
    };

    const handleDelete = async (id?: string) => {
        if (!id) return;
        showAlert({
            title: 'تأكيد الحذف',
            message: 'هل أنت متأكد من حذف الطلب نهائياً؟',
            type: 'confirm',
            confirmText: 'حذف',
            onConfirm: async () => {
                await deleteOrder(id);
                setSelectedOrderIds(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            }
        });
    };

    const exportExcel = () => {
        if (!orders || orders.length === 0) return alert('لا يوجد طلبات لتصديرها');

        const formattedData = orders.map(o => {
            const p = products.find(x => x.id === o.productId);
            const s = shippers.find(x => x.id === o.shipperId);
            return {
                'رقم الطلب': o.id,
                'تاريخ الطلب': format(new Date(o.date), 'yyyy-MM-dd HH:mm'),
                'اسم العميل': o.customerName,
                'الهاتف': o.phone,
                'الهاتف البديل': o.altPhone || '',
                'المحافظة': o.governorate,
                'العنوان': o.address,
                'المنتج': p ? p.name : 'منتج محذوف',
                'الكمية': o.quantity,
                'شركة الشحن': s ? s.name : 'شركة محذوفة',
                'تكلفة الشحن': o.shippingCost,
                'الخصم': o.discount,
                'الإجمالي المطلوب': o.totalPrice,
                'حالة الطلب': o.status,
                'ملاحظات': o.notes || ''
            };
        });

        const worksheet = xlsx.utils.json_to_sheet(formattedData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "الطلبات");
        xlsx.writeFile(workbook, `Orders_Export_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    };

    const importExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target?.result;
            const wb = xlsx.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = xlsx.utils.sheet_to_json(ws);

            let imported = 0;
            for (const row of data as any[]) {
                try {
                    // Attempt default fuzzy matching or require exact IDs in advanced template
                    // For simplicity we add them under the first product/shipper if we can't map perfectly.
                    // Ideal approach is to provide an ID template. Here we do best effort text match:
                    const pMatch = products.find(p => p.name === row['المنتج']);
                    const sMatch = shippers.find(s => s.name === row['شركة الشحن']);

                    const newOrder: Order = {
                        id: crypto.randomUUID(),
                        customerName: row['اسم العميل'] || 'بدون اسم',
                        phone: row['الهاتف']?.toString() || '',
                        altPhone: row['الهاتف البديل']?.toString() || '',
                        governorate: row['المحافظة'] || '',
                        address: row['العنوان'] || '',
                        productId: pMatch ? pMatch.id! : (products[0]?.id || ''),
                        quantity: Number(row['الكمية']) || 1,
                        shipperId: sMatch ? sMatch.id! : (shippers[0]?.id || ''),
                        shippingCost: Number(row['تكلفة الشحن']) || 0,
                        discount: Number(row['الخصم']) || 0,
                        totalPrice: Number(row['الإجمالي المطلوب']) || 0,
                        status: (row['حالة الطلب'] as OrderStatus) || 'تحت المراجعة',
                        date: new Date().toISOString(),
                        notes: row['ملاحظات'] || ''
                    };
                    await saveOrder(newOrder);
                    imported++;
                } catch (err) {
                    console.error("Row import failed", row);
                }
            }
            alert(`تم استيراد ${imported} طلب بنجاح`);
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsBinaryString(file);
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'تحت المراجعة': return 'badge-warning';
            case 'تم الشحن': return 'badge-info';
            case 'تم التوصيل': return 'badge-success';
            case 'لاغي': return 'badge-danger';
            case 'مرفوض': return 'badge-danger';
            default: return 'badge-warning';
        }
    };

    const filteredOrders = orders.filter(o => {
        const matchesSearch = o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.phone.includes(searchTerm) ||
            o.governorate.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.status.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'الكل' || o.status === statusFilter;
        const matchesShipper = shipperFilter === 'الكل' || o.shipperId === shipperFilter;

        let matchesDate = true;
        if (dateFrom && dateTo) {
            const orderDate = new Date(o.date).setHours(0, 0, 0, 0);
            const from = new Date(dateFrom).setHours(0, 0, 0, 0);
            const to = new Date(dateTo).setHours(23, 59, 59, 999);
            matchesDate = orderDate >= from && orderDate <= to;
        } else if (dateFrom) {
            const orderDate = new Date(o.date).setHours(0, 0, 0, 0);
            const from = new Date(dateFrom).setHours(0, 0, 0, 0);
            matchesDate = orderDate >= from;
        } else if (dateTo) {
            const orderDate = new Date(o.date).setHours(0, 0, 0, 0);
            const to = new Date(dateTo).setHours(23, 59, 59, 999);
            matchesDate = orderDate <= to;
        }

        return matchesSearch && matchesStatus && matchesShipper && matchesDate;
    });

    const submitReturnCost = async () => {
        if (returnCostPrompt.order) {
            await handleStatusChange(returnCostPrompt.order, returnCostPrompt.newStatus, returnCostPrompt.cost);
            setReturnCostPrompt({ isOpen: false, order: null, newStatus: 'لاغي', cost: 0 });
        }
    };

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
                    <h1 style={{ margin: 0 }}>{editingOrder ? `تعديل الطلب #${editingOrder.id}` : 'إضافة طلب جديد'}</h1>
                </div>

                <div className="card">
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        <div className="form-grid">
                            <div>
                                <label>اسم العميل</label>
                                <input type="text" required value={formData.customerName} onChange={e => handleFormChange('customerName', e.target.value)} />
                            </div>
                            <div>
                                <label>تليفون إضافي للتواصل</label>
                                <input type="tel" value={formData.altPhone || ''} onChange={e => handleFormChange('altPhone', e.target.value)} />
                            </div>
                        </div>

                        <div className="form-grid">
                            <div>
                                <label>رقم الهاتف <span style={{ color: 'red' }}>*</span></label>
                                <input type="tel" required value={formData.phone} onChange={e => handleFormChange('phone', e.target.value)} />
                            </div>
                            <div>
                                <label>المنتج المطلــوب <span style={{ color: 'red' }}>*</span></label>
                                <SearchableSelect
                                    options={products.map(p => ({ value: p.id!, label: `${p.name} (${p.sellPrice} ج.م)` }))}
                                    value={formData.productId}
                                    onChange={(val) => handleFormChange('productId', val)}
                                    placeholder="ابحث عن منتج..."
                                />
                            </div>
                        </div>

                        <div className="form-grid">
                            <div>
                                <label>تاريخ الطلب والوقت</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={formData.date ? format(new Date(formData.date), "yyyy-MM-dd'T'HH:mm") : ''}
                                    onChange={(e) => handleFormChange('date', new Date(e.target.value).toISOString())}
                                />
                            </div>
                            <div>
                                <label>شركة الشحن</label>
                                <SearchableSelect
                                    options={shippers.map(s => ({ value: s.id!, label: s.name }))}
                                    value={formData.shipperId}
                                    onChange={(val) => handleFormChange('shipperId', val)}
                                    placeholder="اختر شركة شحن..."
                                />
                            </div>
                            <div>
                                <label>المحافظة (المنطقة)</label>
                                <SearchableSelect
                                    options={(shippers.find(s => s.id === formData.shipperId)?.rates || []).map(r => ({ value: r.governorate, label: `${r.governorate} (${r.price} ج)` }))}
                                    value={formData.governorate}
                                    onChange={(val) => handleFormChange('governorate', String(val))}
                                    placeholder="اختر المحافظة..."
                                    disabled={!formData.shipperId || (shippers.find(s => s.id === formData.shipperId)?.rates.length === 0)}
                                />
                            </div>
                        </div>

                        <div>
                            <label>العنوان التفصيلي</label>
                            <textarea rows={2} required value={formData.address} onChange={e => handleFormChange('address', e.target.value)}></textarea>
                        </div>

                        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                            <div>
                                <label>الكمية</label>
                                <input type="number" min="1" required value={formData.quantity} onChange={e => handleFormChange('quantity', Number(e.target.value))} />
                            </div>
                            <div>
                                <label>خصم إضافي (ج.م)</label>
                                <input type="number" min="0" value={formData.discount} onChange={e => handleFormChange('discount', Number(e.target.value))} />
                            </div>
                            <div>
                                <label>تكلفة الشحن الآلية (ج.م)</label>
                                <input type="number" disabled value={formData.shippingCost} style={{ backgroundColor: '#f1f5f9' }} />
                            </div>
                        </div>

                        <div>
                            <label>ملاحظات إضافية</label>
                            <textarea rows={2} value={formData.notes || ''} onChange={e => handleFormChange('notes', e.target.value)} placeholder="ملاحظات للكابتن أو للتغليف..."></textarea>
                        </div>

                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ fontSize: '1.25rem' }}>
                                الإجمالي للتحصيل: <strong style={{ color: 'var(--primary-color)' }}>{formData.totalPrice} ج.م</strong>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
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
                                        'حفظ الطلب'
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Print Overlay */}
            {isPrinting && createPortal(
                <div className="print-overlay" style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'white',
                    zIndex: 9999999,
                    overflowY: 'auto'
                }}>
                    <div className="no-print" style={{ padding: '1rem', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-primary" onClick={async () => {
                                // Increment printCount for each selected order
                                for (const id of Array.from(selectedOrderIds)) {
                                    const order = orders.find(o => o.id === id);
                                    if (order) {
                                        await saveOrder({ ...order, printCount: (order.printCount || 0) + 1, updated_at: Date.now() });
                                    }
                                }
                                window.print();
                            }}><Printer size={18} style={{ marginLeft: '0.5rem' }} /> طباعة الآن</button>
                            <button className="btn btn-outline" onClick={() => setIsPrinting(false)}>إغلاق</button>
                        </div>
                        <div style={{ fontWeight: 'bold' }}>معاينة الطباعة ({selectedOrderIds.size} طلب)</div>
                    </div>

                    <div style={{ padding: '1cm' }}>
                        {Array.from(selectedOrderIds).map((id, idx, arr) => {
                            const order = orders.find(o => o.id === id);
                            if (!order) return null;
                            const product = products.find(p => p.id === order.productId);
                            const shipper = shippers.find(s => s.id === order.shipperId);

                            return (
                                <div key={id} style={{
                                    border: '2px solid #000',
                                    borderRadius: '8px',
                                    marginBottom: idx < arr.length - 1 ? '1cm' : 0,
                                    pageBreakAfter: idx < arr.length - 1 ? 'always' : 'auto',
                                    breakAfter: idx < arr.length - 1 ? 'always' : 'auto',
                                    overflow: 'hidden'
                                }}>
                                    {/* Header */}
                                    <div style={{ borderBottom: '2px solid #000', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f8f8' }}>
                                        <div style={{ fontSize: '0.95rem', fontFamily: 'monospace', fontWeight: 'bold' }}>رقم: #{order.id?.slice(0, 8)}</div>
                                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center' }}>بوليصة شحن — {storeName}</h2>
                                        <div style={{ fontSize: '0.85rem', color: '#555' }}>{shipper?.name || 'غير محدد'}</div>
                                    </div>

                                    {/* Body: 2 columns - customer info | amount */}
                                    <div style={{ display: 'flex', gap: 0 }}>
                                        {/* Left: Details */}
                                        <table style={{ flex: 1, borderCollapse: 'collapse', fontSize: '1rem' }}>
                                            <tbody>
                                                <tr>
                                                    <td style={{ padding: '0.5rem 0.75rem', border: '1px solid #ccc', fontWeight: 'bold', backgroundColor: '#fafafa', width: '110px' }}>اسم العميل</td>
                                                    <td style={{ padding: '0.5rem 0.75rem', border: '1px solid #ccc', fontSize: '1.05rem', fontWeight: 600 }}>{order.customerName}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '0.5rem 0.75rem', border: '1px solid #ccc', fontWeight: 'bold', backgroundColor: '#fafafa' }}>الهاتف</td>
                                                    <td style={{ padding: '0.5rem 0.75rem', border: '1px solid #ccc', direction: 'ltr', textAlign: 'right', fontSize: '1.1rem' }}>
                                                        {order.phone}{order.altPhone ? ` — ${order.altPhone}` : ''}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '0.5rem 0.75rem', border: '1px solid #ccc', fontWeight: 'bold', backgroundColor: '#fafafa' }}>العنوان</td>
                                                    <td style={{ padding: '0.5rem 0.75rem', border: '1px solid #ccc' }}>{order.governorate} — {order.address}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '0.5rem 0.75rem', border: '1px solid #ccc', fontWeight: 'bold', backgroundColor: '#fafafa' }}>المحتويات</td>
                                                    <td style={{ padding: '0.5rem 0.75rem', border: '1px solid #ccc' }}>{product?.name} &times; {order.quantity}</td>
                                                </tr>
                                                {order.notes && (
                                                    <tr>
                                                        <td style={{ padding: '0.5rem 0.75rem', border: '1px solid #ccc', fontWeight: 'bold', backgroundColor: '#fafafa' }}>ملاحظات</td>
                                                        <td style={{ padding: '0.5rem 0.75rem', border: '1px solid #ccc' }}>{order.notes}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>

                                        {/* Right: Amount box */}
                                        <div style={{
                                            minWidth: '160px', display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center',
                                            padding: '1rem', borderRight: '2px solid #000',
                                            backgroundColor: '#fff9e6', textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem', color: '#555' }}>المبلغ المطلوب</div>
                                            <div style={{ fontSize: '2.2rem', fontWeight: '900', lineHeight: 1.1 }}>{order.totalPrice}</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>ج.م</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>,
                document.body
            )}

            {/* Dynamic Return Cost Overlay Modal */}
            {returnCostPrompt.isOpen && returnCostPrompt.order && createPortal(
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', margin: 0, animation: 'fadeIn 0.2s ease-out' }}>
                        <h2 style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>تسجيل مرتجع الطلب #{returnCostPrompt.order?.id?.slice(0, 8)}</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            أنت تقوم بتحويل حالة الطلب إلى <strong style={{ color: 'var(--danger-color)' }}>{returnCostPrompt.newStatus}</strong>. هذا الطلب كان قيد الشحن وسيعود المنتج للمخزون.
                            أدخل تكلفة المرتجع التي سيتم خصمها في المصروفات (يمكن تركها صفر).
                        </p>
                        <div style={{ marginBottom: '1.5rem', textAlign: 'right' }}>
                            <label>تكلفة المرتجع (ج.م)</label>
                            <input
                                type="number"
                                min="0"
                                className="input"
                                autoFocus
                                value={returnCostPrompt.cost === 0 ? '' : returnCostPrompt.cost}
                                onChange={(e) => setReturnCostPrompt({ ...returnCostPrompt, cost: Number(e.target.value) })}
                                placeholder="مثال: 50"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setReturnCostPrompt({ isOpen: false, order: null, newStatus: 'لاغي', cost: 0 })}>
                                إلغاء التعديل
                            </button>
                            <button className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--danger-color)' }} onClick={submitReturnCost}>
                                تأكيد التعديل
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {selectedOrderIds.size > 0 && (
                        <button className="btn btn-primary" onClick={() => setIsPrinting(true)}>
                            <Printer size={18} style={{ marginLeft: '0.5rem' }} /> طباعة المحدد ({selectedOrderIds.size})
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                        onChange={importExcel}
                    />
                    <button className="btn btn-outline" style={{ color: 'var(--primary-color)' }} onClick={() => fileInputRef.current?.click()}>
                        <Upload size={18} /> استيراد إكسيل
                    </button>
                    <button className="btn btn-outline" style={{ color: 'var(--success-color)' }} onClick={exportExcel}>
                        <Download size={18} /> تصدير إكسيل
                    </button>
                    <button className="btn btn-outline" style={{ color: 'var(--text-secondary)' }} onClick={() => setIsFilterOpen(!isFilterOpen)}>
                        <Filter size={18} /> {isFilterOpen ? 'إخفاء الفلاتر' : 'تصفية وبحث'}
                    </button>
                    <button className="btn btn-primary" onClick={() => openForm()}>
                        <Plus size={18} /> إضافة طلب
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
                                placeholder="ابحث باسم العميل أو رقم الهاتف..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingRight: '2.5rem' }}
                            />
                        </div>

                        <div style={{ flex: '1 1 150px' }}>
                            <select
                                className="input"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                            >
                                <option value="الكل">كل الحالات</option>
                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div style={{ flex: '1 1 150px' }}>
                            <select
                                className="input"
                                value={shipperFilter}
                                onChange={(e) => setShipperFilter(e.target.value === 'الكل' ? 'الكل' : e.target.value)}
                            >
                                <option value="الكل">كل شركات الشحن</option>
                                {shippers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
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

                        {(searchTerm !== '' || statusFilter !== 'الكل' || shipperFilter !== 'الكل' || dateFrom !== '' || dateTo !== '') && (
                            <button
                                className="btn btn-outline"
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('الكل');
                                    setShipperFilter('الكل');
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
                            <th style={{ width: '40px', textAlign: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0}
                                    onChange={() => {
                                        if (selectedOrderIds.size === filteredOrders.length) {
                                            setSelectedOrderIds(new Set());
                                        } else {
                                            setSelectedOrderIds(new Set(filteredOrders.map(o => o.id!)));
                                        }
                                    }}
                                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                />
                            </th>
                            <th>رقم</th>
                            <th>العميل</th>
                            <th>التاريخ والوقت</th>
                            <th>الحالة</th>
                            <th>المنتج</th>
                            <th>الإجمالي</th>
                            <th>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(order => {
                            const product = products.find(p => p.id === order.productId);
                            return (
                                <tr key={order.id} onClick={(e) => {
                                    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.badge') || (e.target as HTMLElement).closest('input[type="checkbox"]')) return;
                                    setViewOrder(order);
                                }} style={{
                                    cursor: 'pointer',
                                    transition: 'background-color 0.6s ease',
                                    backgroundColor: highlightOrderId === order.id ? '#fef9c3' : undefined,
                                    outline: highlightOrderId === order.id ? '2px solid #eab308' : undefined
                                }}>
                                    <td style={{ textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedOrderIds.has(order.id!)}
                                            onChange={() => {
                                                const newSet = new Set(selectedOrderIds);
                                                if (newSet.has(order.id!)) newSet.delete(order.id!);
                                                else newSet.add(order.id!);
                                                setSelectedOrderIds(newSet);
                                            }}
                                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                        />
                                    </td>
                                    <td style={{ fontWeight: 600 }}>
                                        #{order.id?.slice(0, 8)}
                                        {(order.printCount ?? 0) > 0 && (
                                            <span title={`تمت طباعته ${order.printCount} مرة`} style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '2px',
                                                marginRight: '6px', padding: '1px 6px',
                                                backgroundColor: '#e0f2fe', color: '#0369a1',
                                                borderRadius: '999px', fontSize: '0.7rem', fontWeight: '700'
                                            }}>
                                                <Printer size={10} /> {order.printCount}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{order.customerName}</td>
                                    <td style={{ fontSize: '0.875rem', direction: 'ltr', textAlign: 'right' }}>
                                        {format(new Date(order.date), 'dd/MM/yyyy')}
                                    </td>
                                    <td>
                                        <StatusDropdown
                                            order={order}
                                            getStatusColor={getStatusColor}
                                            handleStatusChange={handleStatusChange}
                                        />
                                    </td>
                                    <td>{product ? product.name : 'منتج محذوف'}</td>
                                    <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{order.totalPrice} ج.م</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div className="flex items-center gap-2" style={{ justifyContent: 'center' }}>
                                            <button className="btn-outline" style={{ padding: '0.4rem', border: 'none', color: 'var(--danger-color)' }} onClick={() => handleDelete(order.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredOrders.length === 0 && (
                            <tr>
                                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    لا توجد طلبات مسجلة
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile View */}
            <div className="hidden-desktop">
                {filteredOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(order => {
                    return (
                        <div key={order.id} className="mobile-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }} onClick={(e) => {
                            if ((e.target as HTMLElement).closest('.badge') || (e.target as HTMLElement).closest('input[type="checkbox"]')) return;
                            setViewOrder(order);
                        }}>
                            <input
                                type="checkbox"
                                checked={selectedOrderIds.has(order.id!)}
                                onChange={() => {
                                    const newSet = new Set(selectedOrderIds);
                                    if (newSet.has(order.id!)) newSet.delete(order.id!);
                                    else newSet.add(order.id!);
                                    setSelectedOrderIds(newSet);
                                }}
                                style={{ cursor: 'pointer', width: '20px', height: '20px', marginTop: '0.2rem' }}
                            />
                            <div style={{ flex: 1 }}>
                                <div className="mobile-card-header">
                                    <span>
                                        طلب #{order.id?.slice(0, 8)}
                                        {(order.printCount ?? 0) > 0 && (
                                            <span title={`تمت طباعته ${order.printCount} مرة`} style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '2px',
                                                marginRight: '6px', padding: '1px 6px',
                                                backgroundColor: '#e0f2fe', color: '#0369a1',
                                                borderRadius: '999px', fontSize: '0.7rem', fontWeight: '700'
                                            }}>
                                                <Printer size={10} /> {order.printCount}
                                            </span>
                                        )}
                                    </span>
                                    <StatusDropdown
                                        order={order}
                                        getStatusColor={getStatusColor}
                                        handleStatusChange={handleStatusChange}
                                    />
                                </div>
                                <div className="mobile-card-row">
                                    <span>العميل:</span>
                                    <strong style={{ fontSize: '0.95rem' }}>{order.customerName}</strong>
                                </div>
                                <div className="mobile-card-row">
                                    <span>الإجمالي:</span>
                                    <strong style={{ color: 'var(--primary-color)', fontSize: '1.05rem' }}>{order.totalPrice} ج.م</strong>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {filteredOrders.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        لا توجد طلبات مسجلة
                    </div>
                )}
            </div>

            {/* View Details Modal */}
            {viewOrder && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px', width: '100%', padding: '0', overflow: 'hidden' }}>
                        <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>تفاصيل الطلب #{viewOrder.id?.slice(0, 8)}</h2>
                            <StatusDropdown
                                order={viewOrder}
                                getStatusColor={getStatusColor}
                                handleStatusChange={(order, status) => {
                                    handleStatusChange(order, status);
                                    setViewOrder({ ...viewOrder, status });
                                }}
                            />
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>اسم العميل:</span>
                                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{viewOrder.customerName}</div>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>رقم الهاتف:</span>
                                    <div style={{ fontWeight: 600, fontSize: '1rem', direction: 'ltr', textAlign: 'right' }}>{viewOrder.phone}</div>
                                    {viewOrder.altPhone && <div style={{ fontSize: '0.875rem', direction: 'ltr', textAlign: 'right', color: 'var(--text-secondary)' }}>{viewOrder.altPhone} (إضافي)</div>}
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>المحافظة / العنوان:</span>
                                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{viewOrder.governorate}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{viewOrder.address}</div>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>المنتج والكمية:</span>
                                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                                        {products.find(p => p.id === viewOrder.productId)?.name || 'منتج محذوف'} (x{viewOrder.quantity})
                                    </div>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>شركة الشحن:</span>
                                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                                        {shippers.find(s => s.id === viewOrder.shipperId)?.name || 'بدون شركة شحن'}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>تكلفة: {viewOrder.shippingCost} ج.م</div>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>الإجمالي:</span>
                                    <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary-color)' }}>{viewOrder.totalPrice} ج.م</div>
                                    {viewOrder.discount > 0 && <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>تم خصم: {viewOrder.discount} ج.م</div>}
                                </div>
                            </div>

                            {viewOrder.notes && (
                                <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>ملاحظات:</span>
                                    <div style={{ fontSize: '0.9rem' }}>{viewOrder.notes}</div>
                                </div>
                            )}

                            {/* Dates section */}
                            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>تاريخ الإنشاء:</span>
                                    <span style={{ fontWeight: 500, direction: 'ltr', fontFamily: 'Cairo, monospace', fontSize: '0.9rem' }}>
                                        {format(new Date(viewOrder.date), 'dd/MM/yyyy — hh:mm a')}
                                    </span>
                                </div>
                                {viewOrder.shipDate && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>تاريخ الشحن:</span>
                                        <span style={{ fontWeight: 500, direction: 'ltr', fontFamily: 'Cairo, monospace', fontSize: '0.9rem' }}>
                                            {format(new Date(viewOrder.shipDate), 'dd/MM/yyyy — hh:mm a')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setViewOrder(null)}>
                                    إغلاق
                                </button>
                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                                    const o = viewOrder;
                                    setViewOrder(null);
                                    openForm(o);
                                }}>
                                    <Edit2 size={18} />
                                    تعديل الطلب
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
