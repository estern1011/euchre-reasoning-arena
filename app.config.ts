export default defineAppConfig({
  ui: {
    primary: 'blue',
    gray: 'slate',
    button: {
      default: {
        size: 'xl',
        color: 'primary',
        variant: 'solid',
      },
      rounded: 'rounded-md',
      font: 'font-bold',
      color: {
        primary: {
          solid: 'bg-gradient-to-br from-blue-900 to-blue-600 hover:from-blue-800 hover:to-blue-500 text-white border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]',
        },
      },
    },
    card: {
      background: 'bg-black/50',
      ring: 'ring-1 ring-gray-700',
      rounded: 'rounded-md',
      divide: 'divide-y divide-gray-700',
      header: {
        padding: 'px-6 py-4',
        background: 'bg-transparent',
      },
      body: {
        padding: 'px-6 py-4',
        background: 'bg-transparent',
      },
      footer: {
        padding: 'px-6 py-4',
        background: 'bg-transparent',
      },
    },
    badge: {
      rounded: 'rounded-md',
      font: 'font-mono font-bold',
      size: {
        lg: 'text-sm px-3 py-1.5',
      },
    },
    selectMenu: {
      background: 'bg-gray-900',
      ring: 'ring-1 ring-gray-600',
      rounded: 'rounded-md',
      font: 'font-mono',
      padding: 'px-4 py-3',
      option: {
        active: 'bg-blue-600 text-white',
        inactive: 'text-gray-200',
        selected: 'bg-blue-900/50',
      },
    },
    alert: {
      rounded: 'rounded-md',
      padding: 'p-4',
      font: 'font-mono',
    },
  },
});
