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

interface UseEventsProps {
  initialParams?: QueryParams;
}

export function useEvents(initialParams?: QueryParams) {
  const queryClient = useQueryClient();
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    limit: 10,
    sort: '-createdAt',
    ...initialParams
  });

  const eventsQuery = useQuery(
    ['events', queryParams],
    () => getEvents(queryParams),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
    }
  );

  const eventQuery = (id: string) => useQuery(
    ['event', id], 
    () => getEvent(id),
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
      retry: (failureCount, error: any) => {
        // No reintentar si es un error 404
        if (error?.response?.status === 404) return false;
        return failureCount < 3;
      }
    }
  );

  const createEventMutation = useMutation(
    (data: EventFormData) => createEvent(data),
    {
      onSuccess: (newEvent) => {
        queryClient.invalidateQueries(['events']);
        queryClient.setQueryData(['event', newEvent._id], newEvent);
        toast.success('Evento creado exitosamente');
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Error al crear el evento';
        toast.error(message);
      },
    }
  );

  const updateEventMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<EventFormData> }) => updateEvent(id, data),
    {
      onSuccess: (updatedEvent, variables) => {
        queryClient.invalidateQueries(['events']);
        queryClient.setQueryData(['event', variables.id], updatedEvent);
        toast.success('Evento actualizado exitosamente');
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Error al actualizar el evento';
        toast.error(message);
      },
    }
  );

  const deleteEventMutation = useMutation(
    (id: string) => deleteEvent(id),
    {
      onSuccess: (_, deletedId) => {
        queryClient.invalidateQueries(['events']);
        queryClient.removeQueries(['event', deletedId]);
        toast.success('Evento eliminado exitosamente');
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Error al eliminar el evento';
        toast.error(message);
      },
    }
  );

  const importEventDataMutation = useMutation(
    ({ id, file }: { id: string; file: File }) => importEventData(id, file),
    {
      onSuccess: (updatedEvent, variables) => {
        queryClient.invalidateQueries(['events']);
        queryClient.setQueryData(['event', variables.id], updatedEvent);
        toast.success('Datos importados exitosamente');
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Error al importar los datos';
        toast.error(message);
      },
    }
  );

  const refetchEvents = () => {
    return eventsQuery.refetch();
  };

  const refetchEvent = (id: string) => {
    return queryClient.invalidateQueries(['event', id]);
  };

  return {
    // Data
    events: eventsQuery.data?.data || [],
    eventsQuery,
    eventQuery,
    
    // Pagination
    pagination: {
      currentPage: eventsQuery.data?.page || 1,
      totalPages: eventsQuery.data?.totalPages || 1,
      totalEvents: eventsQuery.data?.total || 0,
      limit: eventsQuery.data?.limit || 10,
    },
    
    // Mutations
    createEvent: createEventMutation.mutateAsync,
    updateEvent: updateEventMutation.mutateAsync,
    deleteEvent: deleteEventMutation.mutateAsync,
    importEventData: importEventDataMutation.mutateAsync,
    
    // Loading states
    isCreating: createEventMutation.isLoading,
    isUpdating: updateEventMutation.isLoading,
    isDeleting: deleteEventMutation.isLoading,
    isImporting: importEventDataMutation.isLoading,
    
    // Utils
    setQueryParams,
    refetchEvents,
    refetchEvent,
  };
}