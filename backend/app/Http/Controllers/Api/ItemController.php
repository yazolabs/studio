<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ItemResource;
use App\Models\Item;
use App\Services\ItemService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Symfony\Component\HttpFoundation\Response;

class ItemController extends Controller
{
    public function __construct(private readonly ItemService $service)
    {
    }

    public function index(Request $request)
    {
        $items = $this->service->paginate($request->all());

        return ItemResource::collection($items);
    }

    public function store(Request $request)
    {
        $data = Arr::only($request->all(), [
            'name',
            'description',
            'price',
            'cost',
            'stock',
            'min_stock',
            'category',
            'supplier_id',
            'barcode',
            'commission_type',
            'commission_value',
        ]);

        $item = $this->service->create($data);

        return (new ItemResource($item))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Item $item)
    {
        return new ItemResource($item);
    }

    public function update(Request $request, Item $item)
    {
        $data = Arr::only($request->all(), [
            'name',
            'description',
            'price',
            'cost',
            'stock',
            'min_stock',
            'category',
            'supplier_id',
            'barcode',
            'commission_type',
            'commission_value',
        ]);

        $updated = $this->service->update($item, $data);

        return new ItemResource($updated);
    }

    public function destroy(Item $item)
    {
        $this->service->delete($item);

        return response()->noContent();
    }
}
