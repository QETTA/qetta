'use client'

/**
 * Verify Preview Result Component
 *
 * Displays verification result header and sensor data table.
 *
 * @module components/dashboard/verify/verify-preview-result
 */

import {
  type DocumentInfo,
  type SensorReading,
  VERIFY_STATUS_STYLES,
} from './verify-preview-constants'

// =============================================================================
// Types
// =============================================================================

export interface VerifyPreviewResultProps {
  documentInfo: DocumentInfo
  sensorData: SensorReading[]
  confidence: number
}

// =============================================================================
// Sub-components
// =============================================================================

interface ResultHeaderProps {
  documentInfo: DocumentInfo
  confidence: number
}

function ResultHeader({ documentInfo, confidence }: ResultHeaderProps) {
  const status = VERIFY_STATUS_STYLES[documentInfo.status]

  return (
    <div className="p-4 sm:p-5 bg-emerald-500/10 border-b border-emerald-500/20">
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div className="w-[44px] h-[44px] rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-6 h-6 text-emerald-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Result Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${status.badge}`}
            >
              <span>{status.icon}</span>
              {status.text}
            </span>
            <span className="text-[10px] text-zinc-500">
              {confidence}% accuracy
            </span>
          </div>
          <div className="text-[13px] font-medium text-white truncate">
            {documentInfo.name}
          </div>
        </div>
      </div>

      {/* Document Details */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="flex items-center gap-2 text-zinc-300">
          <span className="text-zinc-500">Hash:</span>
          <code className="font-mono text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded ring-1 ring-white/10 truncate">
            {documentInfo.hash.slice(0, 8)}...{documentInfo.hash.slice(-8)}
          </code>
        </div>
        <div className="flex items-center gap-2 text-zinc-300">
          <span className="text-zinc-500">Created:</span>
          <span>{documentInfo.created}</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-300 col-span-2">
          <span className="text-zinc-500">Signature:</span>
          <span className="text-emerald-400 font-medium">
            {documentInfo.issuer}
          </span>
        </div>
      </div>
    </div>
  )
}

interface SensorDataTableProps {
  sensorData: SensorReading[]
}

function SensorDataTable({ sensorData }: SensorDataTableProps) {
  return (
    <div className="ring-1 ring-white/10 rounded-lg overflow-hidden">
      <table
        className="w-full text-[11px]"
        role="grid"
        aria-label="Source sensor data traceback results"
      >
        <caption className="sr-only">
          Source sensor measurement data linked to document - Sensor ID, Metric, Value, Time,
          Location
        </caption>
        <thead>
          <tr className="bg-zinc-800/50 border-b border-white/10">
            <th
              scope="col"
              className="px-3 py-2 text-left font-medium text-zinc-400"
            >
              Sensor ID
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-left font-medium text-zinc-400 hidden sm:table-cell"
            >
              Metric
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-left font-medium text-zinc-400"
            >
              Value
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-left font-medium text-zinc-400 hidden md:table-cell"
            >
              Time
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-left font-medium text-zinc-400 hidden lg:table-cell"
            >
              Location
            </th>
          </tr>
        </thead>
        <tbody>
          {sensorData.map((sensor, idx) => (
            <tr
              key={sensor.id}
              className={`${idx !== sensorData.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/5 transition-colors`}
            >
              <td className="px-3 py-2 font-mono text-zinc-300">
                {sensor.id}
              </td>
              <td className="px-3 py-2 text-zinc-300 hidden sm:table-cell">
                {sensor.type}
              </td>
              <td className="px-3 py-2 font-medium text-white">{sensor.value}</td>
              <td className="px-3 py-2 text-zinc-500 hidden md:table-cell">
                {sensor.time}
              </td>
              <td className="px-3 py-2 text-zinc-500 hidden lg:table-cell">
                {sensor.location}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DataFlowDiagram() {
  return (
    <div className="flex items-center justify-center gap-3 my-4 text-[10px] text-zinc-500">
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-blue-400" />
        <span>Sensor</span>
      </div>
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-zinc-400" />
        <span>Hash</span>
      </div>
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-emerald-400" />
        <span>Document</span>
      </div>
      <svg
        className="w-4 h-4 rotate-180"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
      <span className="text-emerald-400 font-medium">Traceback</span>
    </div>
  )
}

function Footer() {
  return (
    <div className="h-[40px] bg-zinc-800/50 border-t border-white/10 flex items-center justify-between px-4">
      <div className="flex items-center gap-2 text-[10px] text-zinc-400">
        <svg
          className="w-3 h-3 text-emerald-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>SHA-256 Hash Chain Verification</span>
      </div>
      <button
        className="h-[26px] px-3 text-[11px] font-medium text-white bg-white/10 hover:bg-white/15 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-1 focus:ring-offset-zinc-900"
        aria-label="View document verification details"
      >
        View Details
      </button>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function VerifyPreviewResult({
  documentInfo,
  sensorData,
  confidence,
}: VerifyPreviewResultProps) {
  return (
    <div className="lg:w-[60%] flex flex-col overflow-hidden">
      {/* Verification Result Header */}
      <ResultHeader documentInfo={documentInfo} confidence={confidence} />

      {/* Reverse Data Extraction */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-5">
          {/* Section Header */}
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-4 h-4 text-zinc-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-[13px] font-semibold text-white">
              Source Sensor Data Traceback
            </span>
            <span className="text-[10px] text-zinc-500 ml-auto">
              {sensorData.length} linked
            </span>
          </div>

          <SensorDataTable sensorData={sensorData} />
          <DataFlowDiagram />
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default VerifyPreviewResult
