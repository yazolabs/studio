<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ItemPriceResource;
use App\Models\ItemPrice;
use App\Models\ItemPriceHistory;
use App\Services\ItemPriceService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;
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

        $cost = (float) ($payload['cost'] ?? 0);
        $price = (float) ($payload['price'] ?? 0);
        $payload['margin'] = $cost > 0
            ? round((($price - $cost) / $cost) * 100, 2)
            : 0;


        $priceModel = $this->service->create($payload);

        ItemPriceHistory::create([
            'item_id' => $priceModel->item_id,
            'old_price' => null,
            'new_price' => $priceModel->price,
            'change_date' => Carbon::now(),
            'changed_by' => Auth::id(),
            'reason' => $payload['notes'] ?? null,
        ]);

        return (new ItemPriceResource($priceModel))
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

        $cost = (float) ($payload['cost'] ?? $itemPrice->cost ?? 0);
        $price = (float) ($payload['price'] ?? $itemPrice->price ?? 0);
        $payload['margin'] = $cost > 0
            ? round((($price - $cost) / $cost) * 100, 2)
            : 0;

        $oldPrice = $itemPrice->price;


        $updated = $this->service->update($itemPrice, $payload);


        if ($oldPrice != $updated->price) {
            ItemPriceHistory::create([
                'item_id' => $updated->item_id,
                'old_price' => $oldPrice,
                'new_price' => $updated->price,
                'change_date' => Carbon::now(),
                'changed_by' => Auth::id(),
                'reason' => $payload['notes'] ?? null,
            ]);
        }

        return new ItemPriceResource($updated);
    }

    public function destroy(ItemPrice $itemPrice)
    {
        $this->service->delete($itemPrice);
        return response()->noContent();
    }
}
