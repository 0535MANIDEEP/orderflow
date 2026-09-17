import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ProductCatalog } from './pages/ProductCatalog'
import { Cart } from './pages/Cart'
import { OrderConfirmation } from './pages/OrderConfirmation'
import { OrderTracking } from './pages/OrderTracking'
import { AdminDashboard } from './pages/AdminDashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProductCatalog />} />
        <Route path="/products" element={<ProductCatalog />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/order/confirm/:orderNumber" element={<OrderConfirmation />} />
        <Route path="/order/:orderNumber" element={<OrderTracking />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
