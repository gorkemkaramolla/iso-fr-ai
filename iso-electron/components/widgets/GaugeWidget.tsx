import React from 'react';
// import { Gauge, gaugeClasses } from '@mui/x-charts/Gauge';

interface Props {
  value: number;
}

const GaugeWidget: React.FC<Props> = ({ value }) => {
  return (
    <div></div>
    // <div style={{ width: '100%', height: '100%' }}>
    //   <svg width='0' height='0'>
    //     <defs>
    //       <linearGradient id='gradient' x1='0%' y1='0%' x2='100%' y2='0%'>
    //         <stop
    //           offset='0%'
    //           style={{ stopColor: '#00CCFF', stopOpacity: 1 }}
    //         />
    //         <stop
    //           offset='100%'
    //           style={{ stopColor: '#7D00FF', stopOpacity: 1 }}
    //         />
    //       </linearGradient>
    //     </defs>
    //   </svg>
    //   <Gauge
    //     color
    //     value={parseFloat(value.toFixed(2))}
    //     valueMax={100}
    //     startAngle={-110}
    //     endAngle={110}
    //     sx={{
    //       [`& .${gaugeClasses.valueText}`]: {
    //         fontSize: 36,
    //         fill: 'currentColor',
    //         transform: 'translate(0px, 0px)',
    //         [`& tspan`]: {
    //           fill: 'currentColor',
    //         },
    //       },
    //       [`& .${gaugeClasses.valueArc}`]: {
    //         fill: 'url(#gradient)',
    //       },
    //       [`& .${gaugeClasses.referenceArc}`]: {
    //         fill: 'currentColor',
    //       },
    //     }}
    //     text={({ value, valueMax }) => `${value} \u00B0C`}
    //   />
    // </div>
  );
};

export default GaugeWidget;
