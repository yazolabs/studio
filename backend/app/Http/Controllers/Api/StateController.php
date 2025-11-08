<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\State;
use Illuminate\Http\Request;

class StateController extends Controller
{
    public function index(Request $request)
    {
        $states = State::orderBy('name')->get(['id', 'name', 'uf']);
        return response()->json($states);
    }
}
