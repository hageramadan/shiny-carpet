import type { Order } from "./data";
import { isOrderDelivered } from "./order-status";

export function canRateOrder(order: Order) {
  return (
    isOrderDelivered(order.status) &&
    (order.status === "paid" || order.userPaid === true) &&
    order.isRated === false
  );
}
