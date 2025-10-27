<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ItemPriceResource;
use App\Models\ItemPrice;
use App\Services\ItemPriceService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Symfony\Component\HttpFoundation\Response;

class ItemPriceController extends Controller
{
    public function __construct(private readonly ItemPriceService $service)
    {
    }

    public function index(Request $request)
    {
        $prices = $this->service->paginate($request->all());

        return ItemPriceResource::collection($prices);
    }

    public function store(Request $request)
    {
        $payload = Arr::only($request->all(), [
            'item_id',
            'price',
            'cost',
            'margin',
            'effective_date',
            'notes',
        ]);

        $price = $this->service->create($payload);

        return (new ItemPriceResource($price))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(ItemPrice $itemPrice)
    {
        return new ItemPriceResource($itemPrice);
    }

    public function update(Request $request, ItemPrice $itemPrice)
    {
        $payload = Arr::only($request->all(), [
            'item_id',
            'price',
            'cost',
            'margin',
            'effective_date',
            'notes',
        ]);

        $updated = $this->service->update($itemPrice, $payload);

        return new ItemPriceResource($updated);
    }

    public function destroy(ItemPrice $itemPrice)
    {
        $this->service->delete($itemPrice);

        return response()->noContent();
    }
}
