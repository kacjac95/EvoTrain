import React, { useMemo } from 'react';
import Model from 'react-body-highlighter';
import { EXERCISES } from '../config/data';

// Zabezpieczenie: tylko te partie są obsługiwane przez bibliotekę
const VALID_MUSCLES = [
  'trapezius', 'upper-back', 'lower-back', 'chest', 'biceps',
  'triceps', 'forearm', 'back-deltoids', 'front-deltoids',
  'abs', 'obliques', 'adductor', 'hamstring', 'quadriceps',
  'abductors', 'calves', 'gluteal', 'head', 'neck'
];

export default function MuscleMap({ dayExercises }) {
  const { mapData, mapColors } = useMemo(() => {
    if (!dayExercises || dayExercises.length === 0) return { mapData: [], mapColors: [] };

    const muscleCounts = {};
    
    dayExercises.forEach(ex => {
      const exerciseData = EXERCISES.find(e => e.id === ex.id);
      if (exerciseData && exerciseData.muscleIds) {
        exerciseData.muscleIds.forEach(mId => {
          // Dodajemy mięsień do statystyk tylko, jeśli jest na bezpiecznej liście
          if (VALID_MUSCLES.includes(mId)) {
            muscleCounts[mId] = (muscleCounts[mId] || 0) + 1;
          } else {
            console.warn(`Zignorowano nieobsługiwany mięsień: ${mId}`);
          }
        });
      }
    });

    const intensityLevels = { low: [], medium: [], high: [] };

    Object.entries(muscleCounts).forEach(([mId, count]) => {
      if (count === 1) intensityLevels.low.push(mId);
      else if (count === 2) intensityLevels.medium.push(mId);
      else intensityLevels.high.push(mId);
    });

    const finalData = [];
    const finalColors = [];

    if (intensityLevels.low.length > 0) {
      finalData.push({ name: 'Niskie obciążenie', muscles: intensityLevels.low });
      finalColors.push('rgba(0, 229, 255, 0.35)'); 
    }
    
    if (intensityLevels.medium.length > 0) {
      finalData.push({ name: 'Średnie obciążenie', muscles: intensityLevels.medium });
      finalColors.push('rgba(0, 229, 255, 0.7)');
    }
    
    if (intensityLevels.high.length > 0) {
      finalData.push({ name: 'Wysokie obciążenie', muscles: intensityLevels.high });
      finalColors.push('rgba(0, 229, 255, 1.0)');
    }

    return { mapData: finalData, mapColors: finalColors };
  }, [dayExercises]);

  return (
    <div className="muscle-map-container" style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '15px 0' }}>
      <Model
        data={mapData}
        style={{ width: '8rem', height: '16rem' }}
        type="anterior"
        highlightedColors={mapColors}
      />
      <Model
        data={mapData}
        style={{ width: '8rem', height: '16rem' }}
        type="posterior"
        highlightedColors={mapColors}
      />
    </div>
  );
}