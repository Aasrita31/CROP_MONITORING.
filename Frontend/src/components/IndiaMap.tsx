import React from 'react';
import { INDIA_STATES_DATA } from './india-states-data';

interface IndiaMapProps {
  selectedStateId: string | null;
  onStateClick: (stateId: string, stateName: string) => void;
}

export const IndiaMap: React.FC<IndiaMapProps> = ({ selectedStateId, onStateClick }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gray-900/50 rounded-2xl overflow-hidden border border-white/10 p-4">
      {/* Container for the SVG map */}
      <svg
        viewBox="0 0 1000 1000"
        className="w-full h-full max-h-[600px] drop-shadow-2xl filter"
        style={{
          filter: 'drop-shadow(0 0 20px rgba(74, 222, 128, 0.2))'
        }}
      >
        {INDIA_STATES_DATA.map((state) => {
          const isSelected = selectedStateId === state.id;
          return (
            <path
              key={state.id}
              id={state.id}
              d={state.d}
              onClick={() => onStateClick(state.id, state.name)}
              className={`
                cursor-pointer transition-all duration-300 ease-in-out
                stroke-[0.5] stroke-gray-400
                ${isSelected ? 'fill-green-500 stroke-white stroke-[1.5] scale-[1.01] origin-center z-10' : 'fill-gray-800 hover:fill-green-900'}
              `}
              style={{
                transformOrigin: 'center center'
              }}
            >
              <title>{state.name}</title>
            </path>
          );
        })}
      </svg>

      {/* Decorative overlays */}
      <div className="absolute top-4 left-4 flex items-center space-x-2 text-xs font-mono text-green-400">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
        <span>LIVE SATELLITE FEED: 10mm RES</span>
      </div>
    </div>
  );
};
