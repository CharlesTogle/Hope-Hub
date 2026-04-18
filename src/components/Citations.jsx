import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function Citation ({ title, citations }) {
  return (
    <div className='font-content'>
      <Accordion type='single' collapsible className='w-full'>
        <AccordionItem value='references'>
          <AccordionTrigger className='w-full [&>svg]: [&[data-state=open]>svg]:rotate-180 cursor-pointer '>
            <div className='flex flex-col w-full'>
              <span className='text-xl md:text-2xl text-primary-blue font-content font-bold'>
                {title || 'References'}:
              </span>
              <hr className='w-1/4 border-1 border-primary-yellow' />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {citations.map((citation, index) => (
              <div className='mb-2 text-wrap text-justify' key={index}>
                <div>
                  {citation.name}
                  <a
                    href={citation.link}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-400 hover:underline'
                  >
                    {' '}
                    {citation.link}{' '}
                  </a>
                </div>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
