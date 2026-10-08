import './App.css';
import { BrowserRouter as Router, Routes, Route, useLocation, Outlet } from 'react-router-dom';

import Navbar from './components/layout/navbar/navbar';
import BottomNav from './components/layout/bottomNav/bottomNav';
import Footer from './components/layout/footer/footer';

import Foryou from './pages/Foryou/Foryou';
import Events from './pages/Events/Events';
import AllEvents from './pages/Events/allEvents/AllEvents';
import NearYouEvents from './pages/Events/nearYou/NearYouEvents';
import UpcomingEvents from './pages/Events/upcoming/UpcomingEvents';
import EventDetail from './pages/Events/eventDetail/eventDetail';
import EventBooking from './pages/Events/eventBooking/EventBooking';
import EventSearch from './pages/Events/search/EventSearch';

import AccessoriesPage from './pages/Accessories/AccessoriesPage';
import AccessoriesDetail from './pages/Accessories/accessoriesDetail/accessoriesDetail';
import Collection from './pages/Accessories/collection/collection';
import ProductsPage from './pages/Accessories/productPage/productsPage';
import BrandPage from './pages/Accessories/brands/brandPage';
import BikeBrandPage from './pages/Accessories/bikeBrandPage/bikeBrandPage';
import CategoryPage from './pages/Accessories/categoryPage/categoryPage';
import ShopPage from './pages/Accessories/shopPage/ShopPage';
import MarketplaceSearch from './pages/Accessories/search/MarketplaceSearch';
import CartPage from './pages/Cart/CartPage';
import ComboDetailPage from './pages/Accessories/combo/ComboDetailPage';

import { AuthProvider } from './components/AuthModal/useAuthModal';
import { FirebaseAuthProvider } from './context/AuthContext';
import { EventsProvider } from './context/EventsContext';
import { AccessoriesProvider } from './context/AccessoriesContext';
import { BikeBrandsProvider } from './context/BikeBrandsContext';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/profile/profile';
import ProfileOverview from './pages/profile/pages/ProfileOverview';
import MyBikes from './pages/profile/pages/MyBikes';
import JoinedEvents from './pages/profile/pages/JoinedEvents';
import MyOrders from './pages/profile/pages/MyOrders';
import MyTickets from './pages/profile/pages/MyTickets';
import Wishlist from './pages/profile/pages/Wishlist';
import SavedAddresses from './pages/profile/pages/SavedAddresses';
import SavedEvents from './pages/profile/pages/SavedEvents';
import Payments from './pages/profile/pages/Payments';
import Wallet from './pages/profile/pages/Wallet';
import ThrottleList from './pages/profile/pages/ThrottleList';
import ShareFeedback from './pages/profile/pages/ShareFeedback';

import AuthModalContainer from './components/AuthModal/AuthModalContainer';

const Navigation = () => {
  const location = useLocation();
  const isBookingPage = location.pathname.includes('/book');
  const isProfilePage = location.pathname.includes('/profile');
  const isSearchPage = location.pathname.includes('/search');

  if (isBookingPage || isProfilePage || isSearchPage) return null;

  return (
    <>
      <Navbar />
      <BottomNav />
    </>
  );
};

const FooterWrapper = () => {
  const location = useLocation();
  const isBookingPage = location.pathname.includes('/book');
  const isProfilePage = location.pathname.includes('/profile');
  const isSearchPage = location.pathname.includes('/search');

  if (isBookingPage || isProfilePage || isSearchPage) return null;

  return <Footer />;
};

const AccessoriesLayout = () => {
  return <Outlet />;
};

const AppShell = () => {
  const location = useLocation();
  const isProfilePage = location.pathname.includes('/profile');
  const isSearchPage = location.pathname.includes('/search');

  return (
    <div className={`app-container${isProfilePage ? ' is-profile-view' : ''}${isSearchPage ? ' is-search-view' : ''}`}>
      <Navigation />

      <Routes>
        <Route path="/" element={<Foryou />} />

        <Route path="/events" element={<Events />} />
        <Route path="/events/search" element={<EventSearch />} />
        <Route path="/search" element={<EventSearch />} />
        <Route path="/events/all" element={<AllEvents />} />
        <Route path="/all-events" element={<AllEvents />} />
        <Route path="/events/near-you" element={<NearYouEvents />} />
        <Route path="/events/near-me" element={<NearYouEvents />} />
        <Route path="/events/upcoming" element={<UpcomingEvents />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/events/:id/book" element={<EventBooking />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/event/:id/book" element={<EventBooking />} />

        <Route element={<AccessoriesLayout />}>
          <Route path="/accessories" element={<AccessoriesPage />} />
          <Route path="/accessories/search" element={<MarketplaceSearch />} />
          <Route path="/accessories/collection" element={<Collection />} />
          <Route path="/accessories/collection/:categoryId" element={<Collection />} />
          <Route path="/accessories/category/:categoryId" element={<CategoryPage />} />
          <Route
            path="/accessories/:id"
            element={<AccessoriesDetail />}
          />
          <Route path="/product/:id" element={<AccessoriesDetail />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/accessories/shop" element={<ShopPage />} />
          <Route path="/accessories/products" element={<ShopPage />} />
          <Route
            path="/accessories/products/:id"
            element={<ShopPage filterType="category" />}
          />
          <Route path="/category/:id" element={<ShopPage filterType="category" />} />
          <Route path="/brand/:id" element={<ShopPage filterType="brand" />} />
          <Route path="/bike/:id" element={<ShopPage filterType="bike" />} />
          <Route path="/accessories/bike/:id" element={<ProductsPage filterType="bike" />} />
          <Route path="/vendor/:id" element={<ProductsPage filterType="vendor" />} />
          <Route
            path="/accessories/brands"
            element={<BrandPage />}
          />
          <Route path="/accessories/brands/:brandId" element={<BikeBrandPage />} />
          <Route path="/combo/:comboId" element={<ComboDetailPage />} />
          <Route path="/accessories/combo/:comboId" element={<ComboDetailPage />} />
        </Route>
        <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />

        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>}>
          <Route index element={<ProfileOverview />} />
          <Route path="edit-details" element={<ProfileOverview />} />
          <Route path="my-bikes" element={<MyBikes />} />
          <Route path="joined-events" element={<JoinedEvents />} />
          <Route path="my-orders" element={<MyOrders />} />
          <Route path="my-tickets" element={<MyTickets />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="saved-addresses" element={<SavedAddresses />} />
          <Route path="saved-events" element={<SavedEvents />} />
          <Route path="payments" element={<Payments />} />
          <Route path="my-wallet" element={<Wallet />} />
          <Route path="throttle-list" element={<ThrottleList />} />
          <Route path="feedback" element={<ShareFeedback />} />
          {/* Backward compatibility aliases */}
          <Route path="events" element={<JoinedEvents />} />
          <Route path="accessories" element={<MyOrders />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="support" element={<ShareFeedback />} />
        </Route>
      </Routes>
      <FooterWrapper />
      <AuthModalContainer />
    </div>
  );
};

function App() {
  return (
    <FirebaseAuthProvider>
      <EventsProvider>
        <AccessoriesProvider>
          <BikeBrandsProvider>
            <Router>
              <AuthProvider>
                <AppShell />
              </AuthProvider>
            </Router>
          </BikeBrandsProvider>
        </AccessoriesProvider>
      </EventsProvider>
    </FirebaseAuthProvider>
  );
}

export default App;
