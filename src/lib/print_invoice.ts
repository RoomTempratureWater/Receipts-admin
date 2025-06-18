import { ChurchReceipt } from '@/lib/template'

export function printInvoice(invoice: unknown): void {
  const html = ChurchReceipt(invoice)

  const win = window.open('', '_blank')

  if (!win) {
    console.error('Failed to open print window.')
    return
  }

  win.document.open()
  win.document.write(
    html.replace(
      '</head>',
      `
        <meta name="viewport" content="width=device-width, initial-scale=1">

      </head>`
    )
  )
  win.document.close()

  // Wait for content to render before printing
  win.onload = () => {
    setTimeout(() => {
      win.focus()
      win.print()
      // Optionally close after print — mobile may block this
      // win.close()
    }, 300)
  }
}
