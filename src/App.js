import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/navbar/navbar';
import Foryou from './pages/Foryou/Foryou';
import BottomNav from './components/layout/bottomNav/bottomNav';
import Events from './pages/Events/Events';
import AccessoriesPage from './pages/Accessories/AccessoriesPage';
import EventDetail from './pages/Events/eventDetail/eventDetail';
import AccessoriesDetail from './pages/Accessories/accessoriesDetail/accessoriesDetail';
import Collection from './pages/Accessories/collection/collection';
import BikeBrandPage from './pages/Accessories/bikeBrandPage/bikeBrandPage';
import ProductsPage from './pages/Accessories/productPage/productsPage';
import BrandPage from './pages/Accessories/brands/brandPage';
import Profile from './pages/profile/profile';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <BottomNav />
        <Routes>
          <Route path="/" element={<Foryou />} />
          <Route path="/events" element={<Events />} />
          <Route path='/events/:id' element={<EventDetail />} />
          <Route path="/accessories" element={<AccessoriesPage />} />
          <Route path='/accessories/collection' element={<Collection />} />
          <Route path='/accessories/collection/:bike' element={<BikeBrandPage />} />
          <Route path='/accessories/:id' element={<AccessoriesDetail />} />
          <Route path='/accessories/products' element={<ProductsPage />} />
          <Route path='/accessories/products/:id' element={<ProductsPage />} />
          <Route path='/accessories/brands' element={<BrandPage />} />

          <Route path="/profile" element={<Profile />}>
            {/* <Route index element={<ProfileHome />} />
            <Route path="events" element={<MyEvents />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="accessories" element={<MyAccessories />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="support" element={<HelpSupport />} /> */}
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
