"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { Event, EventFormData } from "@/types/event";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select } from "../ui/select";
import { Upload, Calendar, X, Plus, Tag, Target } from "lucide-react";

interface EventFormProps {
  defaultValues?: Partial<EventFormData>;
  onSubmit: (data: EventFormData) => void;
  isLoading?: boolean;
}

export function EventForm({ defaultValues, onSubmit, isLoading = false }: EventFormProps) {
  const { 
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventFormData>({
    defaultValues: defaultValues || {
      name: "",
      description: "",
      date: new Date().toISOString().split('T')[0],
      type: "in-person",
      objectives: [],
      kpis: [],
    }
  });

  const [objectives, setObjectives] = React.useState<string[]>(defaultValues?.objectives || []);
  const [newObjective, setNewObjective] = React.useState("");
  const [kpis, setKpis] = React.useState<string[]>(defaultValues?.kpis || []);
  const [newKpi, setNewKpi] = React.useState("");
  const [logoPreview, setLogoPreview] = React.useState<string | null>(defaultValues?.logo || null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addObjective = () => {
    if (newObjective.trim()) {
      setObjectives([...objectives, newObjective.trim()]);
      setNewObjective("");
    }
  };

  const removeObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const addKpi = () => {
    if (newKpi.trim()) {
      setKpis([...kpis, newKpi.trim()]);
      setNewKpi("");
    }
  };

  const removeKpi = (index: number) => {
    setKpis(kpis.filter((_, i) => i !== index));
  };

  const onFormSubmit = (data: EventFormData) => {
    const formData = {
      ...data,
      objectives,
      kpis
    };
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-text">Basic information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="name"
              label="Event name *"
              placeholder="Enter the event name"
              error={errors.name?.message}
              {...register("name", { required: "The name is required" })}
            />

            <Textarea
              id="description"
              label="Event description *"
              rows={4}
              placeholder="Describe the event"
              error={errors.description?.message}
              {...register("description", { required: "The description is required" })}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="date"
                label="Event date *"
                type="date"
                leftIcon={<Calendar className="w-4 h-4" />}
                error={errors.date?.message}
                {...register("date", { required: "The date is required" })}
              />

              <Select
                id="type"
                label="Event type *"
                options={[
                  { value: "in-person", label: "In-person" },
                  { value: "virtual", label: "Virtual" },
                  { value: "hybrid", label: "Hybrid" }
                ]}
                error={errors.type?.message}
                {...register("type", { required: "The type is required" })}
              />
            </div>

            <div>
              <label htmlFor="logo" className="block text-sm font-medium mb-1 text-text">
                Event logo
              </label>
              <div className="mt-1 flex items-center space-x-4">
                <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-element rounded-lg cursor-pointer hover:border-primary transition-colors">
                  {logoPreview ? (
                    <div className="relative w-full h-full">
                      <img
                        src={logoPreview}
                        alt="Event logo preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setLogoPreview(null)}
                        className="absolute -top-2 -right-2 bg-error text-text rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-textSecondary mb-2" />
                      <p className="text-xs text-textSecondary">Upload image</p>
                    </div>
                  )}
                  <input
                    id="logo"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                </label>
                {logoPreview && (
                  <div className="text-sm text-textSecondary">
                    <p>Recommended format: PNG, JPG</p>
                    <p>Recommended size: 400x400px</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-text">
              <Target className="w-5 h-5 mr-2 text-primary" />
              Event objectives and KPIs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-text">
                Event objectives
              </label>
              <div className="flex space-x-2 mb-3">
                <Input
                  placeholder="Add an objective"
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addObjective())}
                />
                <Button 
                  type="button" 
                  onClick={addObjective}
                  className="cursor-pointer"
                  rightIcon={<Plus className="w-4 h-4" />}
                >
                  Add
                </Button>
              </div>
              {objectives.length > 0 ? (
                <div className="space-y-2">
                  {objectives.map((objective, index) => (
                    <div key={index} className="flex items-center justify-between bg-element rounded px-4 py-2">
                      <span className="text-sm text-text">{objective}</span>
                      <button
                        type="button"
                        onClick={() => removeObjective(index)}
                        className="text-textSecondary hover:text-error cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-textSecondary">No objectives defined yet</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-text items-center">
                <Tag className="w-4 h-4 mr-2 text-secondary" />
                Event KPIs
              </label>
              <div className="flex space-x-2 mb-3">
                <Input
                  placeholder="Add a KPI"
                  value={newKpi}
                  onChange={(e) => setNewKpi(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKpi())}
                />
                <Button 
                  type="button" 
                  onClick={addKpi}
                  variant="secondary"
                  className="cursor-pointer"
                  rightIcon={<Plus className="w-4 h-4" />}
                >
                  Add
                </Button>
              </div>
              {kpis.length > 0 ? (
                <div className="space-y-2">
                  {kpis.map((kpi, index) => (
                    <div key={index} className="flex items-center justify-between bg-element rounded px-4 py-2">
                      <span className="text-sm text-text">{kpi}</span>
                      <button
                        type="button"
                        onClick={() => removeKpi(index)}
                        className="text-textSecondary hover:text-error cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-textSecondary">No KPIs defined yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button 
            type="button" 
            variant="outline"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            isLoading={isLoading}
          >
            Save event
          </Button>
        </div>
      </div>
    </form>
  );
}