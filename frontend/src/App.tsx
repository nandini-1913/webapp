import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { theme, GlobalStyle } from './theme';
import { SessionProvider } from './session/SessionContext';
import { LocationProvider } from './session/LocationContext';
import { CartProvider } from './session/CartContext';
import { AppRoutes } from './routes/appRoutes';
import { CategoryBrowseRoute } from './routes/CategoryBrowseRoute';
import { Splash } from './pages/auth/Splash';
import { Login } from './pages/auth/Login';
import { OtpVerification } from './pages/auth/OtpVerification';
import { CreateAccount } from './pages/auth/CreateAccount';
import { ChooseLocation } from './pages/auth/ChooseLocation';
import { ChooseProfession } from './pages/auth/ChooseProfession';
import { PipeConfigurator } from './pages/catalog/PipeConfigurator';
import { Cart } from './pages/cart/Cart';
import { Checkout } from './pages/checkout/Checkout';
import { Payment } from './pages/checkout/Payment';
import { OrderConfirmation } from './pages/checkout/OrderConfirmation';
import { MainShell } from './pages/shell/MainShell';
import { MyRewards } from './pages/rewards/MyRewards';
import { Profile } from './pages/profile/Profile';
import { RoutePlaceholder } from './shared/RoutePlaceholder';
import { ProductSearch } from './pages/search/ProductSearch';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <SessionProvider>
        <LocationProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                <Route path={AppRoutes.splash} element={<Splash />} />
                <Route path={AppRoutes.login} element={<Login />} />
                <Route path={AppRoutes.otpVerification} element={<OtpVerification />} />
                <Route path={AppRoutes.createAccount} element={<CreateAccount />} />
                <Route path={AppRoutes.chooseLocation} element={<ChooseLocation />} />
                <Route path={AppRoutes.chooseProfession} element={<ChooseProfession />} />

                {/* Pipes & Tubing module */}
                <Route path={AppRoutes.categoryBrowse} element={<CategoryBrowseRoute />} />
                <Route path={AppRoutes.pipeConfigurator} element={<PipeConfigurator />} />

                {/* Cart / checkout */}
                <Route path={AppRoutes.cart} element={<Cart />} />
                <Route path={AppRoutes.selectAddress} element={<Checkout />} />
                <Route path={AppRoutes.payment} element={<Payment />} />
                <Route path={AppRoutes.orderConfirmation} element={<OrderConfirmation />} />

                {/* Post-auth shell (Home + side menu / bottom nav) */}
                <Route path={AppRoutes.homePlaceholder} element={<MainShell />} />
                <Route path={AppRoutes.main} element={<MainShell />} />

                <Route path={AppRoutes.myRewards} element={<MyRewards />} />
                <Route path={AppRoutes.profile} element={<Profile />} />

                {/* Out of module — stubs only. */}
                {[AppRoutes.categories, AppRoutes.notifications, AppRoutes.aiAssistant].map(
                  (route) => (
                    <Route key={route} path={route} element={<RoutePlaceholder route={route} />} />
                  ),
                )}
                <Route path={AppRoutes.search} element={<ProductSearch />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </LocationProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

export default App;
