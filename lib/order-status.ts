export const orderStages = [
  { id: "received", label: "تم استلام الطلب" },
  { id: "scheduled", label: "جاري جدولة الاستلام" },
  { id: "collected", label: "تم استلام السجاد" },
  { id: "cleaning", label: "جاري التنظيف" },
  { id: "ready", label: "جاهز للتوصيل" },
  { id: "on-the-way", label: "في الطريق إليك" },
  { id: "delivered", label: "تم التسليم" },
] as const;

export type OrderStatus = (typeof orderStages)[number]["id"];

export function orderStageIndex(status?: string) {
  return Math.max(
    0,
    orderStages.findIndex((stage) => stage.id === status),
  );
}
