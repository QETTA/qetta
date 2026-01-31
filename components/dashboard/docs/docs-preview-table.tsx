'use client'

/**
 * Docs Preview Table Component
 *
 * Spreadsheet-style table for displaying TMS sensor data.
 *
 * @module components/dashboard/docs/docs-preview-table
 */

import {
  COLUMNS,
  STATUS_STYLES,
  SENSOR_ICONS,
  getGaugeColor,
  calculatePercentage,
  type DataRow,
} from './docs-preview-constants.js'

// =============================================================================
// Types
// =============================================================================

export interface DocsPreviewTableProps {
  data: DataRow[]
}

// =============================================================================
// Component
// =============================================================================

export function DocsPreviewTable({ data }: DocsPreviewTableProps) {
  return (
    <div className="flex-1 overflow-auto">
      <table
        className="w-full border-collapse text-[13px]"
        role="grid"
        aria-label="TMS Sensor Measurement Data"
      >
        <caption className="sr-only">
          TMS Daily Report - Sensor measurements, thresholds, and status information
        </caption>
        <thead className="sticky top-0 z-10">
          <tr className="bg-zinc-800">
            <th
              scope="col"
              className="w-[46px] min-w-[46px] h-[24px] border-r border-b border-white/10 bg-zinc-800"
            >
              <span className="sr-only">Row number</span>
            </th>
            {COLUMNS.map((col, i) => (
              <th
                key={col}
                scope="col"
                className="min-w-[100px] h-[24px] border-r border-b border-white/10 text-[12px] font-normal text-zinc-400 bg-zinc-800"
                style={{ width: i === 0 ? '80px' : i === 7 ? '100px' : '100px' }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((dataItem, rowIndex) => (
            <TableRow key={rowIndex} dataItem={dataItem} rowIndex={rowIndex} />
          ))}
          {/* Empty rows */}
          {[...Array(8)].map((_, i) => (
            <tr key={`empty-${i}`}>
              <td className="w-[46px] h-[28px] border-r border-b border-white/10 text-center text-[12px] text-zinc-500 bg-zinc-800/50">
                {data.length + i + 1}
              </td>
              {COLUMNS.map((_, j) => (
                <td
                  key={`empty-col-${j}`}
                  className="h-[28px] border-r border-b border-white/10"
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// =============================================================================
// TableRow Component
// =============================================================================

interface TableRowProps {
  dataItem: DataRow
  rowIndex: number
}

function TableRow({ dataItem, rowIndex }: TableRowProps) {
  const row = dataItem.row
  const status = row[4]
  // Map Korean status to English for styling
  const statusMap: Record<string, string> = {
    '정상': 'Normal',
    '주의': 'Warning',
    '위험': 'Danger',
    '기록': 'Logged',
    '완료': 'Complete',
  }
  const mappedStatus = statusMap[status] || status
  const statusStyle = STATUS_STYLES[mappedStatus]
  const isHeaderRow = rowIndex === 0
  const isVerificationRow = rowIndex === 8
  const isEmptyRow = !row[0]
  const percentage =
    !isHeaderRow && !isVerificationRow && !isEmptyRow
      ? calculatePercentage(row[1], row[2])
      : null

  return (
    <tr
      className={`
        ${isHeaderRow ? 'bg-blue-500/10' : ''}
        ${isVerificationRow ? 'bg-emerald-500/10' : ''}
        ${!isHeaderRow && !isVerificationRow && !isEmptyRow && statusStyle?.row ? statusStyle.row : ''}
        ${(status === 'Danger' || status === '위험') && !isHeaderRow ? 'bg-red-500/5' : ''}
      `}
    >
      <td className="w-[46px] h-[28px] border-r border-b border-white/10 text-center text-[12px] text-zinc-500 bg-zinc-800/50">
        {rowIndex + 1}
      </td>
      {row.map((cell, cellIndex) => (
        <TableCell
          key={cellIndex}
          cell={cell}
          cellIndex={cellIndex}
          dataItem={dataItem}
          status={mappedStatus}
          statusStyle={statusStyle}
          isHeaderRow={isHeaderRow}
          isVerificationRow={isVerificationRow}
          isEmptyRow={isEmptyRow}
          percentage={percentage}
        />
      ))}
    </tr>
  )
}

// =============================================================================
// TableCell Component
// =============================================================================

interface TableCellProps {
  cell: string
  cellIndex: number
  dataItem: DataRow
  status: string
  statusStyle: (typeof STATUS_STYLES)[string] | undefined
  isHeaderRow: boolean
  isVerificationRow: boolean
  isEmptyRow: boolean
  percentage: number | null
}

function TableCell({
  cell,
  cellIndex,
  dataItem,
  status,
  statusStyle,
  isHeaderRow,
  isVerificationRow,
  isEmptyRow,
  percentage,
}: TableCellProps) {
  // Item column with sensor icon (cellIndex === 0)
  if (cellIndex === 0 && !isHeaderRow && cell) {
    return (
      <td
        className={`h-[28px] border-r border-b border-white/10 px-2 ${
          isVerificationRow ? 'font-semibold text-emerald-400' : 'text-white'
        }`}
      >
        <div className="flex items-center gap-2">
          {SENSOR_ICONS[cell] || null}
          <span>{cell}</span>
        </div>
      </td>
    )
  }

  // Measurement value with gauge bar (cellIndex === 1)
  if (
    cellIndex === 1 &&
    !isHeaderRow &&
    !isVerificationRow &&
    !isEmptyRow &&
    percentage !== null
  ) {
    return (
      <td className="h-[28px] border-r border-b border-white/10 px-2 text-white">
        <div className="flex items-center gap-2">
          <span className="font-mono min-w-[40px]">{cell}</span>
          <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getGaugeColor(percentage)}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-500 min-w-[28px] text-right">
            {percentage}%
          </span>
        </div>
      </td>
    )
  }

  // Threshold with status-based background (cellIndex === 2)
  if (cellIndex === 2 && !isHeaderRow && !isEmptyRow && cell) {
    return (
      <td
        className={`h-[28px] border-r border-b border-white/10 px-2 text-zinc-300 ${
          status === 'Normal'
            ? 'bg-emerald-500/5'
            : status === 'Warning'
              ? 'bg-amber-500/5'
              : status === 'Danger'
                ? 'bg-red-500/5'
                : ''
        }`}
      >
        {cell}
      </td>
    )
  }

  // Status badge (cellIndex === 4)
  if (cellIndex === 4 && !isHeaderRow && statusStyle && cell) {
    return (
      <td className="h-[28px] border-r border-b border-white/10 px-2">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${statusStyle.badge}`}
        >
          <span>{statusStyle.icon}</span>
          {cell}
        </span>
      </td>
    )
  }

  // Hash with verification badge (cellIndex === 7)
  if (cellIndex === 7 && !isHeaderRow && dataItem.hash) {
    return (
      <td className="h-[28px] border-r border-b border-white/10 px-2">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
              dataItem.verified
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-zinc-700 text-zinc-500'
            }`}
          >
            {dataItem.verified ? '✓' : '?'}
          </span>
          <span className="font-mono text-[11px] text-zinc-500">
            {dataItem.hash.slice(0, 4)}...{dataItem.hash.slice(-4)}
          </span>
        </div>
      </td>
    )
  }

  // Default cell rendering
  return (
    <td
      className={`h-[28px] border-r border-b border-white/10 px-2 ${
        isHeaderRow
          ? 'font-semibold text-blue-400'
          : isVerificationRow
            ? 'font-semibold text-emerald-400'
            : cellIndex === 7
              ? 'text-zinc-500 font-mono text-[11px]'
              : 'text-zinc-300'
      }`}
    >
      {cell}
    </td>
  )
}

export default DocsPreviewTable
