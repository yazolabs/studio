<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ItemPriceHistoryResource;
use App\Models\ItemPriceHistory;
use App\Services\ItemPriceHistoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Symfony\Component\HttpFoundation\Response;

class ItemPriceHistoryController extends Controller
{
    public function __construct(private readonly ItemPriceHistoryService $service)
    {
    }

    public function index(Request $request)
    {
        $histories = $this->service->paginate($request->all());

        return ItemPriceHistoryResource::collection($histories);
    }

    public function store(Request $request)
    {
        $payload = Arr::only($request->all(), [
            'item_id',
            'old_price',
            'new_price',
            'change_date',
            'changed_by',
            'reason',
        ]);

        $history = $this->service->create($payload);

        return (new ItemPriceHistoryResource($history))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(ItemPriceHistory $itemPriceHistory)
    {
        return new ItemPriceHistoryResource($itemPriceHistory);
    }

    public function update(Request $request, ItemPriceHistory $itemPriceHistory)
    {
        $payload = Arr::only($request->all(), [
            'item_id',
            'old_price',
            'new_price',
            'change_date',
            'changed_by',
            'reason',
        ]);

        $updated = $this->service->update($itemPriceHistory, $payload);

        return new ItemPriceHistoryResource($updated);
    }

    public function destroy(ItemPriceHistory $itemPriceHistory)
    {
        $this->service->delete($itemPriceHistory);

        return response()->noContent();
    }
}
