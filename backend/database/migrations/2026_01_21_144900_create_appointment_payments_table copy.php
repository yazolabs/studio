<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('appointment_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained()->cascadeOnDelete();
            $table->string('method', 50);
            $table->decimal('base_amount', 10, 2)->default(0);
            $table->decimal('fee_percent', 8, 2)->default(0);
            $table->decimal('fee_amount', 10, 2)->default(0);
            $table->decimal('amount', 10, 2);
            $table->string('card_brand', 50)->nullable();
            $table->unsignedSmallInteger('installments')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['appointment_id', 'method']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointment_payments');
    }
};
