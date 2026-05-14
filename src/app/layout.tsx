import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { CartProvider } from "@/contexts/cart-context";
import { getCurrentUser } from "@/application/auth/get-current-user";

export const metadata: Metadata = {
  title: "トコネシア | Tokonesia — Indonesian Products for Japan",
  description:
    "Cross-border e-commerce platform connecting Indonesian brands with customers in Japan. Discover authentic Indonesian products delivered to your doorstep.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body>
        <AuthProvider initialUser={user}>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
