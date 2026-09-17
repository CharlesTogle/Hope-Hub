import { Outlet } from 'react-router-dom';
import PageHeading from '@/components/PageHeading';
import CalculatorDropdown from '@/components/health-calculators/CalculatorDropdown';
import Footer from '@/components/Footer';

export function HealthCalculatorWrapper () {
  return (
    <div className='min-h-full flex flex-col'>
      <PageHeading text='Fitness & Health Calculators' />
      <div className='content-container w-[90%]! pb-20 flex-1'>
        <div className='w-full flex'>
          <CalculatorDropdown />
        </div>
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
