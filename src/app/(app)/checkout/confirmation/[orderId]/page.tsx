import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { OrderConfirmation } from "@/components/checkout/order-confirmation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confirmation de commande - Mientior",
  description: "Votre commande a été confirmée avec succès",
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { orderId } = await params;

  // Check authentication
  const session = await getSession();

  if (!session?.user) {
    redirect("/login?redirect=/checkout/confirmation/" + orderId);
  }

  // Fetch order details
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                orderBy: { order: "asc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  // Check if order exists and belongs to user
  if (!order || order.userId !== session.user.id) {
    notFound();
  }

  // Transform order data to match component interface
  const transformedOrder = {
    ...order,
    status: order.status.toLowerCase() as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
    paymentStatus: order.paymentStatus.toLowerCase() as 'pending' | 'paid' | 'failed' | 'refunded',
    shippingCost: order.shippingCost || order.shipping,
    shippingTotal: order.shippingCost || order.shipping,
    taxTotal: order.tax,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.productName || item.product.name,
      productName: item.productName || item.product.name,
      productImage: item.productImage || item.product.images?.[0]?.url || "",
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal || item.price * item.quantity,
      variant: item.variantId
        ? { sku: item.variantId, size: undefined, color: undefined }
        : undefined,
    })),
    shippingAddress: order.shippingAddress as any,
    billingAddress: order.billingAddress as any,
    estimatedDelivery: order.estimatedDeliveryMin
      ? {
          min: order.estimatedDeliveryMin,
          max: order.estimatedDeliveryMax || order.estimatedDeliveryMin,
        }
      : undefined,
    customer: {
      firstName: (order.shippingAddress as any)?.firstName || "",
      lastName: (order.shippingAddress as any)?.lastName || "",
      email: session.user.email || "",
    },
    shipping: {
      method: 'Standard',
      cost: order.shippingCost || order.shipping,
      estimatedDelivery: order.estimatedDeliveryMin || new Date(),
      address: order.shippingAddress as any,
    },
  };

  return <OrderConfirmation order={transformedOrder} />;
}
