"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'sonner';
import { 
  getEvents, 
  getEvent, 
  createEvent, 
  updateEvent, 
  deleteEvent,
  importEventData
} from '../api/events-api';
import { Event, EventFormData } from '@/types/event';
import { QueryParams } from '@/types/api';

export function useEvents() {
  const queryClient = useQueryClient();
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    limit: 10,
  });

  const eventsQuery = useQuery(
    ['events', queryParams],
    () => getEvents(queryParams),
    {
      keepPreviousData: true,
    }
  );

  const eventQuery = (id: string) => useQuery(
    ['event', id], 
    () => getEvent(id),
    {
      enabled: !!id,
    }
  );

  const createEventMutation = useMutation(
    (data: EventFormData) => createEvent(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('events');
        toast.success('Event created successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Error to create the event');
      },
    }
  );

  const updateEventMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<EventFormData> }) => updateEvent(id, data),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(['events']);
        queryClient.invalidateQueries(['event', variables.id]);
        toast.success('Event updated successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Error to update the event');
      },
    }
  );

  const deleteEventMutation = useMutation(
    (id: string) => deleteEvent(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('events');
        toast.success('Event deleted successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Error to delete the event');
      },
    }
  );

  const importEventDataMutation = useMutation(
    ({ id, file }: { id: string; file: File }) => importEventData(id, file),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(['event', variables.id]);
        toast.success('Data imported successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Error to import the data');
      },
    }
  );

  return {
    events: eventsQuery.data?.data || [],
    eventsQuery,
    eventQuery,
    createEvent: createEventMutation.mutateAsync,
    updateEvent: updateEventMutation.mutateAsync,
    deleteEvent: deleteEventMutation.mutateAsync,
    importEventData: importEventDataMutation.mutateAsync,
    pagination: {
      currentPage: eventsQuery.data?.page || 1,
      totalPages: eventsQuery.data?.totalPages || 1,
      totalEvents: eventsQuery.data?.total || 0,
    },
    setQueryParams,
  };
}