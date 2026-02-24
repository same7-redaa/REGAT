import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Shippers from './pages/Shippers';
import Orders from './pages/Orders';
import Returns from './pages/Returns';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import { DatabaseProvider } from './contexts/DatabaseContext';
import { AlertProvider } from './contexts/AlertContext';
import { NotificationProvider } from './contexts/NotificationContext';

function App() {
  return (
    <DatabaseProvider>
      <AlertProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="shippers" element={<Shippers />} />
                <Route path="orders" element={<Orders />} />
                <Route path="returns" element={<Returns />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AlertProvider>
    </DatabaseProvider>
  );
}

export default App;
