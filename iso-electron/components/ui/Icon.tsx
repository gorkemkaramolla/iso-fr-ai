// Icon.tsx
// change any hardcoded strings to adjust for your default values
import React from "react"

function classNames(...classes: Array<string>): string {
  return classes.filter(Boolean).join(` `)
}

export interface IIconProps {
  className?: string
  hasGradient?: boolean
  stops?: Array<{
    offset?: number
    color: string
    opacity?: number
  }>
  rotateGradient?: number
}

interface IIconParentProps extends IIconProps {
  sourceSvgWidth?: number
  sourceSvgHeight?: number
  children: React.ReactNode
}

function Icon({
  children,
  className,
  stops,
  rotateGradient,
  hasGradient = false,
  sourceSvgWidth = 24,
  sourceSvgHeight = 24,
}: IIconParentProps): JSX.Element {
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${sourceSvgWidth} ${sourceSvgHeight}`}
      className={classNames(
        hasGradient ? `` : `fill-current`,
        className ? className : `w-6 h-6 text-black`
      )}
      fill={hasGradient ? `url(#${gradientId})` : ``}
    >
      {hasGradient && (
        <defs>
          <linearGradient
            id={gradientId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
            gradientTransform={`rotate(${
              typeof rotateGradient !== `undefined` ? rotateGradient : 25
            })`}
          >
            {stops ? (
              <>
                {stops.map((stop, index) => (
                  <stop
                    key={index}
                    offset={
                      stop?.offset
                        ? `${stop.offset}%`
                        : index === 0
                        ? `0%`
                        : index === stops.length
                        ? `100%`
                        : `${index * (100 / (stops.length - 1))}%`
                    }
                    style={{
                      stopColor: stop.color,
                      stopOpacity: stop?.opacity ? stop.opacity : 1,
                    }}
                  />
                ))}
              </>
            ) : (
              <>
                <stop
                  offset={`0%`}
                  style={{
                    stopColor: `#005590`,
                    stopOpacity: 1,
                  }}
                />
                <stop
                  offset={`50%`}
                  style={{
                    stopColor: `#007b91`,
                    stopOpacity: 1,
                  }}
                />
                <stop
                  offset={`100%`}
                  style={{
                    stopColor: `#56a730`,
                    stopOpacity: 1,
                  }}
                />
              </>
            )}
          </linearGradient>
        </defs>
      )}
      {children}
    </svg>
  )
}

export default Icon