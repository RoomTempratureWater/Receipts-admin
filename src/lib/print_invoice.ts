export function printInvoice(invoice: unknown) {
  const html = getInvoiceHTMLTemplate(invoice)

  // Create a hidden iframe
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.id = 'print-iframe'

  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (doc) {
    doc.open()
    doc.write(html)
    doc.close()

    iframe.onload = () => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()

      // Clean up after printing
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1000)
    }
  }
}
