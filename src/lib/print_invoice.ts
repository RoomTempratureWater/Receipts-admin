import { getInvoiceHTMLTemplate } from '@/lib/template'

export function printInvoice(invoice: unknown): void {
  const html = getInvoiceHTMLTemplate(invoice)

  // Create a hidden iframe
  const iframe = document.createElement('iframe')
  iframe.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;')
  iframe.setAttribute('id', 'print-iframe')

  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) return

  doc.open()
  doc.write(html)
  doc.close()

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch (err) {
      console.error('Printing failed:', err)
    } finally {
      // Cleanup after a short delay to allow print dialog
      setTimeout(() => {
        iframe.remove()
      }, 1000)
    }
  }
}
