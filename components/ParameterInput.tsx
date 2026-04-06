
import React from 'react';

interface ParameterInputProps {
  label: string;
  id: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

const ParameterInput: React.FC<ParameterInputProps> = ({ label, id, value, onChange, min, max, step, unit }) => {
  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-0.5">
        <label htmlFor={id} className="block text-[10px] font-bold text-gray-600 truncate mr-1">
          {label} {unit && `(${unit})`}
        </label>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) onChange(val);
          }}
          className="w-14 p-0.5 text-[10px] border border-gray-300 rounded bg-white text-center focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>
      <input
        type="range"
        id={id}
        name={id}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 block"
      />
    </div>
  );
};

export default ParameterInput;
    