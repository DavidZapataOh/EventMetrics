import apiClient from './axios-config';
import { Event, EventFormData } from '@/types/event';
import { ApiResponse, PaginatedResponse, QueryParams } from '@/types/api';

export const getEvents = async (params?: QueryParams): Promise<PaginatedResponse<Event>> => {
  const response = await apiClient.get<ApiResponse<{ data: Event[], pagination: any }>>('/events', { params });
  
  if (response.data.success && response.data.data) {
    return {
      data: response.data.data.data,
      page: response.data.data.pagination.page,
      limit: response.data.data.pagination.limit,
      total: response.data.data.pagination.total,
      totalPages: response.data.data.pagination.totalPages
    };
  }
  
  // Fallback para respuestas directas del array
  if (Array.isArray(response.data)) {
    return {
      data: response.data,
      page: 1,
      limit: response.data.length,
      total: response.data.length,
      totalPages: 1
    };
  }
  
  throw new Error('Invalid response format');
};

export const getEvent = async (id: string): Promise<Event> => {
  const response = await apiClient.get<ApiResponse<Event>>(`/events/${id}`);
  
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  
  // Fallback para respuestas directas
  if (response.data && !response.data.success) {
    return response.data as unknown as Event;
  }
  
  throw new Error('Event not found');
};

// Función helper para crear FormData
const createEventFormData = (eventData: EventFormData): FormData => {
  const formData = new FormData();
  
  // Agregar campos básicos
  formData.append('name', eventData.name);
  formData.append('description', eventData.description);
  formData.append('date', eventData.date);
  formData.append('type', eventData.type);
  
  // Agregar nuevos campos de tiempo
  formData.append('startTime', eventData.startTime);
  formData.append('endTime', eventData.endTime);
  formData.append('timezone', eventData.timezone);
  
  // Agregar archivo de logo si existe
  if (eventData.logo instanceof File) {
    formData.append('logo', eventData.logo);
  }
  
  // Agregar ubicación si existe (para eventos presenciales/híbridos)
  if (eventData.location) {
    formData.append('location', JSON.stringify(eventData.location));
  }
  
  // Agregar arrays como JSON strings
  if (eventData.objectives && Array.isArray(eventData.objectives)) {
    formData.append('objectives', JSON.stringify(eventData.objectives));
  }
  if (eventData.kpis && Array.isArray(eventData.kpis)) {
    formData.append('kpis', JSON.stringify(eventData.kpis));
  }
  if (eventData.specialGuests) {
    formData.append('specialGuests', JSON.stringify(eventData.specialGuests));
  }
  if (eventData.openedWalletAddresses) {
    formData.append('openedWalletAddresses', JSON.stringify(eventData.openedWalletAddresses));
  }
  
  // Agregar campos numéricos
  if (eventData.confirmedAttendees !== undefined) {
    formData.append('confirmedAttendees', eventData.confirmedAttendees.toString());
  }
  if (eventData.totalAttendees !== undefined) {
    formData.append('totalAttendees', eventData.totalAttendees.toString());
  }
  if (eventData.attendeesWithCertificate !== undefined) {
    formData.append('attendeesWithCertificate', eventData.attendeesWithCertificate.toString());
  }
  if (eventData.previosEventAttendees !== undefined) {
    formData.append('previosEventAttendees', eventData.previosEventAttendees.toString());
  }
  if (eventData.newWallets !== undefined) {
    formData.append('newWallets', eventData.newWallets.toString());
  }
  if (eventData.transactionsAfterEvent !== undefined) {
    formData.append('transactionsAfterEvent', eventData.transactionsAfterEvent.toString());
  }
  if (eventData.totalCost !== undefined) {
    formData.append('totalCost', eventData.totalCost.toString());
  }
  if (eventData.budgetSurplusDeficit !== undefined) {
    formData.append('budgetSurplusDeficit', eventData.budgetSurplusDeficit.toString());
  }
  
  // Agregar objetos complejos como JSON strings
  if (eventData.registeredAttendees) {
    formData.append('registeredAttendees', JSON.stringify(eventData.registeredAttendees));
  }
  if (eventData.transactionsDuringEvent) {
    formData.append('transactionsDuringEvent', JSON.stringify(eventData.transactionsDuringEvent));
  }
  if (eventData.marketing) {
    formData.append('marketing', JSON.stringify(eventData.marketing));
  }
  if (eventData.virtualMetrics) {
    formData.append('virtualMetrics', JSON.stringify(eventData.virtualMetrics));
  }
  
  return formData;
};

export const createEvent = async (eventData: EventFormData): Promise<Event> => {
  const formData = createEventFormData(eventData);
  
  const response = await apiClient.post<ApiResponse<Event>>('/events', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  
  return response.data as unknown as Event;
};

export const updateEvent = async (id: string, eventData: Partial<EventFormData>): Promise<Event> => {
  const formData = createEventFormData(eventData as EventFormData);
  
  const response = await apiClient.put<ApiResponse<Event>>(`/events/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  
  return response.data as unknown as Event;
};

export const deleteEvent = async (id: string): Promise<void> => {
  await apiClient.delete(`/events/${id}`);
};

export const importEventData = async (id: string, file: File): Promise<Event> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('eventId', id);
  
  const response = await apiClient.post<ApiResponse<Event>>('/events/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  
  throw new Error('Import failed');
};