"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PageHeader } from "@/components/shared/page-header";
import { EventForm } from "@/components/events/event-form";
import { useEvents } from "@/lib/hooks/use-events";
import { EventFormData } from "@/types/event";
import { Spinner } from "@/components/ui/spinner";

export default function EditEventPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { eventQuery, updateEvent } = useEvents();
  const { data: event, isLoading, isError } = eventQuery(id);

  const handleSubmit = async (data: EventFormData) => {
    try {
      await updateEvent({ id, data });
      router.push(`/events/${id}`);
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold text-error">Error loading event</h2>
        <p className="text-textSecondary mt-2">Could not load event data. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Events", href: "/events" },
          { label: event.name, href: `/events/${id}` },
          { label: "Edit", href: `/events/${id}/edit` },
        ]}
      />
      
      <PageHeader
        title={`Edit ${event.name}`}
        description="Update event details and information"
      />
      
      <EventForm onSubmit={handleSubmit} event={event} />
    </div>
  );
}