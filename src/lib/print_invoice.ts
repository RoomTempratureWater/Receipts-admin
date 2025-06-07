import { getInvoiceHTMLTemplate } from '@/lib/template'
export function printInvoice(invoice: any) {
  const html = getInvoiceHTMLTemplate(invoice)

  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (printWindow) {
    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()

    // Wait a bit before printing (ensure styles load)
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }
}
