import { amountToWordsINR } from '../utils/amountWords'

export type InvoicePrintParty = {
  name?: string | null
  address?: string | null
  phone?: string | null
  gstNumber?: string | null
}

export type InvoicePrintRow = {
  bookingDate: string | Date
  customerName: string
  courierName: string
  courierNumber: string
  destination?: string | null
  weight?: string | number | null
  amount?: string | number | null
}

export type InvoicePrintData = {
  companyName: string
  companyAddressLine: string
  companyPhonesLine?: string
  companyGstNo?: string
  companyPanNo?: string
  billNo: string
  billDate: string
  periodFrom: string
  periodTo: string
  sacCode?: string
  party: InvoicePrintParty
  billMonthLabel?: string
  rows: InvoicePrintRow[]
  remark?: string
  cgstPct?: number
  sgstPct?: number
  subtotal?: string | number
  total?: string | number
}

function cell(v: any) {
  if (v == null || v === '') return '\u00a0'
  return String(v)
}

function fmtDate(d: string | Date) {
  return String(d).slice(0, 10)
}

function toNum(v: any) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function fmtMoney(n: number) {
  return n.toFixed(2)
}

export function InvoicePrint({ data }: { data: InvoicePrintData }) {
  const subtotal = toNum(data.subtotal)
  const cgstPct = data.cgstPct ?? 9
  const sgstPct = data.sgstPct ?? 9
  const cgst = (subtotal * cgstPct) / 100
  const sgst = (subtotal * sgstPct) / 100
  const gross = subtotal + cgst + sgst
  const rounded = Math.round(gross)
  const roundOff = rounded - gross
  const net = gross + roundOff

  return (
    <div className="invoice-print bg-white text-black">
      <div className="invoice-box">
        <div className="invoice-company">
          <div className="invoice-company-title">{data.companyName}</div>
          <div className="invoice-company-sub">{data.companyAddressLine}</div>
          {data.companyPhonesLine && <div className="invoice-company-sub">{data.companyPhonesLine}</div>}
          <div className="invoice-company-meta">
            <div>{data.companyGstNo ? `GST NO.${data.companyGstNo}` : '\u00a0'}</div>
            <div>{data.companyPanNo ? `PAN NO. ${data.companyPanNo}` : '\u00a0'}</div>
          </div>
        </div>

        <div className="invoice-top-grid">
          <div className="invoice-party">
            <div className="invoice-label">TO</div>
            <div className="invoice-party-line">{cell(data.party.name)}</div>
            {data.party.address && <div className="invoice-party-line">{data.party.address}</div>}
            {data.party.phone && <div className="invoice-party-line">MOB.{data.party.phone}</div>}
            {data.party.gstNumber && <div className="invoice-party-line">GST NO.{data.party.gstNumber}</div>}
          </div>

          <div className="invoice-meta">
            <div className="invoice-meta-line">
              <span className="invoice-meta-k">BILL NO.</span> <span className="invoice-meta-v">{data.billNo}</span>
            </div>
            <div className="invoice-meta-line">
              <span className="invoice-meta-k">BILL DATE :-</span> <span className="invoice-meta-v">{data.billDate}</span>
            </div>
            <div className="invoice-meta-line">
              <span className="invoice-meta-k">BILL PERIOD :-</span>{' '}
              <span className="invoice-meta-v">
                {data.periodFrom} TO {data.periodTo}
              </span>
            </div>
            <div className="invoice-meta-line">
              <span className="invoice-meta-k">SAC CODE :-</span> <span className="invoice-meta-v">{cell(data.sacCode)}</span>
            </div>
          </div>
        </div>

        <div className="invoice-period-title">{data.billMonthLabel ? `BILL MONTH OF - ${data.billMonthLabel}` : '\u00a0'}</div>

        <table className="invoice-table">
          <thead>
            <tr>
              <th>SR.NO</th>
              <th>DATE</th>
              <th>CUSTOMER NAME</th>
              <th>COURIER NAME</th>
              <th>COURIER NO</th>
              <th>DESTINATION</th>
              <th>WEIGHT</th>
              <th>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r, idx) => (
              <tr key={`${r.courierNumber}-${idx}`}>
                <td className="t-center">{idx + 1}</td>
                <td className="t-center">{fmtDate(r.bookingDate)}</td>
                <td>{cell(r.customerName)}</td>
                <td>{cell(r.courierName)}</td>
                <td className="t-center">{cell(r.courierNumber)}</td>
                <td>{cell(r.destination)}</td>
                <td className="t-center">{cell(r.weight)}</td>
                <td className="t-right">{cell(r.amount)}</td>
              </tr>
            ))}
            {data.rows.length === 0 && (
              <tr>
                <td colSpan={8} className="t-center">
                  No rows
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="invoice-footer">
          <div className="invoice-footer-left">
            <div className="invoice-words">{amountToWordsINR(net)}</div>
            <div className="invoice-remark">
              <div className="invoice-remark-k">REMARK :-</div>
              <div className="invoice-remark-v">{data.remark?.trim() ? data.remark : '\u00a0'}</div>
            </div>
          </div>
          <div className="invoice-footer-right">
            <div className="invoice-summary">
              <div className="invoice-summary-row">
                <div className="k">GRAND TOTAL</div>
                <div className="v">{fmtMoney(subtotal)}</div>
              </div>
              <div className="invoice-summary-row">
                <div className="k">CGST {cgstPct} %</div>
                <div className="v">{fmtMoney(cgst)}</div>
              </div>
              <div className="invoice-summary-row">
                <div className="k">SGST {sgstPct} %</div>
                <div className="v">{fmtMoney(sgst)}</div>
              </div>
              <div className="invoice-summary-row">
                <div className="k">ROUND OFF</div>
                <div className="v">{fmtMoney(roundOff)}</div>
              </div>
              <div className="invoice-summary-row invoice-summary-strong">
                <div className="k">TOTAL</div>
                <div className="v">{fmtMoney(net)}</div>
              </div>
            </div>
            <div className="invoice-for">
              <div>FOR,</div>
              <div className="invoice-for-name">{data.companyName}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

