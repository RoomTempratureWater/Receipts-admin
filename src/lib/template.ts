
import Image from 'next/image';

function numberToWords(num) {
  if (num === 0) return 'Zero Rupees Only';
  
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function convertLessThanOneThousand(n) {
    if (n === 0) return '';
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
    return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanOneThousand(n % 100) : '');
  }
  
  const scales = ['', 'Thousand', 'Lakh', 'Crore'];
  let words = [];
  let scaleIndex = 0;
  
  // Handle negative numbers
  if (num < 0) {
    words.push('Negative');
    num = Math.abs(num);
  }
  
  // Convert number to words
  while (num > 0) {
    const chunk = num % 1000;
    if (chunk !== 0) {
      let chunkWords = convertLessThanOneThousand(chunk);
      if (scaleIndex > 0) {
        chunkWords += ' ' + scales[scaleIndex];
      }
      words.unshift(chunkWords);
    }
    num = Math.floor(num / 1000);
    scaleIndex++;
  }
  
  // Handle Indian numbering system (Lakhs and Crores)
  if (words.length > 1) {
    // For numbers above 99,999 (1 Lakh)
    const lakhIndex = words.findIndex(word => word.includes('Lakh'));
    const croreIndex = words.findIndex(word => word.includes('Crore'));
    
    if (lakhIndex !== -1) {
      const lakhValue = words[lakhIndex].replace(' Lakh', '');
      words[lakhIndex] = lakhValue + ' Lakh';
    }
    
    if (croreIndex !== -1) {
      const croreValue = words[croreIndex].replace(' Crore', '');
      words[croreIndex] = croreValue + ' Crore';
    }
  }
  
  const result = words.join(' ') + ' Rupees Only';
  return result.charAt(0).toUpperCase() + result.slice(1);
}


function getPublicImage(imagePath: string): string{
  // Remove leading slash if present (Next.js handles this automatically)
  const normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `/${normalizedPath}`;
};

export function ChurchReceipt(invoice: any) {
  const imageUrl = getPublicImage('images/methodist.png');
  var ref_id = "";
  if(invoice.payment_reference != null){
    ref_id = invoice.payment_reference
  }
  var effective = "";
  if(invoice.effective_from != null){
    effective = invoice.effective_from + " to " + invoice.effective_to;
  }
  //const dateISO = new Date(isoString);
  return `
<html>
<head>
<title>${invoice.id_short}</title>
</head>
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
<body>    
<div class="print-container grid" style="page-break-inside: avoid;">
<div class="grid grid-rows-2 gap-1">

<div class="mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md p-6">

  <div class="items-center justify-center mb-6 flex">
    <img alt="Methodist Church Logo - Red cross symbol" src="${imageUrl}" class="w-10 h-10 mb-3">
    <div class="text-center">
      <p class="text-red-600 font-bold text-lg dark:text-red-400">METHODIST MARATHI CHURCH</p>
      <p class="text-gray-700 text-sm dark:text-gray-300">East Street, Pune - 411 001.</p>
      <p class="text-gray-600 text-xs dark:text-gray-400">(Regd. Public Trust No. D. 47, Pune)</p>
    </div>
  </div>
  <div class="space-y-3">
    <div class="justify-between flex">
      <span class="text-gray-700 text-sm dark:text-gray-300">No.:</span>
      <span class="text-gray-900 font-medium dark:text-white">${invoice.id_short}</span>
      <span class="text-gray-700 text-sm dark:text-gray-300">Date:</span>
      <span class="text-blue-600 font-medium dark:text-blue-400">${invoice.created_at.split('T')[0]}</span>
    </div>
    <div class="pb-2 border-b border-gray-200 dark:border-gray-600">
      <div class="flex">
        <span class="text-gray-700 text-sm w-32 dark:text-gray-300">Received with thanks from</span>
        <span class="text-blue-600 font-medium dark:text-blue-400 border-b border-blue-300 dark:border-blue-600
            flex-1">${invoice.name}</span>
      </div>
    </div>
    <div class="pb-2 border-b border-gray-200 dark:border-gray-600">
      <div class="flex">
        <span class="text-gray-700 text-sm w-20 dark:text-gray-300">Residing at</span>
        <span class="text-blue-600 font-medium dark:text-blue-400 border-b border-blue-300 dark:border-blue-600
            flex-1">${invoice.address}</span>
      </div>
    </div>
    <div class="pb-2 border-b border-gray-200 dark:border-gray-600">
      <div class="flex">
        <span class="text-gray-700 text-sm w-16 dark:text-gray-300">Rupees</span>
        <span class="text-blue-600 font-medium dark:text-blue-400 border-b border-blue-300 dark:border-blue-600
            flex-1">${numberToWords(invoice.amount)}</span>
      </div>
    </div>
    <div class="justify-between pb-2 flex border-b border-gray-200 dark:border-gray-600">
      <div class="flex">
        <span class="text-gray-700 text-sm dark:text-gray-300">UPI / Cheque No</span>
        <span class="text-blue-600 font-medium dark:text-blue-400 border-b ml-2 px-2 border-blue-300 dark:border-blue-600
            flex-1">${ref_id}</span>
      </div>
      <div class="flex">
        <span class="text-gray-700 text-sm dark:text-gray-300">Date</span>
        <span class="text-blue-600 font-medium dark:text-blue-400 border-b ml-2 px-2 border-blue-300 dark:border-blue-600
            flex-1">${invoice.date}</span>
      </div>
    </div>

    <div class="pb-2 border-b border-gray-200 dark:border-gray-600">
      <div class="flex">
        <span class="text-gray-700 text-sm dark:text-gray-300">being Tithe from</span>
        <span class="text-blue-600 font-medium ml-2 dark:text-blue-400 border-b border-blue-300 dark:border-blue-600
            flex-1">${effective}</span>
      </div>
    </div>
    <div class="justify-between items-end pt-4 flex">
      <div>
        <div class="items-center flex">
          <span class="text-gray-700 text-sm dark:text-gray-300">Rs.</span>
          <span class="text-blue-600 font-bold text-lg ml-2 px-2 dark:text-blue-400 border-b border-blue-300
              dark:border-blue-600">${invoice.amount}/-</span>
        </div>
        <p class="text-gray-600 text-xs mt-1 dark:text-gray-400">Subject to realization of Cheque</p>
      </div>
      <div class="text-right">
        <div class="w-24 h-12 mb-1 items-end justify-center border-b border-blue-300 dark:border-blue-600 flex">

        </div>
        <p class="text-gray-700 text-xs dark:text-gray-300">Hon. Treasurer</p>
      </div>
    </div>
<div clas="" style="font-size: 10px;">Member Copy</div>
  </div>
</div>
<div class="mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md p-6">
  <div class="items-center justify-center mb-6 flex">
    <img alt="Methodist Church Logo - Red cross symbol" src="${imageUrl}" class="w-10 h-10 mb-3">
    <div class="text-center">
      <p class="text-red-600 font-bold text-lg dark:text-red-400">METHODIST MARATHI CHURCH</p>
      <p class="text-gray-700 text-sm dark:text-gray-300">East Street, Pune - 411 001.</p>
      <p class="text-gray-600 text-xs dark:text-gray-400">(Regd. Public Trust No. D. 47, Pune)</p>
    </div>
  </div>
  <div class="space-y-3">
    <div class="justify-between flex">
      <span class="text-gray-700 text-sm dark:text-gray-300">No.:</span>
      <span class="text-gray-900 font-medium dark:text-white">${invoice.id_short}</span>
      <span class="text-gray-700 text-sm dark:text-gray-300">Date:</span>
      <span class="text-blue-600 font-medium dark:text-blue-400">${invoice.created_at.split('T')[0]}</span>
    </div>
    <div class="pb-2 border-b border-gray-200 dark:border-gray-600">
      <div class="flex">
        <span class="text-gray-700 text-sm w-32 dark:text-gray-300">Received with thanks from</span>
        <span class="text-blue-600 font-medium dark:text-blue-400 border-b border-blue-300 dark:border-blue-600
            flex-1">${invoice.name}</span>
      </div>
    </div>
    <div class="pb-2 border-b border-gray-200 dark:border-gray-600">
      <div class="flex">
        <span class="text-gray-700 text-sm w-20 dark:text-gray-300">Residing at</span>
        <span class="text-blue-600 font-medium dark:text-blue-400 border-b border-blue-300 dark:border-blue-600
            flex-1">${invoice.address}</span>
      </div>
    </div>
    <div class="pb-2 border-b border-gray-200 dark:border-gray-600">
      <div class="flex">
        <span class="text-gray-700 text-sm w-16 dark:text-gray-300">Rupees</span>
        <span class="text-blue-600 font-medium dark:text-blue-400 border-b border-blue-300 dark:border-blue-600
            flex-1">${numberToWords(invoice.amount)}</span>
      </div>
    </div>
    <div class="justify-between pb-2 flex border-b border-gray-200 dark:border-gray-600">
      <div class="flex">
        <span class="text-gray-700 text-sm dark:text-gray-300">UPI / Cheque No</span>
        <span class="text-blue-600 font-medium dark:text-blue-400 border-b ml-2 px-2 border-blue-300 dark:border-blue-600
            flex-1">${ref_id}</span>
      </div>
      <div class="flex">
        <span class="text-gray-700 text-sm dark:text-gray-300">Date</span>
        <span class="text-blue-600 font-medium dark:text-blue-400 border-b ml-2 px-2 border-blue-300 dark:border-blue-600
            flex-1">${invoice.date}</span>
      </div>
    </div>

    <div class="pb-2 border-b border-gray-200 dark:border-gray-600">
      <div class="flex">
        <span class="text-gray-700 text-sm dark:text-gray-300">being Tithe from</span>
        <span class="text-blue-600 font-medium ml-2 dark:text-blue-400 border-b border-blue-300 dark:border-blue-600
            flex-1">${effective}</span>
      </div>
    </div>
    <div class="justify-between items-end pt-4 flex">
      <div>
        <div class="items-center flex">
          <span class="text-gray-700 text-sm dark:text-gray-300">Rs.</span>
          <span class="text-blue-600 font-bold text-lg ml-2 px-2 dark:text-blue-400 border-b border-blue-300
              dark:border-blue-600">${invoice.amount}/-</span>
        </div>
        <p class="text-gray-600 text-xs mt-1 dark:text-gray-400">Subject to realization of Cheque</p>
      </div>
      <div class="text-right">
        <div class="w-24 h-12 mb-1 items-end justify-center border-b border-blue-300 dark:border-blue-600 flex">

        </div>
        <p class="text-gray-700 text-xs dark:text-gray-300">Hon. Treasurer</p>
      </div>
    </div>
<div clas="" style="font-size: 10px;">Church Copy</div>
  </div>
</div>

</div>

</div>
</div>

</body>
</html>
`
}
