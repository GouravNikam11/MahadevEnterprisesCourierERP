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

export function InvoicePrint({ data }: { data: InvoicePrintData }) {
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

        <div className="invoice-totals">
          <div className="invoice-total-line">
            <span>SUBTOTAL</span>
            <span className="invoice-total-v">{cell(data.subtotal)}</span>
          </div>
          <div className="invoice-total-line invoice-total-strong">
            <span>TOTAL</span>
            <span className="invoice-total-v">{cell(data.total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

