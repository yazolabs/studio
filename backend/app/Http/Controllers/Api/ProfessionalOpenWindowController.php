<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProfessionalOpenWindowResource;
use App\Models\Professional;
use App\Models\ProfessionalOpenWindow;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfessionalOpenWindowController extends Controller
{
    public function index(Request $request)
    {
        $query = ProfessionalOpenWindow::query()
            ->with('professional')
            ->orderBy('start_date');

        if ($request->filled('professional_id')) {
            $query->where('professional_id', $request->professional_id);
        }

        $windows = $query->get();

        return ProfessionalOpenWindowResource::collection($windows);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'professional_id' => ['required', 'exists:professionals,id'],
            'start_date'      => ['required', 'date'],
            'end_date'        => ['required', 'date', 'after_or_equal:start_date'],
            'status'          => ['nullable', Rule::in(['open', 'closed'])],
        ]);

        $professional = Professional::findOrFail($validated['professional_id']);

        $window = $professional->openWindows()->create([
            'start_date' => $validated['start_date'],
            'end_date'   => $validated['end_date'],
            'status'     => $validated['status'] ?? 'open',
        ]);

        return new ProfessionalOpenWindowResource($window);
    }

    public function update(Request $request, ProfessionalOpenWindow $professionalOpenWindow)
    {
        $validated = $request->validate([
            'start_date' => ['sometimes', 'date'],
            'end_date'   => ['sometimes', 'date', 'after_or_equal:start_date'],
            'status'     => ['sometimes', Rule::in(['open', 'closed'])],
        ]);

        $professionalOpenWindow->fill($validated);
        $professionalOpenWindow->save();

        return new ProfessionalOpenWindowResource($professionalOpenWindow);
    }

    public function destroy(ProfessionalOpenWindow $professionalOpenWindow)
    {
        $professionalOpenWindow->delete();

        return response()->json([], 204);
    }
}
