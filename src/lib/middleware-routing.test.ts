import { describe, expect, it } from "vitest";
import { getRoutingDecision } from "@/lib/middleware-routing";

describe("middleware routing", () => {
  it("redirects anonymous users away from protected checkout pages", () => {
    expect(getRoutingDecision("/checkout", { authenticated: false })).toEqual({
      action: "redirect",
      to: "/login?redirect=/checkout",
    });
  });

  it("allows the auth callback route so Supabase can exchange codes", () => {
    expect(getRoutingDecision("/auth/callback", { authenticated: false })).toEqual({
      action: "allow",
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
