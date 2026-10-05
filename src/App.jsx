import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignUp from './SignUp';
import ResetPassword from './resetpassword';
import Login from './Login';
import PrivacyPolicy from './ PrivacyPolicy';
import Catalog from './Catalog';
import ArtworkDetail from './ArtworkDetail';
import ArtistProfile from './ArtistProfile';
import Home from './Home';
import Auction from './Auction';
import About from './About';
import Submissions from './Submissions';
import CollectorProfile from './CollectorProfile';
import Cart from './Cart';
import { AuthProvider } from './AuthContext';
import { AuthGateProvider } from './AuthGate';
import Checkout from './Checkout';
import Payment from './Payment';
import PaymentSuccess from './PaymentSuccess';
import Profile from './Profile';
import Orders from './Orders';
import ScrollToTop from './ScrollToTop';
import AuctionResults from './AuctionResults';
import AdminLogin from './AdminLogin';
import AdminSubmissions from './AdminSubmissions';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthGateProvider>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/artwork/:id" element={<ArtworkDetail />} />
            <Route path="/artist/:name" element={<ArtistProfile />} />
            <Route path="/home-page" element={<Home />} />
            <Route path="/auction" element={<Auction />} />
            <Route path="/about" element={<About />} />
            <Route path="/exhibitions" element={<Submissions />} />
            <Route path="/collector-profile" element={<CollectorProfile />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/Profile" element={<Profile />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:orderId" element={<Orders />} />
            <Route path="/AuctionResults" element={<AuctionResults />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/submissions" element={<AdminSubmissions />} />
          </Routes>
        </AuthGateProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;