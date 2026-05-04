import { Outlet } from 'react-router-dom';
import PageHeading from '@/components/PageHeading';
import CalculatorDropdown from '@/components/health-calculators/CalculatorDropdown';

export function HealthCalculatorWrapper () {
  return (
    <div>
      <PageHeading text='Fitness & Health Calculators' />
      <div className='content-container w-[90%]! pb-20'>
        <div className='w-full flex'>
          <CalculatorDropdown />
        </div>
        <Outlet />
      </div>
    </div>
  );
}
