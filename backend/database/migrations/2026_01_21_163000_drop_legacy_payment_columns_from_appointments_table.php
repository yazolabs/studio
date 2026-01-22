<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn([
                'payment_method',
                'card_brand',
                'installments',
                'installment_fee',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->string('payment_method', 60)->nullable()->after('final_price');
            $table->string('card_brand', 50)->nullable()->after('payment_method');
            $table->unsignedInteger('installments')->nullable()->after('card_brand');
            $table->decimal('installment_fee', 5, 2)->nullable()->after('installments');
        });
    }
};
