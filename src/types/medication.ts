export interface Medication {
  id: string;
  name: string;
  pillsPerDose: number;
  totalPills: number;
  currentPills: number;
  takenToday: boolean;
  lastTaken?: Date;
}

export interface MedicationFormData {
  name: string;
  pillsPerDose: number;
  totalPills: number;
}

