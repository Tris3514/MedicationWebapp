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
import { Edit3 } from "lucide-react";
import { Medication } from "@/types/medication";

interface EditPillsDialogProps {
  medication: Medication;
  onUpdatePills: (id: string, currentPills: number, totalPills: number) => void;
}

export function EditPillsDialog({ medication, onUpdatePills }: EditPillsDialogProps) {
  const [open, setOpen] = useState(false);
  const [currentPills, setCurrentPills] = useState(medication.currentPills);
  const [totalPills, setTotalPills] = useState(medication.totalPills);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPills >= 0 && totalPills > 0 && currentPills <= totalPills) {
      onUpdatePills(medication.id, currentPills, totalPills);
      setOpen(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Reset form to current values when opening
      setCurrentPills(medication.currentPills);
      setTotalPills(medication.totalPills);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Edit3 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Pill Count</DialogTitle>
            <DialogDescription>
              Update the pill count for <strong>{medication.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currentPills" className="text-right">
                Current Pills
              </Label>
              <Input
                id="currentPills"
                type="number"
                min="0"
                max={totalPills}
                value={currentPills}
                onChange={(e) => setCurrentPills(parseInt(e.target.value) || 0)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="totalPills" className="text-right">
                Total Pills in Box
              </Label>
              <Input
                id="totalPills"
                type="number"
                min="1"
                value={totalPills}
                onChange={(e) => setTotalPills(parseInt(e.target.value) || 1)}
                className="col-span-3"
                required
              />
            </div>
            {currentPills > totalPills && (
              <p className="text-sm text-red-500 col-span-4">
                Current pills cannot exceed total pills in box.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={currentPills > totalPills || totalPills <= 0}
            >
              Update Pills
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

