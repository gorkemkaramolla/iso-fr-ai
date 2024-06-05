import React from 'react';
import { Gauge, gaugeClasses } from '@mui/x-charts/Gauge';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

interface Props {
  value: number;
}

const theme = createTheme();

const GaugeWidget: React.FC<Props> = ({ value }) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ width: '100%', height: '100%' }}>
        <svg width='0' height='0'>
          <defs>
            <linearGradient id='gradient' x1='0%' y1='0%' x2='100%' y2='0%'>
              <stop
                offset='0%'
                style={{ stopColor: '#00CCFF', stopOpacity: 1 }}
              />
              <stop
                offset='100%'
                style={{ stopColor: '#7D00FF', stopOpacity: 1 }}
              />
            </linearGradient>
          </defs>
        </svg>
        <Gauge
          color
          value={parseFloat(value.toFixed(2))}
          valueMax={100}
          startAngle={-110}
          endAngle={110}
          sx={{
            [`& .${gaugeClasses.valueText}`]: {
              fontSize: 36,
              fill: 'white',
              transform: 'translate(0px, 0px)',
              [`& tspan`]: {
                fill: 'white', // replace 'yourColorHere' with the color you want
              },
            },
            [`& .${gaugeClasses.valueArc}`]: {
              fill: 'url(#gradient)',
            },
            [`& .${gaugeClasses.referenceArc}`]: {
              fill: 'white',
            },
          }}
          text={({ value, valueMax }) => `${value} \u00B0C`}
        />
      </div>
    </ThemeProvider>
  );
};

export default GaugeWidget;
