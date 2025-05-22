"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileSpreadsheet, Upload, X, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { importDataSchema } from "@/lib/validators";
import { useToast } from "@/lib/hooks/use-toast";
import { z } from "zod";

type ImportDataFormValues = z.infer<typeof importDataSchema>;

interface ImportDataFormProps {
  eventId: string;
  onImport: (eventId: string, file: File) => Promise<void>;
  isLoading?: boolean;
}

export function ImportDataForm({
  eventId,
  onImport,
  isLoading = false,
}: ImportDataFormProps) {
  const toast = useToast();
  const [dragActive, setDragActive] = useState(false);
  
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
      await onImport(eventId, data.file);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import event data</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div 
            className={`border-2 border-dashed rounded-lg p-6 ${
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
                  className="cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="w-12 h-12 text-textSecondary mx-auto mb-3" />
                <p className="text-text mb-2">
                  Drag and drop your CSV or Excel file
                </p>
                <p className="text-sm text-textSecondary mb-4">
                  Or click to select a file
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("file-upload")?.click()}
                  className="cursor-pointer"
                >
                  Select file
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
          
          <div className="bg-element p-4 rounded-lg">
            <h3 className="font-medium mb-3 text-text">Expected file format</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-textSecondary">
              <li>CSV or Excel format (XLSX/XLS)</li>
              <li>First row must contain headers</li>
              <li>Required columns: name, email, wallet (optional)</li>
              <li>Additional columns for event metrics</li>
            </ul>
            <div className="mt-3 text-sm">
              <a href="#" className="text-primary hover:text-primaryHover flex items-center cursor-pointer">
                <FileSpreadsheet className="w-4 h-4 mr-1" />
                Download template
              </a>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={!selectedFile}
              leftIcon={<Check className="w-4 h-4" />}
              className="cursor-pointer"
            >
              Import data
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}