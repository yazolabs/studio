<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('appointment_service_promotion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_service_id')->constrained('appointment_service')->cascadeOnDelete();
            $table->foreignId('promotion_id')->constrained('promotions')->restrictOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->decimal('applied_value', 12, 2)->nullable();
            $table->decimal('applied_percent', 6, 2)->nullable();
            $table->decimal('discount_amount', 12, 2)->nullable();
            $table->foreignId('applied_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['appointment_service_id', 'promotion_id'], 'asp_unique');
            $table->index(['appointment_service_id', 'sort_order'], 'asp_service_sort_idx');
            $table->index(['promotion_id'], 'asp_promo_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointment_service_promotion');
    }
};
