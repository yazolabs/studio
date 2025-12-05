<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Service;
use App\Models\Professional;
use App\Models\Appointment;
use App\Models\AppointmentService;
use App\Models\Promotion;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function summary()
    {
        $today = Carbon::today();
        $now   = Carbon::now();

        $startOfMonth      = $now->copy()->startOfMonth();
        $endOfMonth        = $now->copy()->endOfMonth();
        $startOfLastMonth  = $now->copy()->subMonthNoOverflow()->startOfMonth();
        $endOfLastMonth    = $now->copy()->subMonthNoOverflow()->endOfMonth();

        $totalCustomers = Customer::where('active', 1)
            ->whereNull('deleted_at')
            ->count();

        $customersThisMonth = Customer::whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->whereNull('deleted_at')
            ->count();

        $customersLastMonth = Customer::whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])
            ->whereNull('deleted_at')
            ->count();

        $customersChangePercent = $customersLastMonth > 0
            ? round((($customersThisMonth - $customersLastMonth) / $customersLastMonth) * 100, 1)
            : null;

        $appointmentsToday = Appointment::whereDate('date', $today)
            ->whereNull('deleted_at')
            ->count();

        $pendingAppointments = Appointment::whereDate('date', $today)
            ->where('status', 'scheduled')
            ->whereNull('deleted_at')
            ->count();

        $activeServices = Service::where('active', 1)
            ->whereNull('deleted_at')
            ->count();

        $serviceCategories = Service::whereNull('deleted_at')
            ->whereNotNull('category')
            ->distinct('category')
            ->count('category');

        $monthRevenue = Appointment::whereBetween('date', [$startOfMonth, $endOfMonth])
            ->where('status', 'completed')
            ->whereNull('deleted_at')
            ->sum('final_price');

        $lastMonthRevenue = Appointment::whereBetween('date', [$startOfLastMonth, $endOfLastMonth])
            ->where('status', 'completed')
            ->whereNull('deleted_at')
            ->sum('final_price');

        $revenueChangePercent = $lastMonthRevenue > 0
            ? round((($monthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1)
            : null;

        return response()->json([
            'total_customers'          => $totalCustomers,
            'customers_change_percent' => $customersChangePercent,
            'appointments_today'       => $appointmentsToday,
            'pending_appointments'     => $pendingAppointments,
            'active_services'          => $activeServices,
            'service_categories'       => $serviceCategories,
            'month_revenue'            => (float) $monthRevenue,
            'revenue_change_percent'   => $revenueChangePercent,
        ]);
    }

    public function professionalsSchedule(Request $request)
    {
        $date = $request->query('date')
            ? Carbon::parse($request->query('date'))
            : Carbon::today();

        $start = $date->copy()->startOfDay();
        $end   = $date->copy()->endOfDay();

        $professionals = Professional::with('user')
            ->where('active', 1)
            ->whereNull('deleted_at')
            ->get();

        $appointments = AppointmentService::query()
            ->with(['appointment.customer', 'service'])
            ->whereBetween('starts_at', [$start, $end])
            ->get()
            ->groupBy('professional_id');

        $data = $professionals->map(function ($professional) use ($appointments) {
            $workSchedule = $professional->work_schedule ?? [];

            $todayAppointments = collect($appointments->get($professional->id, []))
                ->map(function ($as) {
                    return [
                        'id'            => $as->appointment_id,
                        'time'          => optional($as->starts_at)->format('H:i'),
                        'customer_name' => optional($as->appointment->customer)->name,
                        'service_name'  => optional($as->service)->name,
                        'status'        => $as->appointment->status,
                    ];
                })
                ->values();

            return [
                'id'                  => $professional->id,
                'name'                => optional($professional->user)->name,
                'specialties'         => $professional->specialties ?? [],
                'work_schedule'       => $workSchedule,
                'todays_appointments' => $todayAppointments,
            ];
        });

        return response()->json([
            'date' => $date->toDateString(),
            'data' => $data,
        ]);
    }

    public function recentAppointments()
    {
        $appointments = Appointment::with('customer')
            ->whereNull('deleted_at')
            ->orderByDesc('date')
            ->orderByDesc('created_at')
            ->limit(4)
            ->get();

        return response()->json(
            $appointments->map(function ($apt) {
                return [
                    'id'            => $apt->id,
                    'customer_name' => optional($apt->customer)->name,
                    'service_name'  => null,
                    'time'          => $apt->start_time
                        ? Carbon::parse($apt->start_time)->format('H:i')
                        : '',
                    'date'          => $apt->date->toDateString(),
                ];
            })
        );
    }

    public function popularServices()
    {
        $now           = Carbon::now();
        $startOfMonth  = $now->copy()->startOfMonth();
        $endOfMonth    = $now->copy()->endOfMonth();

        $rows = AppointmentService::query()
            ->join('appointments', 'appointments.id', '=', 'appointment_service.appointment_id')
            ->join('services', 'services.id', '=', 'appointment_service.service_id')
            ->whereBetween('appointments.date', [$startOfMonth, $endOfMonth])
            ->whereNull('appointments.deleted_at')
            ->groupBy('services.id', 'services.name')
            ->select([
                'services.id',
                'services.name',
                DB::raw('COUNT(*) as total'),
            ])
            ->orderByDesc('total')
            ->limit(4)
            ->get();

        $totalAll = $rows->sum('total') ?: 1;

        return response()->json(
            $rows->map(function ($row) use ($totalAll) {
                return [
                    'id'         => $row->id,
                    'name'       => $row->name,
                    'count'      => (int) $row->total,
                    'percentage' => round(($row->total / $totalAll) * 100),
                ];
            })
        );
    }

   public function promotions()
    {
        $promotions = Promotion::query()
            ->whereNull('deleted_at')
            ->orderBy('start_date')
            ->get();

        $mapped = $promotions->map(function (Promotion $promotion) {
            
            $type = method_exists($promotion->discount_type, 'value')
                ? $promotion->discount_type->value
                : ($promotion->discount_type ?? 'discount');

            return [
                'id'       => $promotion->id,
                'name'     => $promotion->name,
                'type'     => in_array($type, ['discount', 'package', 'loyalty'])
                    ? $type
                    : 'discount',
                'discount' => (float) $promotion->discount_value,
                'usage'    => 0,        
                'target'   => 0,        
                'revenue'  => 0,        
                'status'   => $promotion->active ? 'active' : 'expired',
                'endDate'  => optional($promotion->end_date)->toDateString(),
            ];
        });

        return response()->json($mapped);
    }
}
