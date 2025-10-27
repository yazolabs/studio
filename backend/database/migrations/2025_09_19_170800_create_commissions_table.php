<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('commissions', function (Blueprint $table) {
            $table->increments('id');
            $table->foreignId('professional_id')->constrained('professionals')->cascadeOnDelete();
            $table->foreignId('appointment_id')->constrained('appointments')->cascadeOnDelete();
            $table->foreignId('service_id')->constrained('services')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->date('date');
            $table->decimal('service_price', 12, 2);
            $table->string('commission_type', 20);
            $table->decimal('commission_value', 12, 2);
            $table->decimal('commission_amount', 12, 2);
            $table->string('status', 20)->default('pending');
            $table->date('payment_date')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['professional_id', 'status']);
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commissions');
    }
};
