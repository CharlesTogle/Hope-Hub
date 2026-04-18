import { PhysicalFitnessTestContext } from '@/hooks/usePhysicalFitnessData';
import { useState } from 'react';
import { PhysicalFitnessData } from '@/utilities/PhysicalFitnessData';

export const PhysicalFitnessDataProvider = ({ children }) => {
  const [physicalFitnessData, setPhysicalFitnessData] =
    useState(PhysicalFitnessData);

  return (
    <PhysicalFitnessTestContext.Provider
      value={{ physicalFitnessData, setPhysicalFitnessData }}
    >
      {children}
    </PhysicalFitnessTestContext.Provider>
  );
};

export default PhysicalFitnessDataProvider;
