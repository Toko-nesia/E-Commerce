import { beforeEach, describe, expect, it, vi } from "vitest";

const { createTransactionMock } = vi.hoisted(() => ({
  createTransactionMock: vi.fn(),
}));

vi.mock("midtrans-client", () => ({
  default: {
    Snap: vi.fn(function Snap() {
      return {
        createTransaction: createTransactionMock,
      };
    }),
  },
}));

describe("MidtransSnapPaymentGateway", () => {
  beforeEach(() => {
    createTransactionMock.mockReset();
    createTransactionMock.mockResolvedValue({
      token: "snap-token",
      redirect_url: "https://snap.midtrans.test/redirect",
    });
  });

  it("limits Snap to Virtual Account bank transfer", async () => {
    const { MidtransSnapPaymentGateway } = await import("./snap-payment-gateway");
    const gateway = new MidtransSnapPaymentGateway();

    await gateway.createSnapTransaction({
      midtransOrderId: "ZB-1",
      grossAmount: 100_000,
      customer: { name: "Buyer", phone: "+628111111111" },
      itemDetails: [{ id: "1", price: 100_000, quantity: 1, name: "Product" }],
      createdAt: new Date("2026-05-16T00:00:00.000Z"),
      expiresAt: new Date("2026-05-17T00:00:00.000Z"),
    });

    expect(createTransactionMock).toHaveBeenCalledWith(expect.objectContaining({
      enabled_payments: ["bank_transfer"],
      expiry: expect.objectContaining({
        unit: "hours",
        duration: 24,
      }),
    }));
    expect(createTransactionMock.mock.calls[0][0].enabled_payments).not.toContain("credit_card");
  });
});
