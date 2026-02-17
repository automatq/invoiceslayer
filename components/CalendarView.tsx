"use client";

import { useState } from "react";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday
} from "date-fns";
import { ChevronLeft, ChevronRight, FileText, Receipt, RefreshCw, DollarSign, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { cn } from "@/lib/utils";
import { CalendarEvent } from "@/app/actions/calendar";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface CalendarViewProps {
    events: CalendarEvent[];
}

export function CalendarView({ events }: CalendarViewProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const goToToday = () => setCurrentMonth(new Date());

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const getEventsForDay = (day: Date) => {
        return events.filter((event) => isSameDay(new Date(event.date), day));
    };

    const getEventColor = (type: CalendarEvent["type"]) => {
        switch (type) {
            case "INVOICE": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
            case "QUOTE": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
            case "RECURRING": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
            case "PAYMENT": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
            case "EXPENSE": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getEventIcon = (type: CalendarEvent["type"]) => {
        switch (type) {
            case "INVOICE": return <FileText className="h-3 w-3" />;
            case "QUOTE": return <Receipt className="h-3 w-3" />;
            case "RECURRING": return <RefreshCw className="h-3 w-3" />;
            case "PAYMENT": return <DollarSign className="h-3 w-3" />;
            case "EXPENSE": return <CreditCard className="h-3 w-3" />;
        }
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold ml-2">
                    {format(currentMonth, "MMMM yyyy")}
                </h2>
                <div className="flex items-center space-x-2">
                    <InteractiveButton variant="outline" size="sm" onClick={goToToday}>Today</InteractiveButton>
                    <div className="flex items-center border rounded-md">
                        <Button variant="ghost" size="icon" onClick={prevMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={nextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground mb-2">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
            </div>

            <div className="grid grid-cols-7 gap-1 flex-1 min-h-[500px]">
                {days.map((day, idx) => {
                    const dayEvents = getEventsForDay(day);
                    return (
                        <div
                            key={day.toString()}
                            className={cn(
                                "min-h-[100px] p-2 border rounded-md flex flex-col gap-1 transition-colors hover:bg-muted/50",
                                !isSameMonth(day, monthStart) && "bg-muted/20 text-muted-foreground",
                                isToday(day) && "bg-accent/10 border-primary/50"
                            )}
                        >
                            <div className="flex justify-between items-start">
                                <span className={cn(
                                    "text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full",
                                    isToday(day) && "bg-primary text-primary-foreground"
                                )}>
                                    {format(day, "d")}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 mt-1">
                                {dayEvents.map((event) => (
                                    <Popover key={event.id}>
                                        <PopoverTrigger asChild>
                                            <div className={cn(
                                                "text-xs px-1.5 py-0.5 rounded border truncate cursor-pointer flex items-center gap-1",
                                                getEventColor(event.type)
                                            )}>
                                                {getEventIcon(event.type)}
                                                <span className="truncate">{event.title}</span>
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 p-3">
                                            <div className="space-y-2">
                                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                                    {getEventIcon(event.type)}
                                                    {event.type}
                                                </h4>
                                                <p className="text-sm">{event.title}</p>
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>{format(new Date(event.date), "PPP")}</span>
                                                    {event.amount && <span>${event.amount.toFixed(2)}</span>}
                                                </div>
                                                {event.status && (
                                                    <Badge variant="outline" className="text-[10px] h-5">
                                                        {event.status}
                                                    </Badge>
                                                )}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                ))}
                                {dayEvents.length > 3 && ( // Simple collapse logic if needed, currently showing all
                                    // Could add a "+X more" here if we limit the map above
                                    null
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
