"use client";

import { useState, useEffect } from "react";
import { Medication, MedicationFormData } from "@/types/medication";
import { AddMedicationForm } from "@/components/AddMedicationForm";
import { MedicationTable } from "@/components/MedicationTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useUserData } from "@/hooks/useUserData";

const STORAGE_KEY = "medication-tracker-data";

export function MedicationTracker() {
  const { isAuthenticated, getData, setData } = useUserData();
  const [medications, setMedications] = useState<Medication[]>([]);

  // Load data from localStorage on component mount
  useEffect(() => {
    if (isAuthenticated) {
      // Load from user-specific data
      const savedData = getData('medications') || [];
      // Convert date strings back to Date objects
      const medicationsWithDates = savedData.map((med: any) => ({
        ...med,
        lastTaken: med.lastTaken ? new Date(med.lastTaken) : undefined,
      }));
      setMedications(medicationsWithDates);
    } else {
      // Fallback to localStorage for non-authenticated users
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          // Convert date strings back to Date objects
          const medicationsWithDates = parsedData.map((med: any) => ({
            ...med,
            lastTaken: med.lastTaken ? new Date(med.lastTaken) : undefined,
          }));
          setMedications(medicationsWithDates);
        } catch (error) {
          console.error("Failed to load medications from storage:", error);
        }
      }
    }
  }, [isAuthenticated, getData]);

  // Save data to localStorage whenever medications change
  useEffect(() => {
    if (medications.length > 0) {
      // Save to user-specific data if authenticated, otherwise fallback to localStorage
      if (isAuthenticated) {
        setData('medications', medications);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(medications));
      }
    }
  }, [medications, isAuthenticated, setData]);

  // Check if it's a new day and reset "taken today" status
  useEffect(() => {
    const checkNewDay = () => {
      const today = new Date().toDateString();
      const lastCheck = isAuthenticated ? getData('lastCheckDate') : localStorage.getItem("last-check-date");
      
      if (lastCheck !== today) {
        setMedications(prev => 
          prev.map(med => ({
            ...med,
            takenToday: false
          }))
        );
        
        // Save to user-specific data if authenticated, otherwise fallback to localStorage
        if (isAuthenticated) {
          setData('lastCheckDate', today);
        } else {
          localStorage.setItem("last-check-date", today);
        }
      }
    };

    checkNewDay();
    // Check every minute if it's a new day
    const interval = setInterval(checkNewDay, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, getData, setData]);

  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const addMedication = (formData: MedicationFormData) => {
    const newMedication: Medication = {
      id: generateId(),
      name: formData.name,
      pillsPerDose: formData.pillsPerDose,
      totalPills: formData.totalPills,
      currentPills: formData.totalPills,
      takenToday: false,
    };

    setMedications(prev => [...prev, newMedication]);
  };

  const toggleTaken = (id: string) => {
    setMedications(prev =>
      prev.map(med => {
        if (med.id === id) {
          const newTakenStatus = !med.takenToday;
          const pillChange = newTakenStatus ? -med.pillsPerDose : med.pillsPerDose;
          const newCurrentPills = Math.max(0, med.currentPills + pillChange);
          
          return {
            ...med,
            takenToday: newTakenStatus,
            currentPills: newCurrentPills,
            lastTaken: newTakenStatus ? new Date() : med.lastTaken,
          };
        }
        return med;
      })
    );
  };

  const deleteMedication = (id: string) => {
    setMedications(prev => prev.filter(med => med.id !== id));
  };

  const updatePills = (id: string, currentPills: number, totalPills: number) => {
    setMedications(prev =>
      prev.map(med => {
        if (med.id === id) {
          return {
            ...med,
            currentPills,
            totalPills,
            // Reset taken status if we don't have enough pills for a dose
            takenToday: currentPills >= med.pillsPerDose ? med.takenToday : false,
          };
        }
        return med;
      })
    );
  };

  const resetAllTakenStatus = () => {
    setMedications(prev =>
      prev.map(med => ({
        ...med,
        takenToday: false,
      }))
    );
  };

  const getTotalMedications = () => medications.length;
  const getTakenToday = () => medications.filter(med => med.takenToday).length;
  const getLowStockCount = () => medications.filter(med => (med.currentPills / med.totalPills) <= 0.25).length;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2 text-primary-enhanced">Medication Tracker</h1>
        <p className="text-secondary-enhanced text-sleek">
          Keep track of your daily medications and pill counts
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-modern text-primary-enhanced">Total Medications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-enhanced">{getTotalMedications()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-modern text-primary-enhanced">Taken Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {getTakenToday()} / {getTotalMedications()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-modern text-primary-enhanced">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">
              {getLowStockCount()}
            </div>
            <p className="text-xs text-secondary-enhanced mt-1 text-sleek">≤25% remaining</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <AddMedicationForm onAddMedication={addMedication} />
        {medications.length > 0 && (
          <Button variant="outline" onClick={resetAllTakenStatus}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset All &quot;Taken Today&quot;
          </Button>
        )}
      </div>

      {/* Medications Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-modern text-primary-enhanced">Your Medications</CardTitle>
          <CardDescription className="text-sleek text-secondary-enhanced">
            Check off medications as you take them. Pills will be automatically subtracted from your current count.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MedicationTable
            medications={medications}
            onToggleTaken={toggleTaken}
            onDeleteMedication={deleteMedication}
            onUpdatePills={updatePills}
          />
        </CardContent>
      </Card>
    </div>
  );
}
