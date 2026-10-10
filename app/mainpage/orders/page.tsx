import { ShoppingBag } from "lucide-react";
import { SectionEmptyState } from "../_components/SectionEmptyState";

export default function OrdersPage() {
  return (
    <SectionEmptyState
      icon={<ShoppingBag className="w-6 h-6" />}
      title="Orders"
      description="Track takeaway and delivery orders from here once ordering is live."
    />
  );
}
