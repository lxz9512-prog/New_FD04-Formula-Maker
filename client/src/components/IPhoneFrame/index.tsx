import React, { type ReactNode } from 'react';

interface IPhoneFrameProps {
  children: ReactNode;
  background?: string;
  overlay?: ReactNode;
}

const IPhoneFrame: React.FC<IPhoneFrameProps> = ({
  children,
  background = 'transparent',
  overlay,
}) => {
  return (
    <div
      data-device-frame
      className="relative isolate mx-auto"
      style={{ width: 393, height: 852 }}
    >
      {/* Outer device frame - titanium border */}
      <div
        className="absolute inset-0 rounded-[55px]"
        style={{
          background: 'linear-gradient(145deg, #3a3a3c, #1c1c1e)',
          boxShadow:
            '12px 12px 24px hsl(330 10% 85% / 0.3), -12px -12px 24px hsl(0 0% 100% / 0.9), inset 0 0 2px hsl(0 0% 100% / 0.1)',
        }}
      />

      {/* Side buttons - volume up */}
      <div
        className="absolute rounded-l-sm"
        style={{
          left: -2,
          top: 180,
          width: 3,
          height: 30,
          background: 'linear-gradient(90deg, #2a2a2c, #3a3a3c)',
        }}
      />
      {/* Side buttons - volume down */}
      <div
        className="absolute rounded-l-sm"
        style={{
          left: -2,
          top: 225,
          width: 3,
          height: 30,
          background: 'linear-gradient(90deg, #2a2a2c, #3a3a3c)',
        }}
      />
      {/* Side buttons - silent switch */}
      <div
        className="absolute rounded-l-sm"
        style={{
          left: -2,
          top: 135,
          width: 3,
          height: 18,
          background: 'linear-gradient(90deg, #2a2a2c, #3a3a3c)',
        }}
      />
      {/* Side button - power */}
      <div
        className="absolute rounded-r-sm"
        style={{
          right: -2,
          top: 195,
          width: 3,
          height: 50,
          background: 'linear-gradient(270deg, #2a2a2c, #3a3a3c)',
        }}
      />

      {/* Inner bezel */}
      <div
        className="absolute rounded-[50px]"
        style={{
          inset: 4,
          background: '#0a0a0a',
        }}
      />

      {/* Screen area */}
      <div
        data-device-screen
        className="absolute overflow-hidden rounded-[46px]"
        style={{
          inset: 8,
          background,
        }}
      >
        {/* Dynamic Island */}
        <div className="absolute top-[11px] left-1/2 z-20 -translate-x-1/2">
          <div
            className="rounded-full bg-black"
            style={{
              width: 126,
              height: 37,
            }}
          />
        </div>

        {/* Status bar */}
        <div className="relative z-10 flex items-center justify-between px-8 pt-[26px]">
          <span
            className="text-[17px] font-semibold leading-none"
            style={{
              color: '#000000',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            }}
          >
            7:41
          </span>
          <div className="flex items-center gap-[5px]">
            {/* Signal bars */}
            <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
              <rect x="0" y="9" width="3" height="3" rx="0.5" fill="#000000" />
              <rect
                x="4.5"
                y="6"
                width="3"
                height="6"
                rx="0.5"
                fill="#000000"
              />
              <rect x="9" y="3" width="3" height="9" rx="0.5" fill="#000000" />
              <rect
                x="13.5"
                y="0"
                width="3"
                height="12"
                rx="0.5"
                fill="#000000"
              />
            </svg>
            {/* WiFi */}
            <svg width="17" height="12" viewBox="0 0 20 16" fill="none">
              <circle cx="10" cy="14.5" r="1.8" fill="#000000" />
              <path
                d="M5.05 9.55 A7 7 0 0 1 14.95 9.55"
                stroke="#000000"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M1.51 6.01 A12 12 0 0 1 18.49 6.01"
                stroke="#000000"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            {/* Battery */}
            <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
              <rect
                x="0.5"
                y="0.5"
                width="22"
                height="12"
                rx="2.5"
                stroke="#000000"
                strokeOpacity="0.35"
              />
              <rect x="2" y="2" width="19" height="9" rx="1.5" fill="#000000" />
              <path
                d="M24 4.5v4a2 2 0 000-4z"
                fill="#000000"
                fillOpacity="0.4"
              />
            </svg>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="h-full w-full overflow-y-auto pb-[34px]">
          {children}
        </div>

        {/* Overlay layer - rendered at screen level, above content, not clipped by overflow */}
        {overlay}

        {/* Home indicator */}
        <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 -translate-x-1/2">
          <div
            className="rounded-full bg-black/20"
            style={{
              width: 134,
              height: 5,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default IPhoneFrame;
