import { useContext } from "react";
import { createContext } from "react";

export const PhysicalFitnessTestContext = createContext();

export const usePhysicalFitnessData = () => {
    const context = useContext(PhysicalFitnessTestContext)

    if(!context){
        throw new Error("usePhysicalFitnessData must be used within a provider");
    }
    return context;
}

