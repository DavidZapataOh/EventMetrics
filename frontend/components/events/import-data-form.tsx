"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileSpreadsheet, Upload, X, Check, AlertCircle, Download, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { importDataSchema } from "@/lib/validators";
import { useToast } from "@/lib/hooks/use-toast";
import { z } from "zod";
import * as XLSX from 'xlsx';

type ImportDataFormValues = z.infer<typeof importDataSchema>;

interface ImportDataFormProps {
  eventId: string;
  onImport: (eventId: string, file: File, type: 'attendees' | 'metrics') => Promise<void>;
  isLoading?: boolean;
}

export function ImportDataForm({
  eventId,
  onImport,
  isLoading = false,
}: ImportDataFormProps) {
  const toast = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [importType, setImportType] = useState<'attendees' | 'metrics'>('attendees');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ImportDataFormValues>({
    resolver: zodResolver(importDataSchema),
  });

  const selectedFile = watch("file");

  const onSubmit = async (data: ImportDataFormValues) => {
    try {
      await onImport(eventId, data.file, importType);
    } catch (error) {
      toast.error("Error importing data");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setValue("file", e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setValue("file", e.target.files[0]);
    }
  };

  const clearFile = () => {
    setValue("file", null as unknown as File);
  };

  const downloadAttendeesTemplate = () => {
    try {
      // Crear datos para el template de asistentes
      const data = [
        // Headers
        ['name', 'email', 'walletAddress'],
        // Ejemplos de datos
        ['Juan Pérez', 'juan.perez@email.com', '0x1234567890abcdef1234567890abcdef12345678'],
        ['María García', 'maria.garcia@email.com', '0xabcdef1234567890abcdef1234567890abcdef12'],
        ['Carlos López', 'carlos.lopez@email.com', ''],
        ['Ana Martínez', 'ana.martinez@email.com', '0x9876543210fedcba9876543210fedcba98765432'],
        // Filas vacías para que el usuario pueda agregar más
        ['', '', ''],
        ['', '', ''],
        ['', '', '']
      ];

      downloadExcel(data, 'attendees-template', 'Asistentes');
      toast.success("Template de asistentes descargado");
    } catch (error) {
      toast.error("Error al descargar el template");
    }
  };

  const downloadMetricsTemplate = () => {
    try {
      // Crear datos para el template de métricas
      const data = [
        // Headers con descripciones más claras
        [
          'confirmedAttendees',
          'totalAttendees', 
          'attendeesWithCertificate',
          'previosEventAttendees',
          'newWallets',
          'transactionsAfterEvent',
          'totalCost',
          'budgetSurplusDeficit',
          'virtualEngagement',
          'virtualConnectionTime',
          'marketingChannels',
          'marketingCampaign',
          'specialGuests',
          'openedWalletAddresses'
        ],
        // Fila con descripciones de cada campo
        [
          'Asistentes confirmados',
          'Total de asistentes',
          'Asistentes con certificado',
          'Asistentes de eventos previos',
          'Wallets nuevas creadas',
          'Transacciones después del evento',
          'Costo total del evento',
          'Superávit/Déficit presupuestario',
          'Engagement virtual (%)',
          'Tiempo de conexión virtual (min)',
          'Canales de marketing (separar con ;)',
          'Nombre de la campaña',
          'Invitados especiales (separar con ;)',
          'Direcciones de wallets (separar con ;)'
        ],
        // Ejemplo de datos
        [
          150,
          180,
          120,
          50,
          75,
          45,
          5000,
          500,
          85,
          120,
          'Social Media;Email;Website',
          'Campaña Q1 2024',
          'Vitalik Buterin;Satoshi Nakamoto',
          '0xabcd1234;0xefgh5678'
        ]
      ];

      downloadExcel(data, 'event-metrics-template', 'Métricas del Evento');
      toast.success("Template de métricas descargado");
    } catch (error) {
      toast.error("Error al descargar el template");
    }
  };

  const downloadExcel = (data: any[][], filename: string, sheetName: string) => {
    try {
      // Crear un nuevo workbook
      const wb = XLSX.utils.book_new();
      
      // Crear worksheet con los datos
      const ws = XLSX.utils.aoa_to_sheet(data);
      
      // Configurar el ancho de las columnas
      const colWidths = data[0].map((_, colIndex) => {
        const maxLength = Math.max(
          ...data.map(row => 
            row[colIndex] ? row[colIndex].toString().length : 0
          )
        );
        return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
      });
      ws['!cols'] = colWidths;
      
      // Estilo para los headers (primera fila)
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F46E5" } },
        alignment: { horizontal: "center" }
      };
      
      // Aplicar estilo a los headers
      const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = headerStyle;
      }
      
      // Si es el template de métricas, aplicar estilo a la fila de descripciones
      if (sheetName === 'Métricas del Evento') {
        const descriptionStyle = {
          font: { italic: true },
          fill: { fgColor: { rgb: "F3F4F6" } }
        };
        
        for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 1, c: col });
          if (!ws[cellAddress]) continue;
          ws[cellAddress].s = descriptionStyle;
        }
      }
      
      // Agregar la hoja al workbook
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      
      // Generar el archivo y descargarlo
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating Excel file:', error);
      throw error;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar datos del evento</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={importType} onValueChange={(value) => setImportType(value as 'attendees' | 'metrics')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="attendees" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Asistentes
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Métricas del Evento
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="attendees" className="space-y-4">
            <div className="bg-element p-4 rounded-lg">
              <h3 className="font-medium text-text mb-2">Importar Lista de Asistentes</h3>
              <p className="text-sm text-textSecondary mb-3">
                Importa información de múltiples asistentes al evento. Cada fila representa un asistente diferente.
              </p>
              <div className="text-sm text-textSecondary">
                <strong>Campos disponibles:</strong>
                <ul className="list-disc list-inside mt-1 ml-4">
                  <li><strong>name</strong> (requerido): Nombre completo del asistente</li>
                  <li><strong>email</strong> (requerido): Correo electrónico del asistente</li>
                  <li><strong>walletAddress</strong> (opcional): Dirección de wallet del asistente</li>
                </ul>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadAttendeesTemplate}
                className="mt-3"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar Template Excel
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="metrics" className="space-y-4">
            <div className="bg-element p-4 rounded-lg">
              <h3 className="font-medium text-text mb-2">Importar Métricas del Evento</h3>
              <p className="text-sm text-textSecondary mb-3">
                Importa métricas generales del evento. Solo se necesita una fila con los valores totales del evento.
              </p>
              <div className="text-sm text-textSecondary">
                <strong>Campos disponibles:</strong>
                <ul className="list-disc list-inside mt-1 ml-4 space-y-1">
                  <li><strong>confirmedAttendees:</strong> Número de asistentes confirmados</li>
                  <li><strong>totalAttendees:</strong> Número total de asistentes</li>
                  <li><strong>newWallets:</strong> Número de wallets creadas</li>
                  <li><strong>totalCost:</strong> Costo total del evento</li>
                  <li><strong>virtualEngagement:</strong> Porcentaje de engagement virtual</li>
                  <li><strong>marketingChannels:</strong> Canales de marketing (separados por ;)</li>
                  <li>Y más campos de métricas...</li>
                </ul>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadMetricsTemplate}
                className="mt-3"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar Template Excel
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
          <div 
            className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
              dragActive ? "border-primary bg-primary/10" : "border-element"
            } ${errors.file ? "border-error" : ""}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="flex items-center justify-between bg-element p-3 rounded-lg">
                <div className="flex items-center">
                  <FileSpreadsheet className="w-8 h-8 text-primary mr-3" />
                  <div>
                    <div className="font-medium text-text">{selectedFile.name}</div>
                    <div className="text-sm text-textSecondary">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={clearFile}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="w-12 h-12 text-textSecondary mx-auto mb-3" />
                <p className="text-text mb-2">
                  Arrastra y suelta tu archivo CSV o Excel
                </p>
                <p className="text-sm text-textSecondary mb-4">
                  Archivo de {importType === 'attendees' ? 'asistentes' : 'métricas del evento'}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  Seleccionar archivo
                </Button>
              </div>
            )}
            <input
              id="file-upload"
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="hidden"
              {...register("file")}
              onChange={handleFileChange}
            />
          </div>
          
          {errors.file && (
            <div className="flex items-center text-error text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              <span>{errors.file.message}</span>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={!selectedFile || isLoading}
              leftIcon={<Check className="w-4 h-4" />}
            >
              {isLoading ? 'Importando...' : `Importar ${importType === 'attendees' ? 'Asistentes' : 'Métricas'}`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}