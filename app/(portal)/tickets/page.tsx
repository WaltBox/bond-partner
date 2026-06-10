import { PageHeader } from "@/components/page-header";
import { TicketsView } from "@/components/tickets/tickets-view";

export default function TicketsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Tickets" description="Every Bond visit at your locations" />
      <TicketsView />
    </div>
  );
}
