'use client'

import * as React from 'react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import {
  format, addMonths, subMonths,
  startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay,
  isWithinInterval, startOfWeek, endOfWeek,
  isBefore, isToday, isSameMonth, isAfter
} from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DateRangePickerProps {
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
  className?: string
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function getCalendarDays(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month))
  const end = endOfWeek(endOfMonth(month))
  return eachDayOfInterval({ start, end })
}

interface MonthGridProps {
  month: Date
  dateRange: DateRange | undefined
  hoverDate: Date | undefined
  onDayClick: (day: Date) => void
  onDayHover: (day: Date) => void
}

function MonthGrid({ month, dateRange, hoverDate, onDayClick, onDayHover }: MonthGridProps) {
  const days = getCalendarDays(month)
  const today = new Date()

  const getEffectiveRange = (): { start: Date; end: Date } | null => {
    const { from, to } = dateRange ?? {}
    const rangeEnd = to ?? (from && hoverDate ? hoverDate : undefined)
    if (!from || !rangeEnd) return null
    if (isBefore(rangeEnd, from)) return { start: rangeEnd, end: from }
    return { start: from, end: rangeEnd }
  }

  const effectiveRange = getEffectiveRange()

  // Group into weeks
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className="select-none">
      <p className="text-[11px] font-semibold text-center text-slate-800 mb-2 tracking-wide">
        {format(month, 'MMMM yyyy')}
      </p>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="h-6 flex items-center justify-center text-[9px] font-bold text-slate-400 tracking-wider uppercase">
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map((day, di) => {
            const inMonth = isSameMonth(day, month)
            const isPast = isBefore(day, today) && !isToday(day)
            const isDisabled = isPast
            const isStart = dateRange?.from ? isSameDay(day, dateRange.from) : false
            const isEnd = dateRange?.to ? isSameDay(day, dateRange.to) : false
            const isSelected = isStart || isEnd
            const isInRange = effectiveRange
              ? isWithinInterval(day, { start: effectiveRange.start, end: effectiveRange.end })
              : false
            const isRangeStart = effectiveRange ? isSameDay(day, effectiveRange.start) : false
            const isRangeEnd = effectiveRange ? isSameDay(day, effectiveRange.end) : false
            const isSingleDay = isRangeStart && isRangeEnd

            // Background band logic (continuous strip across range)
            const showBand = isInRange && !isSingleDay
            const bandClass = showBand
              ? cn(
                  'absolute inset-y-0 bg-brand-50',
                  isRangeStart ? 'left-1/2 right-0' :
                  isRangeEnd ? 'left-0 right-1/2' :
                  'left-0 right-0'
                )
              : null

            return (
              <div key={di} className="relative h-7 flex items-center justify-center">
                {/* Continuous range band */}
                {bandClass && <div className={bandClass} />}

                {/* Day button */}
                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && onDayClick(day)}
                  onMouseEnter={() => !isDisabled && onDayHover(day)}
                  className={cn(
                    'relative z-10 h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-medium transition-all duration-150',
                    !inMonth && 'text-slate-300 pointer-events-none',
                    inMonth && !isDisabled && !isSelected && 'text-slate-700 hover:bg-slate-100 cursor-pointer',
                    isPast && inMonth && 'text-slate-300 cursor-not-allowed',
                    isToday(day) && !isSelected && 'border border-slate-300 font-semibold',
                    isSelected && 'bg-slate-900 text-white font-semibold shadow-md scale-105',
                  )}
                >
                  {format(day, 'd')}
                </button>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export function DateRangePicker({ date, setDate, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [baseMonth, setBaseMonth] = useState(() => startOfMonth(new Date()))
  const [hoverDate, setHoverDate] = useState<Date | undefined>()
  const [direction, setDirection] = useState<1 | -1>(1)
  const [slideKey, setSlideKey] = useState(0)

  const secondMonth = addMonths(baseMonth, 1)

  const handleDayClick = (day: Date) => {
    if (!date?.from || (date.from && date.to)) {
      setDate({ from: day, to: undefined })
      setHoverDate(undefined)
    } else {
      if (isBefore(day, date.from)) {
        setDate({ from: day, to: date.from })
      } else {
        setDate({ from: date.from, to: day })
      }
    }
  }

  const navigate = (dir: 1 | -1) => {
    setDirection(dir)
    setSlideKey(k => k + dir)
    setBaseMonth(m => dir === 1 ? addMonths(m, 1) : subMonths(m, 1))
  }

  const nightCount = date?.from && date?.to
    ? Math.round((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24))
    : null

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 32 : -32, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.22, ease: 'easeOut' as const } },
    exit: (d: number) => ({ x: d > 0 ? -32 : 32, opacity: 0, transition: { duration: 0.15, ease: 'easeIn' as const } }),
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'w-full flex items-center gap-3 px-4 h-11 border rounded-lg bg-white text-left transition-all duration-200',
            open
              ? 'border-brand-500 ring-2 ring-brand-500/15 shadow-sm'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-sm',
            className
          )}
        >
          <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />
          {date?.from ? (
            <span className="flex-1 flex items-center gap-3 text-sm font-medium text-slate-800">
              <span className={cn(date.from && 'text-brand-700 font-semibold')}>
                {format(date.from, 'd MMM yyyy')}
              </span>
              <span className="text-slate-400 text-xs">→</span>
              <span className={cn(date.to ? 'text-brand-700 font-semibold' : 'text-slate-400')}>
                {date.to ? format(date.to, 'd MMM yyyy') : 'Select end date'}
              </span>
            </span>
          ) : (
            <span className="text-sm text-slate-400">Select start & go-live dates</span>
          )}
        </button>
      </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-auto p-0 border-0 shadow-2xl rounded-2xl overflow-hidden bg-white"
          style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)' }}
        >
        {/* Status bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-white">
          {/* Start date pill */}
          <div className={cn(
            'flex-1 px-3 py-2 rounded-lg transition-all duration-200',
            !date?.to ? 'bg-slate-900 shadow-sm' : 'bg-slate-50'
          )}>
            <p className={cn('text-[8px] font-bold uppercase tracking-widest mb-0.5', !date?.to ? 'text-white/50' : 'text-slate-400')}>
              Start Date
            </p>
            <p className={cn('text-xs font-bold', !date?.to ? 'text-white' : date?.from ? 'text-slate-900' : 'text-slate-300')}>
              {date?.from ? format(date.from, 'd MMM yyyy') : '— — —'}
            </p>
          </div>

          <div className="text-slate-300">→</div>

          {/* End date pill */}
          <div className={cn(
            'flex-1 px-3 py-2 rounded-lg transition-all duration-200',
            date?.from && !date?.to ? 'bg-slate-900 shadow-sm' : 'bg-slate-50'
          )}>
            <p className={cn('text-[8px] font-bold uppercase tracking-widest mb-0.5', date?.from && !date?.to ? 'text-white/50' : 'text-slate-400')}>
              Go-Live Date
            </p>
            <p className={cn('text-xs font-bold', date?.from && !date?.to ? 'text-white' : date?.to ? 'text-slate-900' : 'text-slate-300')}>
              {date?.to ? format(date.to, 'd MMM yyyy') : '— — —'}
            </p>
          </div>

          {(date?.from || date?.to) && (
            <button
              type="button"
              onClick={() => { setDate(undefined); setHoverDate(undefined) }}
              className="text-[9px] font-bold uppercase tracking-widest text-slate-300 hover:text-red-400 transition-colors px-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Calendar */}
        <div className="relative px-4 pt-4 pb-2 overflow-hidden"
          onMouseLeave={() => setHoverDate(undefined)}
        >
          {/* Navigation arrows */}
          <div className="absolute top-4 left-5 right-5 flex justify-between z-20 pointer-events-none">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="pointer-events-auto h-6 w-6 flex items-center justify-center rounded-full border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <ChevronLeft className="h-2.5 w-2.5 text-slate-600" />
            </button>
            <button
              type="button"
              onClick={() => navigate(1)}
              className="pointer-events-auto h-6 w-6 flex items-center justify-center rounded-full border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <ChevronRight className="h-2.5 w-2.5 text-slate-600" />
            </button>
          </div>

          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div
              key={slideKey}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="grid grid-cols-2 gap-6"
            >
              <MonthGrid
                month={baseMonth}
                dateRange={date}
                hoverDate={hoverDate}
                onDayClick={handleDayClick}
                onDayHover={setHoverDate}
              />
              <MonthGrid
                month={secondMonth}
                dateRange={date}
                hoverDate={hoverDate}
                onDayClick={handleDayClick}
                onDayHover={setHoverDate}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
          <p className="text-[10px] text-slate-400">
            {nightCount !== null
              ? <><span className="font-bold text-slate-700">{nightCount}</span> days selected</>
              : <>{date?.from ? 'Now select your go-live date' : 'Select your start date'}</>
            }
          </p>
          {date?.from && date?.to && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[9px] font-bold uppercase tracking-widest text-white bg-slate-900 hover:bg-slate-700 px-4 py-1.5 rounded-full transition-all hover:shadow-md"
            >
              Confirm
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
