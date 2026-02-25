import { AlertCircle, PackageCheck, Truck, XCircle, DollarSign, TrendingUp, TrendingDown, Layers, Search, ShoppingCart, PackageSearch, Filter } from 'lucide-react';
import { differenceInDays, isToday } from 'date-fns';
import { useState } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { getOrderItems } from '../db/db';

export default function Dashboard() {
    const { orders, expenses, products } = useDatabase();

    const [searchTerm, setSearchTerm] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Metrics
    const totalOrders = orders.length;
    const underReview = orders.filter(o => o.status === 'تحت المراجعة').length;
    const shipped = orders.filter(o => o.status === 'تم الشحن').length;
    const delivered = orders.filter(o => o.status === 'تم التوصيل').length;
    const returnedOrCanceled = orders.filter(o => o.status === 'مرفوض' || o.status === 'لاغي').length;

    // Financial Metrics Calculation
    // 1. Sales Revenue (From Delivered and Partially Delivered Orders)
    const totalSalesRevenue = orders
        .filter(o => o.status === 'تم التوصيل' || o.status === 'تسليم جزئي')
        .reduce((sum, o) => {
            // For partial deliveries, ideally totalPrice was already adjusted when the order was saved.
            // If the user hasn't adjusted the total price manually, this will just take the recorded total.
            return sum + o.totalPrice;
        }, 0);

    // 2. Cost of Goods Sold (COGS) for Delivered & Partially Delivered
    const costOfGoodsSold = orders
        .filter(o => o.status === 'تم التوصيل' || o.status === 'تسليم جزئي')
        .reduce((sum, order) => {
            const items = getOrderItems(order);
            let orderCogs = 0;
            for (const item of items) {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    const qtySold = order.status === 'تسليم جزئي'
                        ? (item.quantity - (item.returnedQuantity || 0))
                        : item.quantity;
                    orderCogs += product.purchasePrice * qtySold;
                }
            }
            return sum + orderCogs;
        }, 0);

    // 3. Return Fees (Explicitly logged on Orders)
    const returnFees = orders.reduce((sum, order) => {
        return sum + (order.returnCost || 0);
    }, 0);

    // 4. Shipping Costs PAID to shipping companies (for successful orders)
    // Assuming shippingCost here is the cost paid.
    const shippingCostsPaid = orders
        .filter(o => o.status === 'تم التوصيل' || o.status === 'تسليم جزئي')
        .reduce((sum, order) => sum + order.shippingCost, 0);

    // 5. General Expenses (Ads, Salaries, etc.) - Completely separate from returns
    const generalExpenses = expenses
        .filter(e => !e.category.includes('مرتجع شحن'))
        .reduce((sum, e) => sum + e.amount, 0);

    // 6. Gross Profit (Revenue - COGS)
    const grossProfit = totalSalesRevenue - costOfGoodsSold;

    // 7. Net Profit (Gross Profit - Return Fees - Paid Shipping - General Expenses)
    const netProfit = grossProfit - returnFees - shippingCostsPaid - generalExpenses;

    // 8. Product-only profit (totals only, independent of shipping/expenses)
    let totalUnitsSold = 0;
    let totalSalesFromProducts = 0;
    let totalProductProfit = 0;
    orders
        .filter(o => o.status === 'تم التوصيل' || o.status === 'تسليم جزئي')
        .forEach(order => {
            getOrderItems(order).forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (!product) return;
                const deliveredQty = order.status === 'تسليم جزئي'
                    ? item.quantity - (item.returnedQuantity || 0)
                    : item.quantity;
                totalUnitsSold += deliveredQty;
                totalSalesFromProducts += product.sellPrice * deliveredQty;
                totalProductProfit += (product.sellPrice - product.purchasePrice) * deliveredQty;
            });
        });

    // Today's Stats
    const todaysOrders = orders.filter(o => isToday(new Date(o.date))).length;
    const todaysSales = orders.filter(o => o.status === 'تم التوصيل' && isToday(new Date(o.date))).reduce((sum, o) => sum + o.totalPrice, 0);

    // Delayed Shipments Logic (e.g., shipped > 3 days ago but not delivered)
    const delayedShipments = orders.filter(o => {
        if (o.status === 'تم الشحن' && o.shipDate) {
            const days = differenceInDays(new Date(), new Date(o.shipDate));
            return days >= 3;
        }
        return false;
    });

    const searchResultsOrders = searchTerm ? orders.filter(o => o.customerName.includes(searchTerm) || o.phone.includes(searchTerm) || o.id?.toString() === searchTerm) : [];
    const searchResultsProducts = searchTerm ? products.filter(p => p.name.includes(searchTerm)) : [];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <button className="btn btn-outline" style={{ color: 'var(--text-secondary)' }} onClick={() => setIsFilterOpen(!isFilterOpen)}>
                    <Filter size={18} /> {isFilterOpen ? 'إخفاء البحث' : 'بحث متقدم'}
                </button>
            </div>

            {isFilterOpen && (
                <div className="card" style={{ marginBottom: '1.5rem', animation: 'fadeIn 0.2s ease-out' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            className="input"
                            placeholder="بحث عام عن عميل، رقم هاتف، أو منتج..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingRight: '2.5rem' }}
                        />
                    </div>
                </div>
            )}

            {searchTerm ? (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {searchResultsOrders.length > 0 && (
                        <div>
                            <div className="card table-responsive hidden-mobile">
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>
                                    <ShoppingCart size={20} /> نتائج الطلبات ({searchResultsOrders.length})
                                </h3>
                                <table style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>رقم</th>
                                            <th>العميل</th>
                                            <th>الحالة</th>
                                            <th>الإجمالي</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {searchResultsOrders.map(o => (
                                            <tr key={o.id}>
                                                <td style={{ fontWeight: 600 }}>#{o.id}</td>
                                                <td>{o.customerName} - {o.phone}</td>
                                                <td><span className="badge badge-info">{o.status}</span></td>
                                                <td>{o.totalPrice} ج.م</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="hidden-desktop">
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>
                                    <ShoppingCart size={20} /> نتائج الطلبات ({searchResultsOrders.length})
                                </h3>
                                {searchResultsOrders.map(o => (
                                    <div key={o.id} className="mobile-card" style={{ cursor: 'default' }}>
                                        <div className="mobile-card-header">
                                            <span>طلب #{o.id}</span>
                                            <span className="badge badge-info">{o.status}</span>
                                        </div>
                                        <div className="mobile-card-row">
                                            <span>العميل:</span>
                                            <strong>{o.customerName} - {o.phone}</strong>
                                        </div>
                                        <div className="mobile-card-row">
                                            <span>الإجمالي:</span>
                                            <strong>{o.totalPrice} ج.م</strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {searchResultsProducts.length > 0 && (
                        <div>
                            <div className="card table-responsive hidden-mobile">
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--success-color)' }}>
                                    <PackageSearch size={20} /> نتائج المنتجات ({searchResultsProducts.length})
                                </h3>
                                <table style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>المنتج</th>
                                            <th>السعر</th>
                                            <th>المخزون المتوفر</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {searchResultsProducts.map(p => (
                                            <tr key={p.id}>
                                                <td style={{ fontWeight: 600 }}>{p.name}</td>
                                                <td>{p.sellPrice} ج.م</td>
                                                <td><span className={p.stock <= 5 ? 'badge badge-danger' : 'badge badge-success'}>{p.stock}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="hidden-desktop">
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--success-color)' }}>
                                    <PackageSearch size={20} /> نتائج المنتجات ({searchResultsProducts.length})
                                </h3>
                                {searchResultsProducts.map(p => (
                                    <div key={p.id} className="mobile-card" style={{ cursor: 'default' }}>
                                        <div className="mobile-card-header">
                                            <span>{p.name}</span>
                                            <span className={p.stock <= 5 ? 'badge badge-danger' : 'badge badge-success'}>{p.stock} قطعة</span>
                                        </div>
                                        <div className="mobile-card-row">
                                            <span>السعر:</span>
                                            <strong>{p.sellPrice} ج.م</strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {searchResultsOrders.length === 0 && searchResultsProducts.length === 0 && (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            <Search size={48} style={{ opacity: 0.2, marginBottom: '1rem', display: 'inline-block' }} />
                            <p>لم يتم العثور على أي نتائج مطابقة لبحثك: "{searchTerm}"</p>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Delayed Alerts */}
                    {delayedShipments.length > 0 && (
                        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '1rem', color: '#b91c1c', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <AlertCircle size={24} />
                            <div>
                                <h4 style={{ margin: 0, fontWeight: 600 }}>تنبيه تأخير الشحنات!</h4>
                                <p style={{ margin: 0, fontSize: '0.875rem' }}>يوجد {delayedShipments.length} شحنة مع شركة الشحن لأكثر من 3 أيام ولم يتم تسليمها للعميل.</p>
                            </div>
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '4px solid var(--primary-color)' }}>
                            <div style={{ backgroundColor: '#eff6ff', padding: '1rem', color: 'var(--primary-color)' }}>
                                <PackageCheck size={24} />
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>إجمالي الطلبات المسجلة</p>
                                <h2 style={{ margin: 0, fontSize: '1.75rem' }}>{totalOrders}</h2>
                            </div>
                        </div>

                        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '4px solid var(--warning-color)' }}>
                            <div style={{ backgroundColor: '#fffbeb', padding: '1rem', color: 'var(--warning-color)' }}>
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>قيد المراجعة والانتظار</p>
                                <h2 style={{ margin: 0, fontSize: '1.75rem' }}>{underReview}</h2>
                            </div>
                        </div>

                        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '4px solid var(--info-color, #3b82f6)' }}>
                            <div style={{ backgroundColor: '#eff6ff', padding: '1rem', color: '#3b82f6' }}>
                                <Truck size={24} />
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>قيد الشحن (مع المندوب)</p>
                                <h2 style={{ margin: 0, fontSize: '1.75rem' }}>{shipped}</h2>
                            </div>
                        </div>

                        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '4px solid var(--success-color)' }}>
                            <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', color: 'var(--success-color)' }}>
                                <PackageCheck size={24} />
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>تم التوصيل بنجاح</p>
                                <h2 style={{ margin: 0, fontSize: '1.75rem' }}>{delivered}</h2>
                            </div>
                        </div>

                        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '4px solid var(--danger-color)' }}>
                            <div style={{ backgroundColor: '#fef2f2', padding: '1rem', color: 'var(--danger-color)' }}>
                                <XCircle size={24} />
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>مرفوض / لاغي</p>
                                <h2 style={{ margin: 0, fontSize: '1.75rem' }}>{returnedOrCanceled}</h2>
                            </div>
                        </div>
                    </div>

                    {/* Financial Overview */}
                    <h3 style={{ marginTop: '2.5rem', marginBottom: '1rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>التحليل المالي الدقيق</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

                        {/* Revenue */}
                        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#f8fafc' }}>
                            <div style={{ backgroundColor: '#e0f2fe', padding: '1rem', color: '#0284c7', borderRadius: '50%' }}>
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>إجمالي إيرادات المبيعات</p>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0284c7' }}>{totalSalesRevenue} ج.م</h2>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                    من الطلبات المسلمة والجزئية
                                </div>
                            </div>
                        </div>

                        {/* Gross Profit */}
                        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#f0fdfa' }}>
                            <div style={{ backgroundColor: '#ccfbf1', padding: '1rem', color: '#0d9488', borderRadius: '50%' }}>
                                <TrendingUp size={24} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>إجمالي الربح (قبل المصروفات)</p>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0d9488' }}>{grossProfit} ج.م</h2>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                    <span>- تكلفة بضاعة مباعة: {costOfGoodsSold} ج.م</span>
                                </div>
                            </div>
                        </div>

                        {/* Expenses & Costs */}
                        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#fcf8ff' }}>
                            <div style={{ backgroundColor: '#f3e8ff', padding: '1rem', color: '#9333ea', borderRadius: '50%' }}>
                                <Layers size={24} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>إجمالي التكاليف والمصروفات</p>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#9333ea' }}>{returnFees + shippingCostsPaid + generalExpenses} ج.م</h2>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                    <span>- تكلفة شحن (للطلبات الناجحة): {shippingCostsPaid} ج.م</span>
                                    <span>- تكلفة مرتجعات: {returnFees} ج.م</span>
                                    <span>- مصروفات عامة: {generalExpenses} ج.م</span>
                                </div>
                            </div>
                        </div>

                        {/* Net Profit */}
                        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: netProfit >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${netProfit >= 0 ? '#bbf7d0' : '#fecaca'}` }}>
                            <div style={{ backgroundColor: netProfit >= 0 ? '#dcfce7' : '#fee2e2', padding: '1rem', color: netProfit >= 0 ? '#16a34a' : '#dc2626', borderRadius: '50%' }}>
                                {netProfit >= 0 ? <DollarSign size={24} /> : <TrendingDown size={24} />}
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>صافي الربح النهائي المطهر</p>
                                <h2 style={{ margin: 0, fontSize: '1.75rem', color: netProfit >= 0 ? '#16a34a' : '#dc2626' }}>
                                    {netProfit} ج.م
                                </h2>
                                <span style={{ fontSize: '0.75rem', color: netProfit >= 0 ? '#15803d' : '#b91c1c' }}>
                                    {netProfit >= 0 ? 'أداء إيجابي ومربح' : 'أداء سلبي (خسارة)'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Product Profit Stats (totals only) */}
                    <h3 style={{ marginTop: '2.5rem', marginBottom: '1rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        📦 ملخص أرباح المنتجات (بمعزل عن الشحن والمصروفات)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <div className="card" style={{ textAlign: 'center', borderTop: '3px solid #3b82f6' }}>
                            <p style={{ margin: '0 0 0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>إجمالي القطع المسلمة</p>
                            <h2 style={{ margin: 0, fontSize: '2rem', color: '#3b82f6' }}>{totalUnitsSold}</h2>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>قطعة</span>
                        </div>
                        <div className="card" style={{ textAlign: 'center', borderTop: '3px solid #0284c7' }}>
                            <p style={{ margin: '0 0 0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>إجمالي البيع (بسعر البيع فقط)</p>
                            <h2 style={{ margin: 0, fontSize: '2rem', color: '#0284c7' }}>{totalSalesFromProducts.toLocaleString()}</h2>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ج.م</span>
                        </div>
                        <div className="card" style={{ textAlign: 'center', borderTop: `3px solid ${totalProductProfit >= 0 ? '#16a34a' : '#dc2626'}` }}>
                            <p style={{ margin: '0 0 0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>إجمالي ربح المنتجات</p>
                            <h2 style={{ margin: 0, fontSize: '2rem', color: totalProductProfit >= 0 ? '#16a34a' : '#dc2626' }}>{totalProductProfit.toLocaleString()}</h2>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ج.م (سعر البيع − سعر الشراء)</span>
                        </div>
                    </div>

                    {/* Grid for extra details */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        <div className="card">
                            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>نظرة سريعة لليوم</h3>
                            <div className="flex justify-between" style={{ marginBottom: '1rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>طلبات اليوم:</span>
                                <span style={{ fontWeight: 600 }}>{todaysOrders} طلب</span>
                            </div>
                            <div className="flex justify-between">
                                <span style={{ color: 'var(--text-secondary)' }}>مبيعات اليوم المسلمة:</span>
                                <span style={{ fontWeight: 600, color: 'var(--success-color)' }}>{todaysSales} ج.م</span>
                            </div>
                        </div>

                        <div className="card">
                            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>المنتجات التي توشك على النفاذ</h3>
                            <table style={{ width: '100%' }}>
                                <tbody>
                                    {products.filter(p => p.stock <= 5).map(p => (
                                        <tr key={p.id}>
                                            <td style={{ padding: '0.5rem 0' }}>{p.name}</td>
                                            <td style={{ padding: '0.5rem 0', textAlign: 'left' }}>
                                                <span className="badge badge-danger">متبقي: {p.stock}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {products.filter(p => p.stock <= 5).length === 0 && (
                                        <tr>
                                            <td colSpan={2} style={{ color: 'var(--text-secondary)' }}>المخزون بوضع آمن، لا توجد منتجات منخفضة الكمية.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
