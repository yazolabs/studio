<?php

use App\Http\Controllers\Api\{ AccountPayableController, ActionController, AppointmentController, AuthController, CashierTransactionController, CommissionController, CustomerController, ItemController, ItemPriceController, ItemPriceHistoryController, PermissionController, ProfessionalController, PromotionController, RoleController, ScreenController, ServiceController, StateController, SupplierController, UserController};
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

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

    Route::prefix('services')->controller(ServiceController::class)->group(function () {
        Route::get('/', 'index')->middleware('permission:services,read');
        Route::post('/', 'store')->middleware('permission:services,create');
        Route::get('/{service}', 'show')->middleware('permission:services,read');
        Route::put('/{service}', 'update')->middleware('permission:services,update');
        Route::delete('/{service}', 'destroy')->middleware('permission:services,delete');
    });

    Route::prefix('professionals')->controller(ProfessionalController::class)->group(function () {
        Route::get('/', 'index')->middleware('permission:professionals,read');
        Route::post('/', 'store')->middleware('permission:professionals,create');
        Route::get('/{professional}', 'show')->middleware('permission:professionals,read');
        Route::put('/{professional}', 'update')->middleware('permission:professionals,update');
        Route::delete('/{professional}', 'destroy')->middleware('permission:professionals,delete');
    });

    Route::prefix('customers')->controller(CustomerController::class)->group(function () {
        Route::get('/', 'index')->middleware('permission:customers,read');
        Route::post('/', 'store')->middleware('permission:customers,create');
        Route::get('/{customer}', 'show')->middleware('permission:customers,read');
        Route::put('/{customer}', 'update')->middleware('permission:customers,update');
        Route::delete('/{customer}', 'destroy')->middleware('permission:customers,delete');
    });

    Route::prefix('suppliers')->controller(SupplierController::class)->group(function () {
        Route::get('/', 'index')->middleware('permission:suppliers,read');
        Route::post('/', 'store')->middleware('permission:suppliers,create');
        Route::get('/{supplier}', 'show')->middleware('permission:suppliers,read');
        Route::put('/{supplier}', 'update')->middleware('permission:suppliers,update');
        Route::delete('/{supplier}', 'destroy')->middleware('permission:suppliers,delete');
    });

    Route::prefix('items')->controller(ItemController::class)->group(function () {
        Route::get('/', 'index')->middleware('permission:items,read');
        Route::post('/', 'store')->middleware('permission:items,create');
        Route::get('/{item}', 'show')->middleware('permission:items,read');
        Route::put('/{item}', 'update')->middleware('permission:items,update');
        Route::delete('/{item}', 'destroy')->middleware('permission:items,delete');
    });

    Route::prefix('promotions')->controller(PromotionController::class)->group(function () {
        Route::get('/', 'index')->middleware('permission:promotions,read');
        Route::post('/', 'store')->middleware('permission:promotions,create');
        Route::get('/{promotion}', 'show')->middleware('permission:promotions,read');
        Route::put('/{promotion}', 'update')->middleware('permission:promotions,update');
        Route::delete('/{promotion}', 'destroy')->middleware('permission:promotions,delete');
    });

    Route::prefix('appointments')->controller(AppointmentController::class)->group(function () {
        Route::get('/', 'index')->middleware('permission:appointments,read');
        Route::post('/', 'store')->middleware('permission:appointments,create');
        Route::get('/{appointment}', 'show')->middleware('permission:appointments,read');
        Route::put('/{appointment}', 'update')->middleware('permission:appointments,update');
        Route::delete('/{appointment}', 'destroy')->middleware('permission:appointments,delete');
        Route::get('/calendar', [AppointmentController::class, 'calendar'])->middleware('permission:appointments,read');
        Route::patch('/{appointment}/checkout', [AppointmentController::class, 'checkout'])->middleware('permission:appointments,update');
    });

    Route::prefix('commissions')->controller(CommissionController::class)->group(function () {
        Route::get('/', 'index')->middleware('permission:commissions,read');
        Route::post('/', 'store')->middleware('permission:commissions,create');
        Route::get('/{commission}', 'show')->middleware('permission:commissions,read');
        Route::put('/{commission}', 'update')->middleware('permission:commissions,update');
        Route::delete('/{commission}', 'destroy')->middleware('permission:commissions,delete');
        Route::patch('/{commission}/mark-paid', 'markAsPaid')->middleware('permission:commissions,update');
    });

    Route::prefix('cashier')->controller(CashierTransactionController::class)->group(function () {
        Route::get('/', 'index')->middleware('permission:cashier,read');
        Route::post('/', 'store')->middleware('permission:cashier,create');
        Route::get('/{cashierTransaction}', 'show')->middleware('permission:cashier,read');
        Route::put('/{cashierTransaction}', 'update')->middleware('permission:cashier,update');
        Route::delete('/{cashierTransaction}', 'destroy')->middleware('permission:cashier,delete');
    });

    Route::prefix('accounts-payable')->controller(AccountPayableController::class)->group(function () {
        Route::get('/', 'index')->middleware('permission:accounts-payable,read');
        Route::post('/', 'store')->middleware('permission:accounts-payable,create');
        Route::get('/{accountPayable}', 'show')->middleware('permission:accounts-payable,read');
        Route::put('/{accountPayable}', 'update')->middleware('permission:accounts-payable,update');
        Route::delete('/{accountPayable}', 'destroy')->middleware('permission:accounts-payable,delete');
        Route::patch('/{accountPayable}/mark-paid', 'markAsPaid')->middleware('permission:accounts-payable,update');
    });

    Route::prefix('item-prices')->controller(ItemPriceController::class)->group(function () {
        Route::get('/', 'index')->middleware('permission:item-prices,read');
        Route::post('/', 'store')->middleware('permission:item-prices,create');
        Route::get('/{itemPrice}', 'show')->middleware('permission:item-prices,read');
        Route::put('/{itemPrice}', 'update')->middleware('permission:item-prices,update');
        Route::delete('/{itemPrice}', 'destroy')->middleware('permission:item-prices,delete');
    });

    Route::prefix('item-price-histories')->controller(ItemPriceHistoryController::class)->group(function () {
        Route::get('/', 'index')->middleware('permission:item-price-histories,read');
        Route::post('/', 'store')->middleware('permission:item-price-histories,create');
        Route::get('/{itemPriceHistory}', 'show')->middleware('permission:item-price-histories,read');
        Route::put('/{itemPriceHistory}', 'update')->middleware('permission:item-price-histories,update');
        Route::delete('/{itemPriceHistory}', 'destroy')->middleware('permission:item-price-histories,delete');
    });

    Route::prefix('states')->controller(StateController::class)->group(function () {
        Route::get('/', 'index');
    });
});
