export function getInvoiceHTMLTemplate(invoice: any) {
  return `
    <html>
      <head>
        <style>
          body { font-family: sans-serif; padding: 2rem; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 0.5rem; border: 1px solid #ddd; }
          h1 { margin-bottom: 2rem; }
        </style>
      </head>
      <body>
        <h1>Invoice</h1>
        <table>
          <tr><th>Title</th><td>${invoice.title}</td></tr>
          <tr><th>Name</th><td>${invoice.name}</td></tr>
          <tr><th>Phone</th><td>${invoice.phone}</td></tr>
          <tr><th>Tag</th><td>${invoice.tags?.tag_name ?? 'None'}</td></tr>
          <tr><th>Amount</th><td>₹${invoice.amount}</td></tr>
          <tr><th>Date</th><td>${new Date(invoice.created_at).toLocaleDateString()}</td></tr>
        </table>
      </body>
    </html>
  `
}

