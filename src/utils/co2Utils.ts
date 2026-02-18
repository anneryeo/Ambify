interface CO2UIData {
  endColor: string;
  label: string;
  tip: string;
}

export const getCO2UIData = (value: number): CO2UIData => {
  if (value < 600) {
    return {
      endColor: '#507e10',
      label: 'Crisp',
      tip: 'Great for high-intensity focus.',
    };
  } else if (value < 1000) {
    return {
      endColor: '#00E5CB',
      label: 'Good',
      tip: 'Standard conditions for productivity.',
    };
  } else if (value < 1500) {
    return {
      endColor: '#EF9A22',
      label: 'Stagnant',
      tip: 'You might feel a "brain fog" starting.',
    };
  } else {
    return {
      endColor: '#2100DF',
      label: 'Heavy',
      tip: 'High CO2 can mimic anxiety. Open a window.',
    };
  }
};
