<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PromotionResource;
use App\Models\Promotion;
use App\Services\PromotionService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Symfony\Component\HttpFoundation\Response;

class PromotionController extends Controller
{
    public function __construct(private readonly PromotionService $service)
    {
    }

    public function index(Request $request)
    {
        $query = Promotion::query()
            ->with(['services:id', 'items:id'])
            ->orderByDesc('start_date')
            ->orderBy('name');

        if ($search = trim($request->get('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('active')) {
            $active = $request->input('active');

            if ($active === '1' || $active === 1 || $active === true || $active === 'true') {
                $query->where('active', true);
            } elseif ($active === '0' || $active === 0 || $active === false || $active === 'false') {
                $query->where('active', false);
            }
        }

        if ($validOn = $request->input('valid_on')) {
            $query
                ->whereDate('start_date', '<=', $validOn)
                ->where(function ($q) use ($validOn) {
                    $q->whereNull('end_date')
                        ->orWhereDate('end_date', '>=', $validOn);
                });
        }

        $promotions = $query->get();

        return PromotionResource::collection($promotions);
    }

    public function store(Request $request)
    {
        $payload = Arr::only($request->all(), [
            'name',
            'description',
            'discount_type',
            'discount_value',
            'start_date',
            'end_date',
            'active',
            'min_purchase_amount',
            'max_discount',
            'is_recurring',
            'recurrence_type',
            'recurrence_weekdays',
            'recurrence_week_of_month',
            'recurrence_month',
            'recurrence_day_of_month',
        ]);

        $promotion = $this->service->create($payload);

        $this->syncRelations($promotion, $request);

        return (new PromotionResource($promotion->load(['services', 'items'])))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Promotion $promotion)
    {
        return new PromotionResource(
            $promotion->load(['services:id', 'items:id'])
        );
    }

    public function update(Request $request, Promotion $promotion)
    {
        $payload = Arr::only($request->all(), [
            'name',
            'description',
            'discount_type',
            'discount_value',
            'start_date',
            'end_date',
            'active',
            'min_purchase_amount',
            'max_discount',
            'is_recurring',
            'recurrence_type',
            'recurrence_weekdays',
            'recurrence_week_of_month',
            'recurrence_month',
            'recurrence_day_of_month',
        ]);

        $updated = $this->service->update($promotion, $payload);

        $this->syncRelations($updated, $request);

        return new PromotionResource($updated->load(['services', 'items']));
    }

    public function destroy(Promotion $promotion)
    {
        $promotion->services()->detach();
        $promotion->items()->detach();
        $this->service->delete($promotion);

        return response()->noContent();
    }

    private function syncRelations(Promotion $promotion, Request $request): void
    {
        if ($request->has('applicable_services')) {
            $promotion->services()->sync((array) $request->input('applicable_services'));
        }

        if ($request->has('applicable_items')) {
            $promotion->items()->sync((array) $request->input('applicable_items'));
        }
    }
}
