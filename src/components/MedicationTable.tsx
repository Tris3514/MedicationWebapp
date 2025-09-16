"use client";

import { Medication } from "@/types/medication";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, Check, X } from "lucide-react";
import { EditPillsDialog } from "@/components/EditPillsDialog";

interface MedicationTableProps {
  medications: Medication[];
  onToggleTaken: (id: string) => void;
  onDeleteMedication: (id: string) => void;
  onUpdatePills: (id: string, currentPills: number, totalPills: number) => void;
}

export function MedicationTable({
  medications,
  onToggleTaken,
  onDeleteMedication,
  onUpdatePills,
}: MedicationTableProps) {
  const formatDate = (date?: Date) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString();
  };

  const getPillsStatus = (current: number, total: number) => {
    const percentage = (current / total) * 100;
    if (percentage <= 10) return "text-red-600 font-semibold";
    if (percentage <= 25) return "text-orange-600 font-semibold";
    return "text-foreground";
  };

  const isLowStock = (current: number, total: number) => {
    return (current / total) <= 0.25;
  };

  const calculateDaysRemaining = (current: number, pillsPerDose: number) => {
    if (current === 0 || pillsPerDose === 0) return 0;
    return Math.floor(current / pillsPerDose);
  };

  const getDaysRemainingColor = (days: number) => {
    if (days === 0) return "text-red-400 font-semibold";
    if (days <= 3) return "text-orange-400 font-semibold";
    if (days <= 7) return "text-yellow-400 font-semibold";
    return "text-foreground";
  };

  if (medications.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No medications added yet.</p>
        <p className="text-sm mt-2">Click &quot;Add Medication&quot; to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md glass">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Medication Name</TableHead>
            <TableHead>Pills per Dose</TableHead>
            <TableHead>Current Pills</TableHead>
            <TableHead>Days Remaining</TableHead>
            <TableHead>Taken Today</TableHead>
            <TableHead>Last Taken</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {medications.map((medication) => (
            <TableRow key={medication.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {medication.name}
                  {isLowStock(medication.currentPills, medication.totalPills) && (
                    <AlertTriangle className="h-4 w-4 text-orange-500" title="Low stock" />
                  )}
                </div>
              </TableCell>
              <TableCell>{medication.pillsPerDose}</TableCell>
              <TableCell className={getPillsStatus(medication.currentPills, medication.totalPills)}>
                {medication.currentPills}
              </TableCell>
              <TableCell className={getDaysRemainingColor(calculateDaysRemaining(medication.currentPills, medication.pillsPerDose))}>
                {calculateDaysRemaining(medication.currentPills, medication.pillsPerDose)} days
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={medication.takenToday ? "default" : "outline"}
                    size="sm"
                    onClick={() => onToggleTaken(medication.id)}
                    disabled={medication.currentPills < medication.pillsPerDose}
                    className={`h-8 px-3 ${
                      medication.takenToday 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                        : "border-white hover:bg-accent"
                    }`}
                  >
                    {medication.takenToday ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Taken
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 mr-1" />
                        Not Taken
                      </>
                    )}
                  </Button>
                  {medication.currentPills < medication.pillsPerDose && (
                    <span className="text-xs text-red-400">(Not enough pills)</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(medication.lastTaken)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <EditPillsDialog
                    medication={medication}
                    onUpdatePills={onUpdatePills}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteMedication(medication.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
