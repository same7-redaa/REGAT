import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type Order, type OrderStatus } from '../db/db';
import { Trash2, Download, Search, ChevronDown, Filter } from 'lucide-react';
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

export default function Returns() {
    const { orders, products, shippers, saveOrder, deleteOrder, saveProduct, saveExpense } = useDatabase();

    const [searchTerm, setSearchTerm] = useState('');
    const [shipperFilter, setShipperFilter] = useState<string | 'الكل'>('الكل');
    const [statusFilter, setStatusFilter] = useState<'الكل' | 'لاغي' | 'مرفوض'>('الكل');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [viewOrder, setViewOrder] = useState<Order | null>(null);
    const { showAlert } = useAlert();

    const [returnCostPrompt, setReturnCostPrompt] = useState<{ isOpen: boolean, order: Order | null, newStatus: OrderStatus, cost: number }>({
        isOpen: false,
        order: null,
        newStatus: 'لاغي',
        cost: 0
    });

    const handleDelete = async (id?: string) => {
        if (!id) return;
        showAlert({
            title: 'تأكيد الحذف',
            message: 'هل أنت متأكد من حذف هذا المرتجع بشكل نهائي؟',
            type: 'confirm',
            confirmText: 'حذف نهائي',
            onConfirm: async () => {
                await deleteOrder(id);
                if (viewOrder?.id === id) setViewOrder(null);
            }
        });
    };

    const exportExcel = () => {
        if (filteredOrders.length === 0) {
            alert('لا توجد بيانات لتصديرها');
            return;
        }

        const dataToExport = filteredOrders.map(order => {
            const product = products.find(p => p.id === order.productId);
            const shipper = shippers.find(s => s.id === order.shipperId);
            return {
                'ID': order.id,
                'اسم العميل': order.customerName,
                'رقم الهاتف': order.phone,
                'رقم إضافي': order.altPhone || '',
                'المحافظة': order.governorate,
                'العنوان': order.address,
                'المنتج': product ? product.name : 'غير محدد',
                'الكمية': order.quantity,
                'الإجمالي': order.totalPrice,
                'الخصم': order.discount || 0,
                'شركة الشحن': shipper ? shipper.name : 'غير محدد',
                'الحالة': order.status,
                'التاريخ': format(new Date(order.date), 'yyyy-MM-dd HH:mm'),
                'تاريخ الشحن': order.shipDate ? format(new Date(order.shipDate), 'yyyy-MM-dd HH:mm') : '',
                'ملاحظات': order.notes || ''
            };
        });

        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(dataToExport);

        // RTL Support
        if (!worksheet['!views']) {
            worksheet['!views'] = [];
        }
        worksheet['!views'].push({ rightToLeft: true });

        xlsx.utils.book_append_sheet(workbook, worksheet, 'المرتجعات');
        xlsx.writeFile(workbook, `مرتجعات_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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

    const handleStatusChange = async (order: Order, newStatus: OrderStatus, returnCostFromPrompt?: number) => {
        const oldStatus = order.status;
        if (oldStatus === newStatus) return;

        // If changing to 'لاغي' or 'مرفوض', prompt for return cost if not already provided
        if ((newStatus === 'لاغي' || newStatus === 'مرفوض') && returnCostFromPrompt === undefined) {
            setReturnCostPrompt({
                isOpen: true,
                order,
                newStatus,
                cost: 0 // Default starting value
            });
            return; // Stop here, the modal will call this function again with the cost
        }

        // Stock management logic:
        // Stock is now deducted when the order is created.
        // We only refund stock if the order becomes 'لاغي' or 'مرفوض'
        const product = products.find(p => Number(p.id) === Number(order.productId));
        if (product && product.id) {
            try {
                // If it was cancelled/rejected and is now being moved back to active status (e.g. 'تم الشحن', 'تحت المراجعة'), deduct stock again
                if ((oldStatus === 'لاغي' || oldStatus === 'مرفوض') && (newStatus !== 'لاغي' && newStatus !== 'مرفوض')) {
                    await saveProduct({ ...product, stock: Number(product.stock) - Number(order.quantity) });
                }
                // If it is newly cancelled/rejected, refund the stock
                else if ((oldStatus !== 'لاغي' && oldStatus !== 'مرفوض') && (newStatus === 'لاغي' || newStatus === 'مرفوض')) {
                    await saveProduct({ ...product, stock: Number(product.stock) + Number(order.quantity) });

                    // Register return cost dynamically
                    const actualReturnCost = returnCostFromPrompt || 0;
                    if (actualReturnCost > 0) {
                        const shipper = shippers.find(s => s.id === order.shipperId);
                        await saveExpense({
                            id: crypto.randomUUID(),
                            category: `مرتجع شحن للطلب #${order.id?.slice(0, 8)}`,
                            amount: actualReturnCost,
                            date: new Date().toISOString(),
                            note: `تكلفة إرجاع ديناميكية (${shipper ? shipper.name : 'بدون شركة'})`
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

    // Filter to ONLY show 'لاغي' and 'مرفوض' unconditionally, then apply user filters
    const returnOrders = orders.filter(o => o.status === 'لاغي' || o.status === 'مرفوض');

    const filteredOrders = returnOrders.filter(o => {
        const matchesSearch = o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.phone.includes(searchTerm) ||
            o.governorate.toLowerCase().includes(searchTerm.toLowerCase());

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

    return (
        <div>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-outline" style={{ color: 'var(--success-color)' }} onClick={exportExcel}>
                        <Download size={18} /> تصدير إكسيل للمرتجعات
                    </button>
                    <button className="btn btn-outline" style={{ color: 'var(--text-secondary)' }} onClick={() => setIsFilterOpen(!isFilterOpen)}>
                        <Filter size={18} /> {isFilterOpen ? 'إخفاء الفلاتر' : 'تصفية وبحث'}
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
                                <option value="الكل">كل المرتجعات</option>
                                <option value="لاغي">لاغي فقط</option>
                                <option value="مرفوض">مرفوض فقط</option>
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
                            <th>رقم</th>
                            <th>العميل</th>
                            <th>التاريخ والوقت</th>
                            <th>الحالة</th>
                            <th>المنتج</th>
                            <th>الإجمالي</th>
                            <th style={{ textAlign: 'center' }}>حذف</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(order => {
                            const product = products.find(p => p.id === order.productId);
                            return (
                                <tr key={order.id} onClick={(e) => {
                                    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.badge')) return;
                                    setViewOrder(order);
                                }} style={{ cursor: 'pointer' }}>
                                    <td style={{ fontWeight: 600 }}>#{order.id?.slice(0, 8)}</td>
                                    <td>
                                        <div>{order.customerName}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{order.phone}</div>
                                    </td>
                                    <td style={{ fontSize: '0.875rem', direction: 'ltr', textAlign: 'right' }}>
                                        {format(new Date(order.date), 'dd/MM/yyyy')}
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {format(new Date(order.date), 'hh:mm a')}
                                        </div>
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
                                        <button className="btn-outline" style={{ padding: '0.4rem', border: 'none', color: 'var(--danger-color)' }} onClick={() => handleDelete(order.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredOrders.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    لا توجد مرتجعات مسجلة
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile View */}
            <div className="hidden-desktop">
                {filteredOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(order => {
                    const product = products.find(p => p.id === order.productId);
                    return (
                        <div key={order.id} className="mobile-card" onClick={(e) => {
                            if ((e.target as HTMLElement).closest('.badge') || (e.target as HTMLElement).closest('button')) return;
                            setViewOrder(order);
                        }}>
                            <div className="mobile-card-header">
                                <span>مرتجع #{order.id?.slice(0, 8)}</span>
                                <StatusDropdown
                                    order={order}
                                    getStatusColor={getStatusColor}
                                    handleStatusChange={handleStatusChange}
                                />
                            </div>
                            <div className="mobile-card-row">
                                <span>العميل:</span>
                                <strong>{order.customerName}</strong>
                            </div>
                            <div className="mobile-card-row">
                                <span>المنتج:</span>
                                <strong>{product ? product.name : 'منتج محذوف'}</strong>
                            </div>
                            <div className="mobile-card-row">
                                <span>الإجمالي:</span>
                                <strong>{order.totalPrice} ج.م</strong>
                            </div>
                            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.875rem' }}>
                                <button
                                    className="btn"
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#fef2f2',
                                        color: 'var(--danger-color)',
                                        border: '1px solid var(--danger-color)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        padding: '0.75rem',
                                        fontWeight: 600,
                                        borderRadius: '8px'
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(order.id);
                                    }}
                                >
                                    <Trash2 size={18} /> حذف نهائي
                                </button>
                            </div>
                        </div>
                    );
                })}
                {filteredOrders.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        لا توجد مرتجعات مسجلة
                    </div>
                )}
            </div>

            {/* View Details Modal */}
            {viewOrder && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px', width: '100%', padding: '0', overflow: 'hidden' }}>
                        <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>تفاصيل المرتجع #{viewOrder.id?.slice(0, 8)}</h2>
                            <StatusDropdown
                                order={viewOrder}
                                getStatusColor={getStatusColor}
                                handleStatusChange={(o, s) => {
                                    handleStatusChange(o, s);
                                    setViewOrder({ ...viewOrder, status: s });
                                }}
                            />
                        </div>
                        <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>العميل:</span>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{viewOrder.customerName}</div>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>رقم الهاتف:</span>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem', direction: 'ltr', textAlign: 'right' }}>{viewOrder.phone}</div>
                                </div>
                                {viewOrder.altPhone && (
                                    <div>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>رقم إضافي:</span>
                                        <div style={{ fontWeight: 600, fontSize: '1.1rem', direction: 'ltr', textAlign: 'right' }}>{viewOrder.altPhone}</div>
                                    </div>
                                )}
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>العنوان:</span>
                                    <div style={{ fontWeight: 500 }}>{viewOrder.governorate} - {viewOrder.address}</div>
                                </div>
                            </div>

                            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>المنتج:</span>
                                    <span style={{ fontWeight: 600 }}>{products.find(p => p.id === viewOrder.productId)?.name || 'غير محدد'} x{viewOrder.quantity}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>تاريخ إنشاء الطلب:</span>
                                    <span style={{ fontWeight: 500, direction: 'ltr', fontFamily: 'Cairo, monospace', fontSize: '0.9rem' }}>{format(new Date(viewOrder.date), 'dd/MM/yyyy — hh:mm a')}</span>
                                </div>
                                {viewOrder.shipDate && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>تاريخ الشحن:</span>
                                        <span style={{ fontWeight: 500, direction: 'ltr', fontFamily: 'Cairo, monospace', fontSize: '0.9rem' }}>{format(new Date(viewOrder.shipDate), 'dd/MM/yyyy — hh:mm a')}</span>
                                    </div>
                                )}
                                {(viewOrder.status === 'لاغي' || viewOrder.status === 'مرفوض') && viewOrder.updated_at && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ color: 'var(--danger-color)', fontWeight: 600 }}>تاريخ {viewOrder.status === 'لاغي' ? 'الإلغاء' : 'الرفض'}:</span>
                                        <span style={{ fontWeight: 600, direction: 'ltr', fontFamily: 'Cairo, monospace', fontSize: '0.9rem', color: 'var(--danger-color)' }}>{format(new Date(viewOrder.updated_at), 'dd/MM/yyyy — hh:mm a')}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                                    <span style={{ fontWeight: 700 }}>الإجمالي:</span>
                                    <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{viewOrder.totalPrice} ج.م</span>
                                </div>
                            </div>

                            {viewOrder.notes && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>ملاحظات:</span>
                                    <div style={{ backgroundColor: '#fffbe1', padding: '1rem', borderRadius: '8px', border: '1px solid #fef08a', fontSize: '0.95rem' }}>
                                        {viewOrder.notes}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setViewOrder(null)}>
                                    إغلاق
                                </button>
                                <button className="btn btn-outline" style={{ flex: 1, color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }} onClick={() => handleDelete(viewOrder.id)}>
                                    <Trash2 size={18} />
                                    حذف نهائي
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
