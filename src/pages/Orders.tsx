import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type Order, type OrderItem, type OrderStatus, getOrderItems, formatId } from '../db/db';
import { Edit2, Trash2, Plus, Download, Upload, Search, ChevronDown, ArrowRight, Filter, Printer } from 'lucide-react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAlert } from '../contexts/AlertContext';
import { format } from 'date-fns';
import * as xlsx from 'xlsx';

const STATUSES: OrderStatus[] = ['تحت المراجعة', 'تم الشحن', 'تم التوصيل', 'تسليم جزئي', 'لاغي', 'مرفوض'];

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
    const { orders, products, shippers, saveOrder, deleteOrder, adjustProductStock } = useDatabase();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'الكل'>('الكل');
    const [shipperFilter, setShipperFilter] = useState<string | 'الكل'>('الكل');
    const [governorateFilter, setGovernorateFilter] = useState<string>('الكل');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [viewOrder, setViewOrder] = useState<Order | null>(null);
    const { showAlert } = useAlert();

    // State for Dynamic Return Cost & Partial Delivery Prompt
    const [statusPrompt, setStatusPrompt] = useState<{
        isOpen: boolean,
        order: Order | null,
        newStatus: OrderStatus,
        cost: number,
        returnedItems: { productId: string, returnedQuantity: number }[]
    }>({
        isOpen: false,
        order: null,
        newStatus: 'لاغي',
        cost: 0,
        returnedItems: []
    });

    // Printing state
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
    const [isPrinting, setIsPrinting] = useState(false);
    const { settings } = useDatabase();
    const storeName = settings?.storeName || 'Store Name';

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
        items: [{ productId: products.length > 0 ? products[0].id! : '', quantity: 0 }],
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
            const normalizedOrder = { ...order, items: getOrderItems(order) };
            setEditingOrder(order);
            setFormData(normalizedOrder);
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
        const shipper = shippers.find(s => s.id === data.shipperId);

        let shippingCost = 0;
        let shippingDiscount = 0;
        if (shipper && data.governorate) {
            const rate = shipper.rates.find(r => r.governorate === data.governorate);
            if (rate) {
                shippingCost = rate.price;           // actual cost paid to company
                shippingDiscount = rate.discount || 0; // discount given to customer
            }
        }

        let productTotal = 0;
        const items = getOrderItems(data);
        for (const item of items) {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                productTotal += product.sellPrice * item.quantity;
            }
        }

        // What customer pays = products + (shipping - shippingDiscount) - orderDiscount
        const totalPrice = productTotal + (shippingCost - shippingDiscount) - (data.discount || 0);

        setFormData({ ...data, shippingCost, totalPrice });
    };

    const handleFormChange = (field: keyof Order, value: any) => {
        const newData = { ...formData, [field]: value };
        calculateTotals(newData);
    };

    const handleStatusChange = async (order: Order, newStatus: OrderStatus, promptData?: { cost: number, returnedItems: { productId: string, returnedQuantity: number }[] }) => {
        const oldStatus = order.status;
        if (oldStatus === newStatus) return;

        const currentItems = getOrderItems(order);

        // === Inventory state categories ===
        // In the new logic, stock is ALWAYS deducted upon order creation
        // unless the status is 'لاغي' or 'مرفوض' (Inactive statuses).
        const wasActive = !['لاغي', 'مرفوض'].includes(oldStatus);
        const isGoingToActive = !['لاغي', 'مرفوض'].includes(newStatus);

        const wasPartial = oldStatus === 'تسليم جزئي';
        const isGoingToPartial = newStatus === 'تسليم جزئي';
        const isGoingToCancellation = ['لاغي', 'مرفوض'].includes(newStatus);

        // oldWasShipped tracks if the order had *physically* shipped so we can handle return costs
        const oldWasShipped = ['تم الشحن', 'تم التوصيل', 'تسليم جزئي'].includes(oldStatus);
        const isGoingToShipped = newStatus === 'تم الشحن';

        // === Prompt triggering ===
        // Only prompt if: going to return-like AND it was physically shipped (so return cost applies)
        const needsPrompt =
            (isGoingToCancellation || isGoingToPartial) &&
            oldWasShipped &&
            promptData === undefined;

        if (needsPrompt) {
            setStatusPrompt({
                isOpen: true,
                order,
                newStatus,
                cost: 0,
                returnedItems: currentItems.map(item => ({
                    productId: item.productId,
                    returnedQuantity: isGoingToPartial ? 0 : item.quantity
                }))
            });
            return;
        }

        // Base updates for the new status
        let updates: Partial<Order> = {
            status: newStatus,
            shipDate: isGoingToShipped && !order.shipDate ? new Date().toISOString() : order.shipDate,
            updated_at: Date.now()
        };

        // ============================================================
        // CASE 1: Inactive -> Active (Reserve full stock)
        // From: لاغي, مرفوض  To: تحت المراجعة, تم الشحن, etc
        // ============================================================
        if (!wasActive && isGoingToActive) {
            for (const item of currentItems) {
                await adjustProductStock(item.productId, -Number(item.quantity));
            }
        }

        // ============================================================
        // CASE 2: Active (Not Partial) -> Inactive (Refund full stock)
        // From: تحت المراجعة, تم الشحن, تم التوصيل  To: لاغي, مرفوض
        // ============================================================
        else if (wasActive && !wasPartial && isGoingToCancellation) {
            // Apply return cost if it was actually shipped
            if (oldWasShipped && promptData !== undefined) {
                const { cost, returnedItems } = promptData;
                updates.returnCost = cost;
                updates.items = currentItems.map(item => {
                    const retItem = returnedItems.find(ri => ri.productId === item.productId);
                    return { ...item, returnedQuantity: retItem ? retItem.returnedQuantity : item.quantity };
                });
            }
            // Refund ALL stock completely
            for (const item of currentItems) {
                await adjustProductStock(item.productId, Number(item.quantity));
            }
        }

        // ============================================================
        // CASE 3: Active (Not Partial) -> 'تسليم جزئي' (Partial Refund)
        // ============================================================
        else if (wasActive && !wasPartial && isGoingToPartial && promptData !== undefined) {
            const { cost, returnedItems } = promptData;
            updates.returnCost = cost;
            updates.items = currentItems.map(item => {
                const retItem = returnedItems.find(ri => ri.productId === item.productId);
                return { ...item, returnedQuantity: retItem ? retItem.returnedQuantity : 0 };
            });
            updates.returnedQuantity = returnedItems.reduce((acc, curr) => acc + curr.returnedQuantity, 0);
            updates.deliveredQuantity = currentItems.reduce((acc, curr) => acc + curr.quantity, 0) - (updates.returnedQuantity || 0);

            // Recalculate totalPrice
            const newTotalPrice = (updates.items as typeof currentItems).reduce((sum, item) => {
                const deliveredQty = item.quantity - (item.returnedQuantity || 0);
                const product = products.find(p => p.id === item.productId);
                return sum + (product?.sellPrice || 0) * deliveredQty;
            }, 0) + (order.shippingCost || 0) - (order.discount || 0);
            updates.totalPrice = newTotalPrice;

            // Refund ONLY the returned parts to stock
            for (const item of currentItems) {
                const retItem = returnedItems.find(ri => ri.productId === item.productId);
                const qtyToReturn = retItem ? retItem.returnedQuantity : 0;
                if (qtyToReturn > 0) {
                    await adjustProductStock(item.productId, qtyToReturn);
                }
            }
        }

        // ============================================================
        // CASE 4: 'تسليم جزئي' -> Active (Not Partial) (Re-deduct previously returned items)
        // ============================================================
        else if (wasPartial && isGoingToActive && !isGoingToPartial) {
            for (const item of currentItems) {
                const prevReturned = item.returnedQuantity || 0;
                if (prevReturned > 0) {
                    await adjustProductStock(item.productId, -prevReturned);
                }
            }
            updates.items = currentItems.map(i => ({ ...i, returnedQuantity: undefined }));
            updates.returnCost = 0;
            updates.deliveredQuantity = undefined;
            updates.returnedQuantity = undefined;
            // Total price must be recalculated back to full
            const originalPrice = currentItems.reduce((sum, item) => {
                const product = products.find(p => p.id === item.productId);
                return sum + (product?.sellPrice || 0) * item.quantity;
            }, 0) + (order.shippingCost || 0) - (order.discount || 0);
            updates.totalPrice = originalPrice;
        }

        // ============================================================
        // CASE 5: 'تسليم جزئي' -> Inactive (Refund the rest of the items)
        // ============================================================
        else if (wasPartial && isGoingToCancellation && promptData !== undefined) {
            const { cost } = promptData;
            updates.returnCost = cost;
            // The previously returned items were already restocked. Refund the *delivered* ones now.
            for (const item of currentItems) {
                const alreadyReturned = item.returnedQuantity || 0;
                const stillDeducted = item.quantity - alreadyReturned;
                if (stillDeducted > 0) {
                    await adjustProductStock(item.productId, stillDeducted);
                }
            }
            updates.items = currentItems.map(i => ({ ...i, returnedQuantity: i.quantity }));
            updates.returnedQuantity = currentItems.reduce((acc, curr) => acc + curr.quantity, 0);
            updates.deliveredQuantity = 0;
        }

        // Save the updated order
        await saveOrder({ ...order, ...updates });
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const currentItems = getOrderItems(formData);

            if (editingOrder && editingOrder.id) {
                const oldItems = getOrderItems(editingOrder);
                const wasActive = !['لاغي', 'مرفوض'].includes(editingOrder.status);

                // If items changed, adjust stock (only if the order was taking stock at all)
                if (wasActive && JSON.stringify(oldItems) !== JSON.stringify(currentItems)) {
                    // Refund old products stock
                    for (const item of oldItems) {
                        const amt = editingOrder.status === 'تسليم جزئي'
                            ? (item.quantity - (item.returnedQuantity || 0))
                            : item.quantity;
                        if (amt > 0) await adjustProductStock(item.productId, amt);
                    }
                    // Deduct new products stock
                    for (const item of currentItems) {
                        const amt = editingOrder.status === 'تسليم جزئي'
                            ? (item.quantity - (item.returnedQuantity || 0))
                            : item.quantity;
                        if (amt > 0) await adjustProductStock(item.productId, -amt);
                    }
                }

                if (editingOrder.status !== formData.status) {
                    const tempOrder = { ...formData, status: editingOrder.status };
                    await saveOrder(tempOrder);
                    await handleStatusChange(tempOrder, formData.status);
                } else {
                    await saveOrder(formData);
                }
            } else {
                // New order: stock DOES get deducted immediately unless it's created as inactive!
                const orderToSave = { ...formData, id: formData.id || crypto.randomUUID(), updated_at: Date.now() };
                const isNewActive = !['لاغي', 'مرفوض'].includes(orderToSave.status);
                if (isNewActive) {
                    for (const item of currentItems) {
                        await adjustProductStock(item.productId, -Number(item.quantity));
                    }
                }
                await saveOrder(orderToSave);
            }
        } finally {
            setIsSaving(false);
            closeForm();
        }
    };

    const handleDelete = async (id?: string) => {
        if (!id) return;
        const orderToDelete = orders.find(o => o.id === id);
        if (!orderToDelete) return;

        showAlert({
            title: 'تأكيد الحذف',
            message: 'هل أنت متأكد من حذف الطلب نهائياً؟',
            type: 'confirm',
            confirmText: 'حذف',
            onConfirm: async () => {
                // Refund stock if the order was taking up stock
                const wasActive = !['لاغي', 'مرفوض'].includes(orderToDelete.status);
                if (wasActive) {
                    const items = getOrderItems(orderToDelete);
                    for (const item of items) {
                        const amt = orderToDelete.status === 'تسليم جزئي'
                            ? (item.quantity - (item.returnedQuantity || 0))
                            : item.quantity;
                        if (amt > 0) await adjustProductStock(item.productId, amt);
                    }
                }

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

    const downloadTemplate = () => {
        const headers = [
            'اسم العميل',
            'الهاتف',
            'رقم إضافي',
            'المحافظة',
            'العنوان',
            'شركة الشحن',
            'منتج 1',
            'كمية 1',
            'منتج 2',
            'كمية 2',
            'منتج 3',
            'كمية 3',
            'مدة التنبيه (يوم)',
            'ملاحظات'
        ];

        const ws = xlsx.utils.aoa_to_sheet([headers]);
        ws['!cols'] = [
            { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 32 },
            { wch: 18 }, { wch: 22 }, { wch: 8 }, { wch: 22 }, { wch: 8 },
            { wch: 22 }, { wch: 8 }, { wch: 16 }, { wch: 28 }
        ];

        // Reference sheet: shippers + products
        const refHeaders = ['شركة الشحن', 'المحافظة', 'سعر الشحن', '', 'اسم المنتج', 'سعر البيع'];
        const allRates = shippers.flatMap(s => s.rates.map(r => ({ shipper: s.name, gov: r.governorate, price: r.price })));
        const maxRows = Math.max(allRates.length, products.length);
        const refRows: any[][] = [refHeaders];
        for (let i = 0; i < maxRows; i++) {
            refRows.push([
                allRates[i]?.shipper || '',
                allRates[i]?.gov || '',
                allRates[i]?.price || '',
                '',
                products[i]?.name || '',
                products[i]?.sellPrice || ''
            ]);
        }
        const wsRef = xlsx.utils.aoa_to_sheet(refRows);
        wsRef['!cols'] = [{ wch: 20 }, { wch: 16 }, { wch: 12 }, { wch: 4 }, { wch: 24 }, { wch: 10 }];

        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'قالب الطلبات');
        xlsx.utils.book_append_sheet(wb, wsRef, 'مرجع المنتجات والشحن');
        xlsx.writeFile(wb, 'قالب_استيراد_الطلبات.xlsx');
    };


    const importExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target?.result;
            const wb = xlsx.read(bstr, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            // Read as array-of-arrays to use column index (avoids merged header issues)
            const raw: any[][] = xlsx.utils.sheet_to_json(ws, { header: 1 });

            // Find header row (first row with 'اسم العميل')
            const headerRowIdx = raw.findIndex(row =>
                row.some((cell: any) => typeof cell === 'string' && cell.includes('اسم العميل'))
            );
            if (headerRowIdx === -1) return alert('لم يتم إيجاد صف العناوين. تأكد من استخدام القالب الصحيح.');

            const headers: string[] = raw[headerRowIdx].map((h: any) => String(h || '').trim());
            const col = (name: string) => headers.findIndex(h => h.includes(name));

            // Column indices from our template
            const C = {
                name: col('اسم العميل'),
                phone: col('الهاتف'),
                altPhone: col('رقم إضافي'),
                shipper: col('شركة الشحن'),
                gov: col('المحافظة'),
                address: col('العنوان'),
                p1: col('منتج 1'),
                q1: col('كمية 1'),
                p2: col('منتج 2'),
                q2: col('كمية 2'),
                p3: col('منتج 3'),
                q3: col('كمية 3'),
                days: col('مدة التنبيه'),
                notes: col('ملاحظات'),
            };

            const fuzzy = (list: { id?: string; name: string }[], text: string) => {
                if (!text?.trim()) return undefined;
                const t = text.trim().toLowerCase();
                return (
                    list.find(i => i.name.toLowerCase() === t) ||
                    list.find(i => i.name.toLowerCase().includes(t)) ||
                    list.find(i => t.includes(i.name.toLowerCase()))
                );
            };

            const get = (row: any[], idx: number) =>
                idx >= 0 ? String(row[idx] ?? '').trim() : '';

            let imported = 0;
            let skipped = 0;

            // Process data rows (skip header + description rows)
            const dataRows = raw.slice(headerRowIdx + 1);
            for (const row of dataRows) {
                const customerName = get(row, C.name);
                const phone = get(row, C.phone);
                // Skip empty or description rows
                if (!customerName || !phone) { skipped++; continue; }

                try {
                    const shipperText = get(row, C.shipper);
                    const govText = get(row, C.gov);

                    // Match shipper
                    const sMatch = fuzzy(shippers.map(s => ({ id: s.id, name: s.name })), shipperText);
                    const shipper = shippers.find(s => s.id === sMatch?.id);

                    // Match governorate rate
                    const rate = shipper?.rates.find(r =>
                        r.governorate.toLowerCase().includes(govText.toLowerCase()) ||
                        govText.toLowerCase().includes(r.governorate.toLowerCase())
                    );
                    const shippingCost = rate?.price || 0;
                    const shippingDiscount = rate?.discount || 0;

                    // Match products
                    const buildItem = (pText: string, qText: string): OrderItem | null => {
                        if (!pText) return null;
                        const pMatch = fuzzy(products.map(p => ({ id: p.id, name: p.name })), pText);
                        if (!pMatch?.id) return null;
                        return { productId: pMatch.id, quantity: Number(qText) || 1 };
                    };

                    const items: OrderItem[] = [
                        buildItem(get(row, C.p1), get(row, C.q1)),
                        buildItem(get(row, C.p2), get(row, C.q2)),
                        buildItem(get(row, C.p3), get(row, C.q3)),
                    ].filter(Boolean) as OrderItem[];

                    const totalPrice = items.reduce((sum, item) => {
                        const p = products.find(p => p.id === item.productId);
                        return sum + (p?.sellPrice || 0) * item.quantity;
                    }, 0) + (shippingCost - shippingDiscount);

                    const deliveryDaysStr = get(row, C.days);

                    const newOrder: Order = {
                        id: crypto.randomUUID(),
                        customerName,
                        phone,
                        altPhone: get(row, C.altPhone) || undefined,
                        governorate: govText,
                        address: get(row, C.address),
                        shipperId: shipper?.id || '',
                        shippingCost,
                        discount: 0,
                        totalPrice,
                        status: 'تحت المراجعة',
                        date: new Date().toISOString(),
                        items: items.length > 0 ? items : undefined,
                        deliveryDays: deliveryDaysStr ? Number(deliveryDaysStr) : undefined,
                        notes: get(row, C.notes) || undefined,
                        updated_at: Date.now(),
                    };
                    await saveOrder(newOrder);
                    imported++;
                } catch (err) {
                    console.error('Row import failed', row, err);
                    skipped++;
                }
            }
            const msg = skipped > 0
                ? `✅ تم استيراد ${imported} طلب بنجاح (${skipped} صف تم تجاهله)`
                : `✅ تم استيراد ${imported} طلب بنجاح!`;
            alert(msg);
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsBinaryString(file);
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'تحت المراجعة': return 'badge-warning';
            case 'تم الشحن': return 'badge-info';
            case 'تم التوصيل': return 'badge-success';
            case 'تسليم جزئي': return 'badge-success';
            case 'لاغي': return 'badge-danger';
            case 'مرفوض': return 'badge-danger';
            default: return 'badge-warning';
        }
    };

    const getStatusRowBg = (status: OrderStatus): string => {
        switch (status) {
            case 'تحت المراجعة': return '#fffdf0';
            case 'تم الشحن': return '#eff6ff';
            case 'تم التوصيل': return '#f0fdf4';
            case 'تسليم جزئي': return '#f0fdfa';
            case 'لاغي': return '#f8fafc';
            case 'مرفوض': return '#fef2f2';
            default: return 'transparent';
        }
    };

    const uniqueGovernorates = Array.from(new Set(orders.map(o => o.governorate).filter(Boolean))).sort();

    const filteredOrders = orders.filter(o => {
        const matchesSearch = o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.phone.includes(searchTerm) ||
            o.governorate.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.status.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'الكل' || o.status === statusFilter;
        const matchesShipper = shipperFilter === 'الكل' || o.shipperId === shipperFilter;
        const matchesGovernorate = governorateFilter === 'الكل' || o.governorate === governorateFilter;

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

        return matchesSearch && matchesStatus && matchesShipper && matchesGovernorate && matchesDate;
    });

    const submitReturnCost = async () => {
        if (statusPrompt.order) {
            await handleStatusChange(statusPrompt.order, statusPrompt.newStatus, {
                cost: statusPrompt.cost,
                returnedItems: statusPrompt.returnedItems
            });
            setStatusPrompt({ isOpen: false, order: null, newStatus: 'لاغي', cost: 0, returnedItems: [] });
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
                    <h1 style={{ margin: 0 }}>{editingOrder ? `تعديل الطلب #${formatId(editingOrder.id)}` : 'إضافة طلب جديد'}</h1>
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
                                <label>تاريخ الطلب والوقت</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={formData.date ? format(new Date(formData.date), "yyyy-MM-dd'T'HH:mm") : ''}
                                    onChange={(e) => handleFormChange('date', new Date(e.target.value).toISOString())}
                                />
                            </div>
                        </div>

                        {/* Dynamic Products List */}
                        <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <label style={{ margin: 0, fontWeight: 'bold' }}>المنتجات المطلوبة <span style={{ color: 'red' }}>*</span></label>
                                <button type="button" className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }} onClick={() => {
                                    const newItems = [...(formData.items || []), { productId: products[0]?.id || '', quantity: 0, returnedQuantity: undefined }];
                                    handleFormChange('items', newItems);
                                }}>
                                    <Plus size={16} /> إضافة منتج آخر
                                </button>
                            </div>

                            {(formData.items || [{ productId: formData.productId || '', quantity: formData.quantity || 0, returnedQuantity: undefined }]).map((item, index, arr) => (
                                <div key={index} className="form-grid" style={{ gridTemplateColumns: 'minmax(200px, 2fr) 100px 40px', alignItems: 'flex-end', marginBottom: index !== arr.length - 1 ? '1rem' : 0 }}>
                                    <div>
                                        <label style={{ fontSize: '0.85rem' }}>المنتج</label>
                                        <SearchableSelect
                                            options={products.map(p => ({ value: p.id!, label: `${p.name} (${p.sellPrice} ج.م) - متاح: ${p.stock}` }))}
                                            value={item.productId}
                                            onChange={(val) => {
                                                const newItems = [...arr];
                                                newItems[index].productId = val;
                                                handleFormChange('items', newItems);
                                            }}
                                            placeholder="ابحث عن منتج..."
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem' }}>الكمية</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="input"
                                            required
                                            value={item.quantity === 0 ? '' : item.quantity}
                                            onChange={e => {
                                                const newItems = [...arr];
                                                newItems[index].quantity = Number(e.target.value);
                                                handleFormChange('items', newItems);
                                            }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        style={{ height: '42px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger-color)', backgroundColor: 'transparent', border: 'none', cursor: arr.length <= 1 ? 'not-allowed' : 'pointer', opacity: arr.length <= 1 ? 0.5 : 1 }}
                                        onClick={() => {
                                            if (arr.length <= 1) return;
                                            const newItems = [...arr];
                                            newItems.splice(index, 1);
                                            handleFormChange('items', newItems);
                                        }}
                                        disabled={arr.length <= 1}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="form-grid">
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
                                <label>خصم إضافي (ج.م)</label>
                                <input type="number" min="0" value={formData.discount === 0 ? '' : formData.discount} onChange={e => handleFormChange('discount', Number(e.target.value))} />
                            </div>
                            <div>
                                <label>تكلفة الشحن الآلية (ج.م)</label>
                                <input type="number" disabled value={formData.shippingCost} style={{ backgroundColor: '#f1f5f9' }} />
                            </div>
                            <div>
                                <label title="يُرسل إشعار إذا بقي الطلب في 'تم الشحن' أكثر من هذه المدة">مدة التوصيل المتوقعة (يوم) 🔔</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="60"
                                    placeholder="مثال: 5"
                                    value={formData.deliveryDays === undefined || formData.deliveryDays === 0 ? '' : formData.deliveryDays}
                                    onChange={e => handleFormChange('deliveryDays', e.target.value === '' ? undefined : Number(e.target.value))}
                                />
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
                                        <div style={{ fontSize: '0.95rem', fontFamily: 'monospace', fontWeight: 'bold' }}>رقم: #{formatId(order.id)}</div>
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
                                                    <td style={{ padding: '0.5rem 0.75rem', border: '1px solid #ccc' }}>
                                                        {getOrderItems(order).map((i, idx) => {
                                                            const p = products.find(prod => prod.id === i.productId);
                                                            return <div key={idx} style={{ marginBottom: '0.2rem' }}>- {p ? p.name : 'منتج محذوف'} &times; {i.quantity}</div>;
                                                        })}
                                                    </td>
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

            {/* Dynamic Return Cost & Partial Delivery Overlay Modal */}
            {statusPrompt.isOpen && statusPrompt.order && createPortal(
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', margin: 0, animation: 'fadeIn 0.2s ease-out' }}>
                        <h2 style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>تسجيل حالة الطلب #{formatId(statusPrompt.order?.id)}</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            أنت تقوم بتحويل حالة الطلب إلى <strong style={{ color: statusPrompt.newStatus === 'تسليم جزئي' ? 'var(--primary-color)' : 'var(--danger-color)' }}>{statusPrompt.newStatus}</strong>.
                            {statusPrompt.newStatus === 'تسليم جزئي' ? 'يرجى تحديد الكمية المستلمة والمرفوضة بدقة، بالإضافة لتكلفة المرتجع إن وجدت.' : 'هذا الطلب سيعود المخزون. أدخل تكلفة المرتجع الخاصة بشركة الشحن إن وجدت.'}
                        </p>

                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {statusPrompt.returnedItems.map((item, index) => {
                                const product = products.find(p => p.id === item.productId);
                                const orderedItem = getOrderItems(statusPrompt.order!).find(i => i.productId === item.productId);
                                const totalQty = orderedItem ? orderedItem.quantity : 0;
                                return (
                                    <div key={item.productId} style={{ marginBottom: '1rem', textAlign: 'right', padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>{product?.name || 'منتج محذوف'} (المطلوب: {totalQty})</div>
                                        <div>
                                            <label>{statusPrompt.newStatus === 'تسليم جزئي' ? 'كم قطعة تم رفضها / إرجاعها من هذا المنتج؟' : 'الكمية المرتجعة'}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max={totalQty}
                                                className="input"
                                                value={item.returnedQuantity === 0 ? '' : item.returnedQuantity}
                                                onChange={(e) => {
                                                    let val = Number(e.target.value);
                                                    if (val < 0) val = 0;
                                                    if (val > totalQty) val = totalQty;

                                                    const newArr = [...statusPrompt.returnedItems];
                                                    newArr[index].returnedQuantity = val;
                                                    setStatusPrompt({ ...statusPrompt, returnedItems: newArr });
                                                }}
                                                placeholder={`0 إلى ${totalQty}`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ marginBottom: '1.5rem', textAlign: 'right' }}>
                            <label>تكلفة المرتجع لشركة الشحن إن وجدت (ج.م)</label>
                            <input
                                type="number"
                                min="0"
                                className="input"
                                autoFocus={statusPrompt.newStatus !== 'تسليم جزئي'}
                                value={statusPrompt.cost === 0 ? '' : statusPrompt.cost}
                                onChange={(e) => setStatusPrompt({ ...statusPrompt, cost: Number(e.target.value) })}
                                placeholder="مثال: 50"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStatusPrompt({ isOpen: false, order: null, newStatus: 'لاغي', cost: 0, returnedItems: [] })}>
                                إلغاء التعديل
                            </button>
                            <button className="btn btn-primary" style={{ flex: 1, backgroundColor: statusPrompt.newStatus === 'تسليم جزئي' ? 'var(--primary-color)' : 'var(--danger-color)' }} onClick={submitReturnCost}>
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
                    <button className="btn btn-outline" style={{ color: '#7c3aed' }} onClick={downloadTemplate} title="تحميل قالب الاستيراد الفارغ">
                        <Download size={18} /> تحميل القالب
                    </button>
                    <button className="btn btn-outline" style={{ color: 'var(--success-color)' }} onClick={exportExcel}>
                        <Download size={18} /> تصدير إكسيل
                    </button>
                    <button className="btn btn-outline" style={{ color: 'var(--text-secondary)', position: 'relative' }} onClick={() => setIsFilterOpen(!isFilterOpen)}>
                        <Filter size={18} /> {isFilterOpen ? 'إخفاء الفلاتر' : 'تصفية وبحث'}
                        {(() => {
                            const count = [searchTerm !== '', statusFilter !== 'الكل', shipperFilter !== 'الكل', governorateFilter !== 'الكل', dateFrom !== '', dateTo !== ''].filter(Boolean).length;
                            return count > 0 ? <span style={{ position: 'absolute', top: '-6px', left: '-6px', background: 'var(--primary-color)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{count}</span> : null;
                        })()}
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

                        <div style={{ flex: '1 1 150px' }}>
                            <select
                                className="input"
                                value={governorateFilter}
                                onChange={(e) => setGovernorateFilter(e.target.value)}
                            >
                                <option value="الكل">كل المحافظات</option>
                                {uniqueGovernorates.map(g => <option key={g} value={g}>{g}</option>)}
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

                        {(searchTerm !== '' || statusFilter !== 'الكل' || shipperFilter !== 'الكل' || governorateFilter !== 'الكل' || dateFrom !== '' || dateTo !== '') && (
                            <button
                                className="btn btn-outline"
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('الكل');
                                    setShipperFilter('الكل');
                                    setGovernorateFilter('الكل');
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
                            <th>المحافظة / شركة الشحن</th>
                            <th>المنتج</th>
                            <th>الإجمالي</th>
                            <th>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(order => {
                            return (
                                <tr key={order.id} onClick={(e) => {
                                    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.badge') || (e.target as HTMLElement).closest('input[type="checkbox"]')) return;
                                    setViewOrder(order);
                                }} style={{
                                    cursor: 'pointer',
                                    transition: 'background-color 0.3s ease',
                                    backgroundColor: highlightOrderId === order.id ? '#fef9c3' : getStatusRowBg(order.status),
                                    outline: highlightOrderId === order.id ? '2px solid #eab308' : undefined,
                                    borderRight: `3px solid ${order.status === 'تحت المراجعة' ? '#f59e0b' :
                                        order.status === 'تم الشحن' ? '#3b82f6' :
                                            order.status === 'تم التوصيل' ? '#10b981' :
                                                order.status === 'تسليم جزئي' ? '#14b8a6' :
                                                    order.status === 'لاغي' ? '#94a3b8' : '#ef4444'
                                        }`,
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
                                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                                        #{formatId(order.id)}
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
                                    <td style={{ fontWeight: 500 }}>
                                        <div>{order.customerName}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', direction: 'ltr' }}>{order.phone}</div>
                                    </td>
                                    <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                        <div style={{ direction: 'ltr' }}>{format(new Date(order.date), 'dd/MM/yyyy')}</div>
                                        <div style={{ direction: 'ltr', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{format(new Date(order.date), 'hh:mm a')}</div>
                                    </td>
                                    <td>
                                        <StatusDropdown
                                            order={order}
                                            getStatusColor={getStatusColor}
                                            handleStatusChange={handleStatusChange}
                                        />
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{order.governorate}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {(() => { const s = shippers.find(x => x.id === order.shipperId); return s ? s.name : '—'; })()}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                            {getOrderItems(order).map((i, idx) => {
                                                const p = products.find(prod => prod.id === i.productId);
                                                return (
                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
                                                        <span style={{
                                                            display: 'inline-block', minWidth: '22px', textAlign: 'center',
                                                            backgroundColor: 'var(--primary-color)', color: '#fff',
                                                            borderRadius: '4px', fontWeight: '700', padding: '1px 5px', fontSize: '0.75rem'
                                                        }}>{i.quantity}{i.returnedQuantity ? <span style={{ color: '#fca5a5' }}>-{i.returnedQuantity}</span> : null}</span>
                                                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p ? p.name : 'محذوف'}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 600, color: 'var(--primary-color)', whiteSpace: 'nowrap' }}>{order.totalPrice} ج.م</td>
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
                                <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
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
                                        طلب #{formatId(order.id)}
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
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>تفاصيل الطلب #{formatId(viewOrder.id)}</h2>
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
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
                                        {getOrderItems(viewOrder).map((i, idx) => {
                                            const p = products.find(prod => prod.id === i.productId);
                                            return (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-color)' }}></span>
                                                    {p ? p.name : 'منتج محذوف'} (x{i.quantity})
                                                    {i.returnedQuantity ? <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginRight: '0.5rem' }}>مرتجع: {i.returnedQuantity}</span> : null}
                                                </div>
                                            );
                                        })}
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
