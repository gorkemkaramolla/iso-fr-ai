import React from 'react';
import GaugeComponent from 'react-gauge-component';

interface Props {
  maxValue: number;
  value: number;
}

const GaugeWidget: React.FC<Props> = ({ maxValue, value }) => {
  return (
    <GaugeComponent
      type='semicircle'
      arc={{
        width: 0.2,
        padding: 0.005,
        cornerRadius: 1,
        subArcs: [
          {
            limit: maxValue * 0.25,
            color: 'hsl(132, 81%, 54%)', // Green
            showTick: true,
            tooltip: {
              text: 'Too low temperature!',
            },
          },
          {
            limit: maxValue * 0.5,
            color: 'hsl(60, 100%, 50%)', // Light green
            showTick: true,
            tooltip: {
              text: 'Low temperature!',
            },
          },
          {
            limit: maxValue * 0.75,
            color: 'hsl(32, 100%, 51%)', // Yellow
            showTick: true,
            tooltip: {
              text: 'Moderate temperature!',
            },
          },
          {
            limit: maxValue,
            color: 'hsl(0, 100%, 50%)', // Red
            showTick: true,
            tooltip: {
              text: 'High temperature!',
            },
          },
        ],
      }}
      pointer={{
        color: '', // Needle color
        length: 0.8,
        width: 15,
      }}
      labels={{
        valueLabel: { formatTextValue: (value) => value + 'ºC' },
        tickLabels: {
          type: 'outer',
          ticks: [
            { value: maxValue * 0.125 },
            { value: maxValue * 0.375 },
            { value: maxValue * 0.625 },
            { value: maxValue * 0.875 },
          ],
        },
      }}
      value={value}
      minValue={0}
      maxValue={maxValue}
    />
  );
};

export default GaugeWidget;
