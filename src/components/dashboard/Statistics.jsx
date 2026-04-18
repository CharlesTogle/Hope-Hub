import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import Container from './Container';
import useMobile from '@/hooks/useMobile';

export default function Statistics ({ progress, type }) {
  let percentage = Math.round((progress.completed / progress.total) * 100);
  if (isNaN(percentage)) percentage = 0;
  const chartData = [{ name: 'Progress', value: percentage, fill: 'green' }];
  const isMobile = useMobile();

  return (
    <div id='statistics' className='w-full'>
      <Container
        id='percentage'
        className='flex flex-row-reverse justify-center items-center gap-5 lg:gap-10'
      >
        <h2 className='text-xs lg:text-lg font-semibold'>
          {type} Overall Progress
        </h2>
        <div className='relative flex items-center justify-center'>
          <RadialBarChart
            width={isMobile ? 70 : 100}
            height={isMobile ? 70 : 100}
            cx='50%'
            cy='50%'
            innerRadius='100%'
            outerRadius='90%'
            barSize={10}
            data={chartData}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis
              type='number'
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar background dataKey='value' cornerRadius={10} />
          </RadialBarChart>
          <div className='absolute inset-0 flex flex-col items-center justify-center'>
            <p className='font-bold text-sm lg:text-lg'>{percentage}%</p>
          </div>
        </div>
      </Container>
      <Container
        id='count'
        className='flex flex-col items-start lg:pl-15 gap-5 text-lg py-5 pl-5 lg:py-10'
      >
        {[
          {
            label: 'Completed',
            value: progress.completed,
            color: 'green',
          },
          {
            label: 'Pending',
            value: progress.pending,
            color: 'primary-yellow',
          },
          { label: 'Incomplete', value: progress.incomplete, color: 'red' },
        ].map(({ label, value, color }) => (
          <p key={label} className={`text-${color} text-base font-semibold `}>
            <span className='mr-7 text-base lg:text-lg font-bold!'>
              {value}
            </span>
            <span className='opacity-60'>{label}</span>
          </p>
        ))}
      </Container>
    </div>
  );
}
