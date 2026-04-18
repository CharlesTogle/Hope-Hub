import React from 'react';
import PageHeading from '@/components/PageHeading';
import HealthCalculatorButton from '@/components/health-calculators/HealthCalculatorButtons';
import Footer from '@/components/Footer';

export default function HealthCalculator () {
  const description =
    "Welcome to the Health Calculators Hub — your go-to resource for simple, science-based tools to better understand your body and support your wellness goals. Whether you're tracking fitness progress, adjusting your diet, or just exploring your health status, our calculators provide personalized insights based on the information you enter." +
    '\nWe offer a variety of calculators designed to address key aspects of physical health. The BMI Calculator helps you see how your weight relates to your height and what that might indicate about your health. The BMR Calculator estimates how many calories your body needs at rest, which is useful for planning your food and energy intake. The IBW Calculator provides an ideal weight estimate based on height and sex, using several well-established medical formulas. The Body Fat Percentage Calculator gives you a closer look at your body composition by estimating how much of your weight comes from fat. Lastly, the Water Intake Calculator shows how much fluid you should drink each day based on your weight and activity level.' +
    '\nThese tools are designed for general educational purposes and are not a substitute for professional medical advice. They can be used to raise awareness, support healthy habit-building, or guide conversations with your healthcare provider — helping you take a more informed and confident approach to your health.';

  const HealthCalculatorButtons = [
    {
      text: 'Body Mass Index (BMI) Calculator',
      linkTo: '/health-calculators/bmi',
    },
    {
      text: 'Basal Metabolic Rate Calculator',
      linkTo: '/health-calculators/bmr',
    },
    {
      text: 'Ideal Body Weight (IBW) Calculator',
      className: '',
      linkTo: '/health-calculators/ibw',
    },
    {
      text: 'Body Fat Percentage Calculator',
      className: '',
      linkTo: '/health-calculators/bodyfatpercentage',
    },
    {
      text: 'Water Intake Calculator',
      className: '',
      linkTo: '/health-calculators/waterintake',
    },
    {
      text: 'Karvonen Heart Rate Calculator',
      className: '',
      linkTo: '/health-calculators/heartrate',
    }
  ];

  return (
    <div id='health-calculator' className='parent-container'>
      <PageHeading text='Fitness & Health Calculators' />
      <div id='health-calculators-content' className='content-container'>
        <div className='relative mb-10 w-full'>
          <div className='grid lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1 md:gap-y-1 lg:px-0 gap-y-1 gap-x-10'>
            {HealthCalculatorButtons.map((button, index) => (
              <HealthCalculatorButton
                key={index}
                text={button.text}
                linkTo={button.linkTo}
              ></HealthCalculatorButton>
            ))}
          </div>
          <hr className='border-1 border-primary-yellow yellow absolute w-55 right-0 bottom-0'></hr>
        </div>
        <h1 className='font-heading-small text-xl lg:text-3xl text-primary-blue self-start'>
          Description:
        </h1>
        <hr className='border-1 w-25 border-primary-yellow yellow self-start mt-1 mb-7'></hr>
        <p className='font-content text-justify ml-10 mb-10'>
          {description.split('\n').map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </p>
      </div>
      <Footer></Footer>
    </div>
  );
}
