<?php

use App\Http\Controllers\Api\{ActionController, AuthController, CharacterController, CharacterTaskController, ItemController, ItemPriceController, ItemPriceHistoryController, PermissionController, RoleController, ScreenController, ServerController, SkillController, TaskController, UserController, VocationController};
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::prefix('users')->controller(UserController::class)->group(function () {
        Route::get('/', 'index')->middleware('permission:users,read');
        Route::post('/', 'store')->middleware('permission:users,create');
        Route::get('/{user}', 'show')->middleware('permission:users,read');
        Route::put('/{user}', 'update')->middleware('permission:users,update');
        Route::delete('/{user}', 'destroy')->middleware('permission:users,delete');
    });

    Route::prefix('roles')->controller(RoleController::class)->group(function () {
        Route::get('/', 'index')->middleware('permission:roles,read');
        Route::post('/', 'store')->middleware('permission:roles,create');
        Route::get('/{role}', 'show')->middleware('permission:roles,read');
        Route::put('/{role}', 'update')->middleware('permission:roles,update');
        Route::delete('/{role}', 'destroy')->middleware('permission:roles,delete');
    });

    Route::prefix('screens')->controller(ScreenController::class)->group(function () {
        Route::get('/', 'index')->middleware('permission:screens,read');
        Route::post('/', 'store')->middleware('permission:screens,create');
        Route::get('/{screen}', 'show')->middleware('permission:screens,read');
        Route::put('/{screen}', 'update')->middleware('permission:screens,update');
        Route::delete('/{screen}', 'destroy')->middleware('permission:screens,delete');
    });

    Route::prefix('actions')->controller(ActionController::class)->group(function () {
        Route::get('/', 'index')->middleware('permission:actions,read');
        Route::post('/', 'store')->middleware('permission:actions,create');
        Route::get('/{action}', 'show')->middleware('permission:actions,read');
        Route::put('/{action}', 'update')->middleware('permission:actions,update');
        Route::delete('/{action}', 'destroy')->middleware('permission:actions,delete');
    });

    Route::prefix('permissions')->controller(PermissionController::class)->group(function () {
        Route::get('/', 'index')->middleware('permission:permissions,read');
        Route::post('/', 'store')->middleware('permission:permissions,create');
        Route::get('/{permission}', 'show')->middleware('permission:permissions,read');
        Route::put('/{permission}', 'update')->middleware('permission:permissions,update');
        Route::delete('/{permission}', 'destroy')->middleware('permission:permissions,delete');
    });

    // Exemplo de como construir as rotas da API
    // ---------------------------------------------------------------------------------------
    // Route::prefix('entidades')->controller(EntidadeController::class)->group(function () {
    //     Route::get('/', 'index')->middleware('permission:entidades,read');
    //     Route::post('/', 'store')->middleware('permission:entidades,create');
    //     Route::get('/{entidade}', 'show')->middleware('permission:entidades,read');
    //     Route::put('/{entidade}', 'update')->middleware('permission:entidades,update');
    //     Route::delete('/{entidade}', 'destroy')->middleware('permission:entidades,delete');
    // });
});
