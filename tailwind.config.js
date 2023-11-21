/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./extension/**/*.{html,js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FFF',
        foreground: '#36364A',
        muted: '#818498'
      },
      boxShadow: {
        primary: '0px 10px 36px 0px rgba(64, 47, 132, 0.04)',
        secondary:
          '0px 1px 2px 0px rgba(18, 43, 105, 0.1), 0px 2px 6px 0px rgba(18, 43, 105, 0.04), 0px 0px 0px 1px rgba(18, 43, 105, 0.08)'
      },
      borderColor: {
        primary: '#E1E3EA',
        secondary: 'rgba(90, 65, 244, 1)'
      },
      backgroundColor: {
        primary: 'rgba(90, 65, 244, 1)',
        secondary: 'rgba(90, 65, 244, 0.1)',
        muted: 'rgba(240, 240, 246, 1)'
      },
      textColor: {
        primary: 'rgba(90, 65, 244, 1)'
      }
    }
  },
  plugins: []
}
