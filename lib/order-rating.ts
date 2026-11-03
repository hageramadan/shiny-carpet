import type { Order } from "./data";
import { isOrderDelivered, orderFulfillmentStatus } from "./order-status";

export function canRateOrder(order: Order) {
  return (
    isOrderDelivered(orderFulfillmentStatus(order)) &&
    (order.status === "paid" || order.userPaid === true) &&
    order.isRated === false
  );
}
