import { buildTrackingLink } from '../utils/trackingLink'

export const MAHADEV_COMPANY_LINES = [
  'MAHADEV ENTERPRISES',
  'ADDRESS : ALG-16,PRABHAKAR PLAZA,',
  'STATION ROAD,KOLHAPUR - 416001',
] as const

export const DEFAULT_ORIGIN = 'KOLHAPUR'

export type ConsignmentLabelData = {
  destination?: string | null
  bookingDate: string | Date
  awbNumber: string
  origin?: string
  fromLines: string[]
  toLines: string[]
  contents?: string | null
  value?: string | number | null
  weight?: string | number | null
  trackingUrl?: string | null
}

function formatDate(d: string | Date) {
  return String(d).slice(0, 10)
}

function formatCell(v: string | number | null | undefined) {
  if (v == null || v === '') return '\u00a0'
  return String(v)
}

function AddressBlock(props: { label: string; lines: string[] }) {
  return (
    <div className="flex h-full min-h-[140px] flex-col items-start p-2 text-left">
      <div>{props.label}</div>
      {props.lines.map((line, i) => (
        <div key={i} className="mt-1 whitespace-pre-wrap">
          {line}
        </div>
      ))}
    </div>
  )
}

export function ConsignmentLabel({ data }: { data: ConsignmentLabelData }) {
  const origin = data.origin ?? DEFAULT_ORIGIN

  return (
    <table className="consignment-label w-full border-collapse bg-white text-black">
      <colgroup>
        <col className="w-[38%]" />
        <col className="w-[15.5%]" />
        <col className="w-[15.5%]" />
        <col className="w-[15.5%]" />
        <col className="w-[15.5%]" />
      </colgroup>
      <tbody>
        <tr>
          <td className="consignment-label-cell align-top" rowSpan={2}>
            <div className="space-y-0.5 p-2 text-left leading-tight">
              {MAHADEV_COMPANY_LINES.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </td>
          <td className="consignment-label-cell consignment-label-hdr text-center">ORIGIN</td>
          <td className="consignment-label-cell consignment-label-hdr text-center">DESTINATION</td>
          <td className="consignment-label-cell consignment-label-hdr text-center">DATE</td>
          <td className="consignment-label-cell consignment-label-hdr text-center">AWB NUMBER</td>
        </tr>
        <tr>
          <td className="consignment-label-cell text-center">{origin}</td>
          <td className="consignment-label-cell text-center">{formatCell(data.destination)}</td>
          <td className="consignment-label-cell text-center">{formatDate(data.bookingDate)}</td>
          <td className="consignment-label-cell text-center font-semibold">{data.awbNumber}</td>
        </tr>
        <tr>
          <td className="consignment-label-cell p-0 align-top" colSpan={5}>
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="consignment-label-cell w-1/2 border-l-0 border-t-0 p-0 align-top">
                    <AddressBlock label="FROM," lines={data.fromLines} />
                  </td>
                  <td className="consignment-label-cell w-1/2 border-r-0 border-t-0 p-0 align-top">
                    <AddressBlock label="TO," lines={data.toLines} />
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
        <tr>
          <td className="consignment-label-cell consignment-label-hdr text-center">CONTENTS</td>
          <td className="consignment-label-cell consignment-label-hdr text-center">VALUE</td>
          <td className="consignment-label-cell consignment-label-hdr text-center">WEIGHT</td>
          <td className="consignment-label-cell consignment-label-hdr text-center" colSpan={2}>
            TRACK YOUR SHIPMENT ON
          </td>
        </tr>
        <tr>
          <td className="consignment-label-cell text-center">{formatCell(data.contents)}</td>
          <td className="consignment-label-cell text-center">{formatCell(data.value)}</td>
          <td className="consignment-label-cell text-center">{formatCell(data.weight)}</td>
          <td className="consignment-label-cell break-all px-2 py-3 text-center text-xs leading-snug" colSpan={2}>
            {data.trackingUrl ? (
              <span className="print:text-black">{data.trackingUrl}</span>
            ) : (
              '\u00a0'
            )}
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export function accountBookingToConsignmentLabel(row: {
  bookingDate: string | Date
  courierNumber: string
  destination?: string | null
  customerName: string
  customerPhone?: string | null
  parcelType?: string | null
  weight?: string | number | null
  charges?: string | number | null
  accountParty?: { name?: string; address?: string | null; phone?: string | null } | null
  courierCompany?: { trackingUrl?: string | null } | null
}): ConsignmentLabelData {
  const party = row.accountParty
  const fromLines = [party?.name, party?.address, party?.phone].filter(Boolean) as string[]
  const toLines = [row.customerName, row.customerPhone, row.destination].filter(Boolean) as string[]

  return {
    destination: row.destination,
    bookingDate: row.bookingDate,
    awbNumber: row.courierNumber,
    fromLines: fromLines.length ? fromLines : ['—'],
    toLines: toLines.length ? toLines : ['—'],
    contents: row.parcelType,
    value: row.charges,
    weight: row.weight,
    trackingUrl: buildTrackingLink(row.courierCompany?.trackingUrl, row.courierNumber),
  }
}
