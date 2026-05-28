function ones(n: number) {
  const a = [
    '',
    'ONE',
    'TWO',
    'THREE',
    'FOUR',
    'FIVE',
    'SIX',
    'SEVEN',
    'EIGHT',
    'NINE',
    'TEN',
    'ELEVEN',
    'TWELVE',
    'THIRTEEN',
    'FOURTEEN',
    'FIFTEEN',
    'SIXTEEN',
    'SEVENTEEN',
    'EIGHTEEN',
    'NINETEEN',
  ]
  return a[n] ?? ''
}

function tens(n: number) {
  const a = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY']
  return a[n] ?? ''
}

function twoDigits(n: number) {
  if (n < 20) return ones(n)
  const t = Math.floor(n / 10)
  const o = n % 10
  return [tens(t), ones(o)].filter(Boolean).join(' ')
}

function threeDigits(n: number) {
  const h = Math.floor(n / 100)
  const r = n % 100
  const parts: string[] = []
  if (h) parts.push(`${ones(h)} HUNDRED`)
  if (r) parts.push(twoDigits(r))
  return parts.join(' ')
}

function chunkToWords(n: number) {
  if (n === 0) return ''
  if (n < 100) return twoDigits(n)
  return threeDigits(n)
}

/** Indian numbering system: crore, lakh, thousand, hundred */
export function amountToWordsINR(amount: number) {
  const n = Math.floor(Math.abs(amount))
  if (n === 0) return 'RUPEES ZERO ONLY'

  const crore = Math.floor(n / 10000000)
  const lakh = Math.floor((n % 10000000) / 100000)
  const thousand = Math.floor((n % 100000) / 1000)
  const hundredRest = n % 1000

  const parts: string[] = []
  if (crore) parts.push(`${chunkToWords(crore)} CRORE`)
  if (lakh) parts.push(`${chunkToWords(lakh)} LAKH`)
  if (thousand) parts.push(`${chunkToWords(thousand)} THOUSAND`)
  if (hundredRest) parts.push(chunkToWords(hundredRest))

  return `RUPEES ${parts.join(' ')} ONLY`.replace(/\s+/g, ' ').trim()
}

