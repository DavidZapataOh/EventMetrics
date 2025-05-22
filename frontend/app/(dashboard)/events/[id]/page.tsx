"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PageHeader } from "@/components/shared/page-header";
import { EventDetails } from "@/components/events/event-details";
import { EventMetrics } from "@/components/events/event-metrics";
import { ImportDataForm } from "@/components/events/import-data-form";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { useEvents } from "@/lib/hooks/use-events";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { eventQuery, deleteEvent, importEventData } = useEvents();
  const { data: event, isLoading, isError } = eventQuery(id);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteEvent(id);
      router.push("/events");
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleImport = async (eventId: string, file: File) => {
    setImportLoading(true);
    try {
      await importEventData({ id: eventId, file });
    } catch (error) {
      console.error("Error importing data:", error);
    } finally {
      setImportLoading(false);
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
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <h2 className="text-xl font-semibold text-error mb-4">Error loading event</h2>
        <p className="text-textSecondary mb-6">The event could not be found or there was an error loading it.</p>
        <Link href="/events">
          <Button>Back to Events</Button>
        </Link>
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
        ]}
      />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader title={event.name} description={event.description} />
        
        <div className="flex space-x-3">
          <Link href={`/events/${id}/edit`}>
            <Button variant="outline" leftIcon={<Edit className="w-4 h-4" />} className="cursor-pointer">
              Edit
            </Button>
          </Link>
          
          <Button 
            variant="ghost" 
            className="text-error"
            leftIcon={<Trash className="w-4 h-4" />}
            onClick={() => setShowDeleteDialog(true)}
          >
            Delete
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <EventDetails event={event} />
          <ImportDataForm 
            eventId={id}
            onImport={handleImport}
            isLoading={importLoading}
          />
        </div>
        
        <div className="md:col-span-2">
          <EventMetrics event={event} />
        </div>
      </div>

      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete event"
        description="Are you sure you want to delete this event? This action cannot be undone."
      >
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(false)}
          >
            Cancel
          </Button>
          <Button
            variant="ghost"
            className="text-error hover:text-error"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}