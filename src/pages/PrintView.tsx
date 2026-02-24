import { useState } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { format } from 'date-fns';

export default function PrintView() {
    const { orders: allOrders, products } = useDatabase();

    // By default select orders under review
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Toggle selection
    const toggleOrder = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const selectUnderReview = () => {
        const ids = allOrders.filter(o => o.status === 'تحت المراجعة').map(o => o.id!);
        setSelectedIds(ids);
    };

    const handlePrint = () => {
        window.print();
    };

    const ordersToPrint = allOrders.filter(o => selectedIds.includes(o.id!));

    return (
        <div>
            <div className="no-print" style={{ marginBottom: '2rem' }}>
                <div className="flex justify-end items-center" style={{ marginBottom: '1.5rem' }}>
                    <div className="flex gap-2">
                        <button className="btn btn-outline" onClick={selectUnderReview}>
                            تحديد "تحت المراجعة"
                        </button>
                        <button className="btn btn-primary" onClick={handlePrint} disabled={ordersToPrint.length === 0}>
                            طباعة المحدد ({ordersToPrint.length})
                        </button>
                    </div>
                </div>

                <div className="card" style={{ padding: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                    <table style={{ margin: 0 }}>
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>تحديد</th>
                                <th>رقم الطلب</th>
                                <th>العميل</th>
                                <th>المدينة</th>
                                <th>الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allOrders.map(order => (
                                <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => toggleOrder(order.id!)}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(order.id!)}
                                            onChange={() => toggleOrder(order.id!)}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                    </td>
                                    <td>#{order.id}</td>
                                    <td>{order.customerName}</td>
                                    <td>{order.governorate}</td>
                                    <td><span className="badge badge-info">{order.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Print Area */}
            <div className="print-only">
                <style>
                    {`
            @media print {
              .print-container {
                display: grid;
                grid-template-columns: 1fr; /* 1 ticket per row on A4 for very large size, or 2fr for A5? User said 1 on an A5 or 2 on A4. We'll use page-break to handle it nicely */
                gap: 2rem;
              }
              .ticket {
                page-break-inside: avoid;
                border: 2px solid #000;
                padding: 0;
                margin-bottom: 2rem;
                font-family: "stc", sans-serif;
              }
              .ticket-table {
                width: 100%;
                border-collapse: collapse;
              }
              .ticket-table td, .ticket-table th {
                border: 1px solid #000;
                padding: 0.5rem;
                text-align: right;
                font-size: 1.1rem;
                color: #000;
              }
              .label-cell {
                background-color: #f3f4f6;
                font-weight: bold;
                width: 15%;
              }
              .value-cell {
                width: 35%;
              }
              .header-row {
                display: flex;
                justify-content: space-between;
                padding: 1rem;
                border-bottom: 1px solid #000;
              }
              .logo-box {
                font-weight: bold;
                font-size: 1.5rem;
                text-align: center;
              }
              .number-box {
                border: 1px solid #000;
                padding: 0.5rem 1rem;
                font-size: 1.25rem;
                font-weight: bold;
              }
            }
          `}
                </style>

                <div className="print-container">
                    {ordersToPrint.map((order, index) => {
                        const product = products.find(p => p.id === order.productId);
                        return (
                            <div className="ticket" key={order.id}>

                                <div className="header-row">
                                    <div className="logo-box">REGAT</div>
                                    <div></div>
                                    <div className="number-box">{index + 1}</div>
                                </div>

                                <table className="ticket-table">
                                    <tbody>
                                        <tr>
                                            <td className="label-cell">الاسم</td>
                                            <td className="value-cell" colSpan={2}>{order.customerName}</td>
                                            <td className="label-cell">تاريخ الطلب</td>
                                            <td className="value-cell" style={{ borderLeft: 'none', direction: 'ltr', textAlign: 'right' }}>{format(new Date(order.date), 'yyyy/MM/dd hh:mm a')}</td>
                                        </tr>
                                        <tr>
                                            <td className="label-cell">رقم الهاتف</td>
                                            <td className="value-cell" style={{ direction: 'ltr', textAlign: 'right' }} colSpan={2}>{order.phone}</td>
                                            <td className="label-cell">رقم اضافي</td>
                                            <td className="value-cell" style={{ direction: 'ltr', textAlign: 'right', borderLeft: 'none' }}>{order.altPhone || '---'}</td>
                                        </tr>
                                        <tr>
                                            <td className="label-cell">المحافظه</td>
                                            <td className="value-cell" colSpan={2}>{order.governorate}</td>
                                            <td className="label-cell">نوع المنتج</td>
                                            <td className="value-cell" style={{ borderLeft: 'none' }}>{product ? product.name : ''}</td>
                                        </tr>
                                        <tr>
                                            <td className="label-cell">العنوان تفصيلي</td>
                                            <td colSpan={4} style={{ borderLeft: 'none' }}>{order.address}</td>
                                        </tr>
                                        <tr>
                                            <td className="label-cell">الاجمالي</td>
                                            <td colSpan={4} style={{ fontWeight: 'bold', fontSize: '1.25rem', borderLeft: 'none' }}>{order.totalPrice} ج.م</td>
                                        </tr>
                                        <tr>
                                            <td className="label-cell">ملاحظات</td>
                                            <td colSpan={4} style={{ minHeight: '50px', borderLeft: 'none' }}>{order.notes || ' '}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
