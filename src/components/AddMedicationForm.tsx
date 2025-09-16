"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { MedicationFormData } from "@/types/medication";

interface AddMedicationFormProps {
  onAddMedication: (medication: MedicationFormData) => void;
}

export function AddMedicationForm({ onAddMedication }: AddMedicationFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<MedicationFormData>({
    name: "",
    pillsPerDose: 1,
    totalPills: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.totalPills > 0 && formData.pillsPerDose > 0) {
      onAddMedication(formData);
      setFormData({ name: "", pillsPerDose: 1, totalPills: 0 });
      setOpen(false);
    }
  };

  const handleInputChange = (field: keyof MedicationFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mb-4">
          <Plus className="mr-2 h-4 w-4" />
          Add Medication
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Medication</DialogTitle>
            <DialogDescription>
              Enter the details for your new medication. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="col-span-3"
                placeholder="Medication name"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pillsPerDose" className="text-right">
                Pills per dose
              </Label>
              <Input
                id="pillsPerDose"
                type="number"
                min="1"
                value={formData.pillsPerDose}
                onChange={(e) => handleInputChange("pillsPerDose", parseInt(e.target.value) || 1)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="totalPills" className="text-right">
                Total pills in box
              </Label>
              <Input
                id="totalPills"
                type="number"
                min="1"
                value={formData.totalPills}
                onChange={(e) => handleInputChange("totalPills", parseInt(e.target.value) || 0)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Add Medication</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

