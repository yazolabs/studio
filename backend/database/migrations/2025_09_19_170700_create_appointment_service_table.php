<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('appointment_service', function (Blueprint $table) {
            $table->increments('id');
            $table->foreignId('appointment_id')->constrained('appointments')->cascadeOnDelete();
            $table->foreignId('service_id')->constrained('services')->cascadeOnDelete();
            $table->foreignId('professional_id')->nullable()->constrained('professionals')->nullOnDelete();
            $table->decimal('service_price', 12, 2);
            $table->string('commission_type', 20)->nullable();
            $table->decimal('commission_value', 12, 2)->default(0);
            $table->timestamps();

            $table->unique(['appointment_id', 'service_id', 'professional_id'], 'appointment_service_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointment_service');
    }
};
