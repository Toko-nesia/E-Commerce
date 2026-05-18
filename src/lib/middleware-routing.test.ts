import { describe, expect, it } from "vitest";
import { getRoutingDecision } from "@/lib/middleware-routing";

describe("middleware routing", () => {
  it("redirects anonymous users away from protected checkout pages", () => {
    expect(getRoutingDecision("/checkout", { authenticated: false })).toEqual({
      action: "redirect",
      to: "/login?redirect=/checkout",
    });
    expect(getRoutingDecision("/order-pending", { authenticated: false })).toEqual({
      action: "redirect",
      to: "/login?redirect=/order-pending",
    });
    expect(getRoutingDecision("/reset-password", { authenticated: false })).toEqual({
      action: "redirect",
      to: "/login?redirect=/reset-password",
    });
  });

  it("allows auth exchange routes so Supabase can exchange codes and confirm email tokens", () => {
    expect(getRoutingDecision("/auth/callback", { authenticated: false })).toEqual({
      action: "allow",
    });
    expect(getRoutingDecision("/auth/confirm", { authenticated: false })).toEqual({
      action: "allow",
    });
  });

  it("keeps forgot password as an auth route for already signed-in users", () => {
    expect(getRoutingDecision("/forgot-password", { authenticated: true, role: "user" })).toEqual({
      action: "redirect",
      to: "/",
    });
    expect(getRoutingDecision("/forgot-password", { authenticated: true, role: "admin" })).toEqual({
      action: "redirect",
      to: "/admin",
    });
  });

  it("keeps admins out of storefront routes and users out of admin routes", () => {
    expect(getRoutingDecision("/shop", { authenticated: true, role: "admin" })).toEqual({
      action: "redirect",
      to: "/admin",
    });
    expect(getRoutingDecision("/admin/orders", { authenticated: true, role: "user" })).toEqual({
      action: "redirect",
      to: "/",
    });
  });
});
