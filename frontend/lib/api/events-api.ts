import apiClient from './axios-config';
import { Event, EventFormData } from '@/types/event';
import { ApiResponse, PaginatedResponse, QueryParams } from '@/types/api';

export const getEvents = async (params?: QueryParams): Promise<PaginatedResponse<Event>> => {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<Event>>>('/events', { params });
  return response.data.data;
};

export const getEvent = async (id: string): Promise<Event> => {
  const response = await apiClient.get<ApiResponse<Event>>(`/events/${id}`);
  return response.data.data;
};

export const createEvent = async (eventData: EventFormData): Promise<Event> => {
  const response = await apiClient.post<ApiResponse<Event>>('/events', eventData);
  return response.data.data;
};

export const updateEvent = async (id: string, eventData: Partial<EventFormData>): Promise<Event> => {
  const response = await apiClient.put<ApiResponse<Event>>(`/events/${id}`, eventData);
  return response.data.data;
};

export const deleteEvent = async (id: string): Promise<void> => {
  await apiClient.delete(`/events/${id}`);
};

export const importEventData = async (id: string, file: File): Promise<void> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('eventId', id);
  
  await apiClient.post('/events/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};