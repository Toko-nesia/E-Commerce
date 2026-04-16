import { createBrowserRouter } from "react-router";
import HomePage from "./components/pages/HomePage";
import LoginPage from "./components/pages/LoginPage";
import RegisterPage from "./components/pages/RegisterPage";
import CompleteDataPage from "./components/pages/CompleteDataPage";
import AboutPage from "./components/pages/AboutPage";
import ShopPage from "./components/pages/ShopPage";
import ProductDetailPage from "./components/pages/ProductDetailPage";
import CheckoutPage from "./components/pages/CheckoutPage";
import ProfilePage from "./components/pages/ProfilePage";

export const router = createBrowserRouter([
  { path: "/", Component: HomePage },
  { path: "/login", Component: LoginPage },
  { path: "/register", Component: RegisterPage },
  { path: "/complete-data", Component: CompleteDataPage },
  { path: "/about", Component: AboutPage },
  { path: "/shop", Component: ShopPage },
  { path: "/shop/category/:category", Component: ShopPage },
  { path: "/product/:id", Component: ProductDetailPage },
  { path: "/checkout", Component: CheckoutPage },
  { path: "/profile", Component: ProfilePage },
]);
