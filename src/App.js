import './App.css';
import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './components/layout/navbar/navbar';
import BottomNav from './components/layout/bottomNav/bottomNav';

import Foryou from './pages/Foryou/Foryou';
import Events from './pages/Events/Events';
import EventDetail from './pages/Events/eventDetail/eventDetail';
import EventBooking from './pages/Events/eventBooking/EventBooking';

import AccessoriesPage from './pages/Accessories/AccessoriesPage';
import AccessoriesDetail from './pages/Accessories/accessoriesDetail/accessoriesDetail';
import Collection from './pages/Accessories/collection/collection';
import BikeBrandPage from './pages/Accessories/bikeBrandPage/bikeBrandPage';
import ProductsPage from './pages/Accessories/productPage/productsPage';
import BrandPage from './pages/Accessories/brands/brandPage';
import CartPage from './pages/Cart/CartPage';

import { AuthProvider } from './components/AuthModal/useAuthModal';
import { FirebaseAuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/profile/profile';
import ProfileOverview from './pages/profile/pages/ProfileOverview';
import MyRides from './pages/profile/pages/MyRides';
import Wishlist from './pages/profile/pages/Wishlist';
import Wallet from './pages/profile/pages/Wallet';
import MyOrders from './pages/profile/pages/MyOrders';
import Support from './pages/profile/pages/Support';

const AuthModal = lazy(() =>
  import('./components/AuthModal/AuthModal')
);

function App() {

  return (
    <AuthProvider>
      <FirebaseAuthProvider>
        <Router>
          <div className="app-container">
            <Navbar />
            <BottomNav />

            <Routes>
              <Route path="/" element={<Foryou />} />

              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/events/:id/book" element={<EventBooking />} />
              <Route path="/event/:id" element={<EventDetail />} />
              <Route path="/event/:id/book" element={<EventBooking />} />

              <Route path="/accessories" element={<AccessoriesPage />} />
              <Route path="/accessories/collection" element={<Collection />} />
              <Route
                path="/accessories/collection/:bike"
                element={<BikeBrandPage />}
              />
              <Route
                path="/accessories/:id"
                element={<AccessoriesDetail />}
              />
              <Route path="/product/:id" element={<AccessoriesDetail />} />
              <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
              <Route
                path="/accessories/products"
                element={<ProductsPage />}
              />
              <Route
                path="/accessories/products/:id"
                element={<ProductsPage />}
              />
              <Route path="/category/:id" element={<ProductsPage filterType="category" />} />
              <Route path="/brand/:id" element={<ProductsPage filterType="brand" />} />
              <Route path="/vendor/:id" element={<ProductsPage filterType="vendor" />} />
              <Route
                path="/accessories/brands"
                element={<BrandPage />}
              />

              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>}>
                <Route index element={<ProfileOverview />} />
                <Route path="events" element={<MyRides />} />
                <Route path="wishlist" element={<Wishlist />} />
                <Route path="accessories" element={<MyOrders />} />
                <Route path="wallet" element={<Wallet />} />
                <Route path="support" element={<Support />} />
              </Route>
            </Routes>

            <Suspense fallback={null}>
              <AuthModal />
            </Suspense>
          </div>
        </Router>
      </FirebaseAuthProvider>
    </AuthProvider>
  );
}

export default App;
