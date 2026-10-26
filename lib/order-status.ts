export const orderStages = [
  { id: "ordered", label: "تم استلام الطلب", step: 0 },
  { id: "confirmed", label: "تم تأكيد الطلب", step: 1 },
  { id: "processing", label: "جاري تجهيز الطلب", step: 1 },
  { id: "pickup_from_customer", label: "جاري ترتيب الاستلام من العميل", step: 1 },
  { id: "driver_on_way_to_customer", label: "المندوب في الطريق للاستلام", step: 1 },
  { id: "arrived_to_customer", label: "وصل المندوب إلى العميل", step: 1 },
  { id: "picked_up_from_customer", label: "تم استلام القطع من العميل", step: 2 },
  { id: "on_way_to_laundry", label: "القطع في الطريق إلى المغسلة", step: 2 },
  { id: "arrived_to_laundry", label: "وصلت القطع إلى المغسلة", step: 2 },
  { id: "delivered_to_laundry", label: "تم تسليم القطع للمغسلة", step: 2 },
  { id: "laundry_received", label: "استلمت المغسلة القطع", step: 3 },
  { id: "ready_for_delivery", label: "جاهز للتوصيل", step: 4 },
  { id: "picked_up_from_laundry", label: "تم استلام القطع من المغسلة", step: 5 },
  { id: "deliver_to_customer", label: "جاري تجهيز التوصيل للعميل", step: 5 },
  { id: "on_way_to_customer_again", label: "المندوب في الطريق للتوصيل", step: 5 },
  { id: "arrived_to_customer_again", label: "وصل المندوب لتسليم القطع", step: 5 },
  { id: "paid", label: "تم الدفع", step: 5 },
  { id: "delivered_to_customer", label: "تم التسليم للعميل", step: 6 },
  // Retain the cancellation response and older completed orders.
  { id: "cancelled", label: "ملغي", step: -1 },
  { id: "delivered", label: "تم التسليم", step: 6 },
] as const;
export type OrderStatus = (typeof orderStages)[number]["id"];
export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && orderStages.some((stage) => stage.id === value);
}
export function isOrderDelivered(status: OrderStatus) {
  return status === "delivered_to_customer" || status === "delivered";
}
