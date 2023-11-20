import React from 'react'

export function Logo({props}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="56"
      height="56"
      fill="none"
      viewBox="0 0 56 56"
      {...props}
    >
      <rect width="56" height="56" fill="#DCD6FF" rx="16"></rect>
      <rect
        width="39"
        height="39"
        x="8.5"
        y="8.5"
        fill="url(#paint0_linear_24_2370)"
        rx="19.5"
      ></rect>
      <rect
        width="39"
        height="39"
        x="8.5"
        y="8.5"
        stroke="#6149F6"
        rx="19.5"
      ></rect>
      <g fill="#fff" stroke="#6149F6" clipPath="url(#clip0_24_2370)">
        <path d="M23.78 20.634l.408-.235-.21-.422a4.432 4.432 0 01-.458-1.797l-.031-.78-.696.355A11.533 11.533 0 0016.5 27.998h0V28c.002.87.104 1.738.302 2.585a3.525 3.525 0 102.843-1.058A8.386 8.386 0 0119.5 28a8.523 8.523 0 014.28-7.366zM36.5 28.023v.468l.467.03c.621.042 1.227.212 1.778.5l.687.36.044-.774.005-.075c.01-.166.02-.349.02-.532v-.001a11.523 11.523 0 00-8.142-10.99 3.525 3.525 0 10-.501 2.989A8.524 8.524 0 0136.5 28s0 0 0 0v.022zM33.185 32.622a3.49 3.49 0 00.311 1.844 8.442 8.442 0 01-9.766.877l-.407-.239-.262.392c-.343.514-.79.95-1.311 1.282l-.652.414.645.425a11.39 11.39 0 0014.092-1.23c.264.069.536.107.81.113h.01a3.5 3.5 0 002.803-5.6h.556l-1.603-.932a3.491 3.491 0 00-5.226 2.654z"></path>
      </g>
      <defs>
        <linearGradient
          id="paint0_linear_24_2370"
          x1="28"
          x2="28"
          y1="8"
          y2="48"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#8E7CFF"></stop>
          <stop offset="1" stopColor="#5A41F4"></stop>
        </linearGradient>
        <clipPath id="clip0_24_2370">
          <path
            fill="#fff"
            d="M0 0H24V24H0z"
            transform="translate(16 15)"
          ></path>
        </clipPath>
      </defs>
    </svg>
  )
}
